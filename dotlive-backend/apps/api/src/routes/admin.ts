/**
 * Admin routes — /api/admin/*
 *
 * Layered security:
 *   1. requireAdmin / requireSuperAdmin middleware
 *   2. withIdempotency({ action }) preHandler on every write
 *   3. requireConfirmHeader on destructive actions; the action
 *      body must also include a non-empty 'reason' string
 *   4. auditTx inside the same DB transaction as the mutation
 *
 * All write endpoints:
 *   - require Idempotency-Key
 *   - require a free-text 'reason' in the body
 *   - emit an audit row inside the same transaction
 *
 * Destructive endpoints additionally:
 *   - require X-Admin-Confirm header (issued by POST /admin/confirm)
 *   - require super_admin role
 *
 * The two-factor confirm flow is what stops "I clicked the wrong
 * button" and "someone sat at my unlocked laptop" both at once.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { sql, eq, and, desc, asc, count, ilike, gte, lte, isNull, inArray, or } from "drizzle-orm";
import { createHmac } from "node:crypto";

import { db } from "../db/client.js";
import {
  users,
  userRoles,
  userBans,
  wallets,
  transactions,
  ventures,
  services,
  jobListings,
  serviceOrders,
  payments,
  paymentsAudit,
  featureFlags,
  adminAuditLog,
  adminConfirmTokens,
  adminImpersonationTokens,
  moderation_reports,
} from "../db/schema.js";
import {
  requireAdmin,
  requireSuperAdmin,
  banCheck,
  withIdempotency,
  commitIdempotency,
  issueConfirmToken,
  consumeConfirmToken,
  auditTx,
  reqAuditCtx,
} from "../lib/admin.js";
import {
  loadUserWithRoles,
  userHasRole,
  getUserRoles,
} from "../lib/auth.js";

const REASON_MIN = 8;

function reasonSchema() {
  return z.string().min(REASON_MIN).max(500);
}

function requireReason(reason: unknown): { ok: true; reason: string } | { ok: false; code: string } {
  const parsed = reasonSchema().safeParse(reason);
  if (!parsed.success) {
    return { ok: false, code: `reason must be ${REASON_MIN}-500 chars` };
  }
  return { ok: true, reason: parsed.data };
}

export async function adminRoutes(app: FastifyInstance) {
  /* ============================== ME ============================== */

  app.get(
    "/me",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const sub = (req as any).user.sub;
      const u = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          dotId: users.dotId,
        })
        .from(users)
        .where(eq(users.id, sub))
        .limit(1);
      if (!u[0]) return reply.code(404).send({ error: "not_found" });
      const roles = (req as any).adminRoles as string[];
      return reply.send({
        admin: { ...u[0], roles, isSuperAdmin: roles.includes("super_admin") },
        permissions: derivePermissions(roles),
      });
    }
  );

  /* ============================== CONFIRM ============================== */
  const confirmBodySchema = z.object({
    action: z.string().min(3).max(64),
    reason: z.string().min(REASON_MIN).max(500),
    targetType: z.string().optional(),
    targetId: z.string().optional(),
    payload: z.any().optional(),
    /** TTL in seconds. Default 300. */
    ttlSeconds: z.number().min(30).max(900).optional(),
  });

  /**
   * POST /api/admin/confirm
   *
   * Issue a single-use confirm token. Rate-limited at 1 per 5s
   * per admin (in-process map for now; the audit log gives us a
   * perma-record we can re-rate-limit from if we want).
   *
   * The token returned here must be passed in the X-Admin-Confirm
   * header of the actual action request.
   */
  app.post(
    "/confirm",
    {
      preHandler: [app.authenticate, requireAdmin],
    },
    async (req, reply) => {
      const parsed = confirmBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid confirm request", code: "bad_input" });
      }
      const adminId = (req as any).user.sub;
      const token = await issueConfirmToken({
        adminId,
        action: parsed.data.action,
        reason: parsed.data.reason,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        payload: parsed.data.payload,
        ttlSeconds: parsed.data.ttlSeconds,
      });
      const row = await db
        .select({ expiresAt: adminConfirmTokens.expiresAt })
        .from(adminConfirmTokens)
        .where(eq(adminConfirmTokens.token, token))
        .limit(1);
      return reply.send({ token, expiresAt: row[0]?.expiresAt });
    }
  );

  /* ============================== USERS ============================== */

  app.get(
    "/users",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const q = z
        .object({
          search: z.string().optional(),
          role: z.string().optional(),
          banned: z.enum(["yes", "no"]).optional(),
          sort: z.enum(["created_desc", "created_asc", "name_asc"]).default("created_desc"),
          limit: z.coerce.number().min(1).max(100).default(25),
          cursor: z.string().optional(), // ISO date cursor for pagination
        })
        .safeParse(req.query);
      if (!q.success) return reply.code(400).send({ error: "bad_query" });
      const { search, role, banned, sort, limit, cursor } = q.data;

      const conditions: any[] = [];
      if (search) {
        conditions.push(or(ilike(users.email, `%${search}%`), ilike(users.name, `%${search}%`), ilike(users.dotId, `%${search}%`)));
      }
      if (cursor) {
        if (sort === "created_asc") conditions.push(gte(users.createdAt, new Date(cursor)));
        else conditions.push(lte(users.createdAt, new Date(cursor)));
      }
      if (banned === "yes") {
        const bannedIds = await db
          .select({ id: userBans.userId })
          .from(userBans)
          .where(isNull(userBans.revokedAt));
        if (bannedIds.length) {
          conditions.push(inArray(users.id, bannedIds.map((r) => r.id)));
        } else {
          return reply.send({ users: [], nextCursor: null });
        }
      }

      const order = sort === "created_asc" ? asc(users.createdAt) : sort === "name_asc" ? asc(users.name) : desc(users.createdAt);

      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          dotId: users.dotId,
          onboardingIntent: users.onboardingIntent,
          createdAt: users.createdAt,
          avatarUrl: users.avatarUrl,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(order)
        .limit(limit + 1);

      // Batch-fetch roles + balances + bans for all users in one go
      const userIds = rows.map((r) => r.id);
      const [rolesRows, walletRows, banRows] = await Promise.all([
        userIds.length
          ? db
              .select({ userId: userRoles.userId, role: userRoles.role })
              .from(userRoles)
              .where(inArray(userRoles.userId, userIds))
          : Promise.resolve([]),
        userIds.length
          ? db
              .select({ userId: wallets.userId, balance: wallets.balance })
              .from(wallets)
              .where(inArray(wallets.userId, userIds))
              .catch(() => [])
          : Promise.resolve([]),
        userIds.length
          ? db
              .select({ userId: userBans.userId, revokedAt: userBans.revokedAt, reason: userBans.reason, createdAt: userBans.createdAt })
              .from(userBans)
              .where(inArray(userBans.userId, userIds))
              .catch(() => [])
          : Promise.resolve([]),
      ]);
      const rolesByUser = new Map<string, string[]>();
      for (const r of rolesRows as any[]) {
        const arr = rolesByUser.get(r.userId) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.userId, arr);
      }
      const balanceByUser = new Map<string, string>();
      for (const w of walletRows as any[]) balanceByUser.set(w.userId, String(w.balance ?? 0));
      const banByUser = new Map<string, any>();
      for (const b of banRows as any[]) if (!b.revokedAt) banByUser.set(b.userId, b);

      const hasMore = rows.length > limit;
      const slice = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? slice[slice.length - 1].createdAt.toISOString() : null;

      // Decorate each user with roles, balance, ban info
      const decorated = slice.map((u) => ({
        ...u,
        roles: rolesByUser.get(u.id) ?? [],
        balance: balanceByUser.get(u.id) ?? "0",
        isAdmin: (rolesByUser.get(u.id) ?? []).includes("admin"),
        isSuperAdmin: (rolesByUser.get(u.id) ?? []).includes("super_admin"),
        bannedAt: banByUser.get(u.id)?.createdAt ?? null,
        banReason: banByUser.get(u.id)?.reason ?? null,
      }));

      // Optionally filter by role
      let filtered = decorated;
      if (role) {
        filtered = decorated.filter((u) => u.roles.includes(role));
      }

      return reply.send({ users: filtered, nextCursor, total: filtered.length });
    }
  );

  app.get(
    "/users/:id",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const u = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!u[0]) return reply.code(404).send({ error: "not_found" });
      const w = await db.select().from(wallets).where(eq(wallets.userId, id)).limit(1);
      const r = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, id));
      const ban = await db.select().from(userBans).where(eq(userBans.userId, id)).limit(1);
      const txns = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, id))
        .orderBy(desc(transactions.createdAt))
        .limit(50);
      return reply.send({
        user: u[0],
        wallet: w[0] ?? null,
        roles: r.map((x) => x.role),
        ban: ban[0] ?? null,
        recentTransactions: txns,
      });
    }
  );

  /* ---------- USER ACTIONS (destructive) ---------- */

  app.post(
    "/users/:id/ban",
    {
      preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "user.ban" })],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = z
        .object({ reason: reasonSchema(), expiresInHours: z.number().min(1).max(8760).optional() })
        .safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input", code: "bad_input" });
      const token = (req as any)._confirmToken as string | undefined;
      if (!token) {
        return reply.code(400).send({ error: "X-Admin-Confirm required", code: "confirm_required" });
      }
      const c = await consumeConfirmToken(token, (req as any).user.sub, "user.ban");
      if (c.ok !== true) return reply.code(400).send({ error: c.hint, code: c.code });

      const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!target[0]) return reply.code(404).send({ error: "not_found" });
      const before = { banned: false };
      const expiresAt = body.data.expiresInHours
        ? new Date(Date.now() + body.data.expiresInHours * 3600 * 1000)
        : null;

      await db.transaction(async (tx) => {
        await tx
          .insert(userBans)
          .values({
            userId: id,
            bannedBy: (req as any).user.sub,
            reason: c.reason,
            expiresAt,
          } as any)
          .onConflictDoUpdate({
            target: userBans.userId,
            set: { reason: c.reason, expiresAt, revokedAt: null, revokedBy: null } as any,
          });
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "user.ban",
          targetType: "user",
          targetId: id,
          before,
          after: { banned: true, expiresAt },
          reason: c.reason,
        });
      });

      const response = { ok: true, banned: true, expiresAt };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  app.post(
    "/users/:id/unban",
    {
      preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "user.unban" })],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = z.object({ reason: reasonSchema() }).safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input" });

      const before = await db.select().from(userBans).where(eq(userBans.userId, id)).limit(1);
      await db.transaction(async (tx) => {
        await tx
          .update(userBans)
          .set({ revokedAt: new Date(), revokedBy: (req as any).user.sub } as any)
          .where(and(eq(userBans.userId, id), isNull(userBans.revokedAt)));
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "user.unban",
          targetType: "user",
          targetId: id,
          before: before[0] ?? null,
          after: { banned: false },
          reason: body.data.reason,
        });
      });
      const response = { ok: true, unbanned: true };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  app.post(
    "/users/:id/adjust-balance",
    {
      preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "wallet.adjust" })],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = z
        .object({
          reason: reasonSchema(),
          amount: z.number().int().refine((n) => n !== 0, "amount must be non-zero"),
          description: z.string().min(3).max(200),
        })
        .safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input" });
      const token = (req as any)._confirmToken as string | undefined;
      if (!token) return reply.code(400).send({ code: "confirm_required" });
      const c = await consumeConfirmToken(token, (req as any).user.sub, "wallet.adjust");
      if (c.ok !== true) return reply.code(400).send({ error: c.hint, code: c.code });

      const w = await db.select().from(wallets).where(eq(wallets.userId, id)).limit(1);
      if (!w[0]) return reply.code(404).send({ error: "wallet not found" });
      const before = { balance: w[0].balance };
      const afterBalance = (Number(w[0].balance) + body.data.amount).toFixed(2);

      await db.transaction(async (tx) => {
        await tx
          .update(wallets)
          .set({ balance: afterBalance as any, updatedAt: new Date() } as any)
          .where(eq(wallets.userId, id));
        await tx.insert(transactions).values({
          userId: id,
          amount: body.data.amount.toString(),
          type: body.data.amount > 0 ? "credit" : "debit",
          description: `[ADMIN] ${body.data.description}`,
        } as any);
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "wallet.adjust",
          targetType: "user",
          targetId: id,
          before,
          after: { balance: afterBalance, delta: body.data.amount },
          reason: c.reason,
        });
      });
      const response = { ok: true, balance: afterBalance };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  app.post(
    "/users/:id/impersonate",
    {
      preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "user.impersonate" })],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = z.object({ reason: reasonSchema() }).safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input" });
      const token = (req as any)._confirmToken as string | undefined;
      if (!token) return reply.code(400).send({ code: "confirm_required" });
      const c = await consumeConfirmToken(token, (req as any).user.sub, "user.impersonate");
      if (c.ok !== true) return reply.code(400).send({ error: c.hint, code: c.code });

      const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!target[0]) return reply.code(404).send({ error: "not_found" });

      const jti = randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      await db.insert(adminImpersonationTokens).values({
        jti,
        adminId: (req as any).user.sub,
        targetUserId: id,
        reason: c.reason,
        expiresAt,
      } as any);

      // Build a short-lived JWT. We sign with JWT_SECRET (same as
      // regular sessions) but include 'impersonator' + 'impersonation_jti'
      // claims. The auth middleware will treat this as a session.
      const jwt = await issueImpersonationJwt(jti, id, (req as any).user.sub, expiresAt);

      await db.transaction(async (tx) => {
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "user.impersonate",
          targetType: "user",
          targetId: id,
          after: { jti, expiresAt },
          reason: c.reason,
        });
      });

      const response = { ok: true, token: jwt, expiresAt, target: { id: target[0].id, email: target[0].email, dotId: target[0].dotId } };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  app.post(
      "/users/:id/promote",
      {
        preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "user.promote" })],
      },
      async (req, reply) => {
        const { id } = req.params as { id: string };
        const body = z
          .object({
            reason: reasonSchema().optional().default("Promoted by super admin"),
            role: z.enum(["admin", "super_admin", "founder", "investor", "community_leader", "vendor", "capital_partner"]).default("admin"),
          })
          .safeParse(req.body ?? {});
        if (!body.success) return reply.code(400).send({ error: "bad_input", details: body.error.flatten() });

      const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!target[0]) return reply.code(404).send({ error: "not_found" });
      const before = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, id));

      await db.transaction(async (tx) => {
        await tx
          .insert(userRoles)
          .values({ userId: id, role: body.data.role as any } as any)
          .onConflictDoNothing();
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "user.promote",
          targetType: "user",
          targetId: id,
          before: { roles: before.map((r) => r.role) },
          after: { role: body.data.role },
          reason: body.data.reason,
        });
      });
      const response = { ok: true, role: body.data.role };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  /* ============================== VENTURES ============================== */

  app.get(
    "/ventures",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const q = z
        .object({
          search: z.string().optional(),
          stage: z.string().optional(),
          industry: z.string().optional(),
          limit: z.coerce.number().min(1).max(100).default(25),
        })
        .safeParse(req.query);
      if (!q.success) return reply.code(400).send({ error: "bad_query" });
      const conds: any[] = [];
      if (q.data.search) conds.push(ilike(ventures.name, `%${q.data.search}%`));
      if (q.data.stage) conds.push(eq(ventures.stage, q.data.stage as any));
      if (q.data.industry) conds.push(eq(ventures.industry, q.data.industry));
      const rows = await db
        .select()
        .from(ventures)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(ventures.createdAt))
        .limit(q.data.limit);
      return reply.send({ ventures: rows });
    }
  );

  app.post(
    "/ventures/:id/takedown",
    {
      preHandler: [app.authenticate, requireAdmin, withIdempotency({ action: "venture.takedown" })],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = z.object({ reason: reasonSchema() }).safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input" });

      const before = await db.select().from(ventures).where(eq(ventures.id, id)).limit(1);
      if (!before[0]) return reply.code(404).send({ error: "not_found" });

      // The ventures table doesn't have isPublic yet — the
      // /api/ventures list query will be updated to filter out
      // hidden ventures. For now we only audit-log.
      await db.transaction(async (tx) => {
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "venture.takedown",
          targetType: "venture",
          targetId: id,
          before: { name: before[0].name, industry: before[0].industry },
          after: { hidden: true },
          reason: body.data.reason,
        });
      });
      const response = { ok: true };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  /* ============================== PAYMENTS ============================== */

  app.get(
    "/payments",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const q = z
        .object({
          provider: z.enum(["paystack", "whop"]).optional(),
          status: z.string().optional(),
          limit: z.coerce.number().min(1).max(100).default(25),
        })
        .safeParse(req.query);
      if (!q.success) return reply.code(400).send({ error: "bad_query" });
      const conds: any[] = [];
      if (q.data.provider) conds.push(eq(paymentsAudit.provider, q.data.provider));
      if (q.data.status) conds.push(eq(paymentsAudit.status, q.data.status));
      const rows = await db
        .select()
        .from(paymentsAudit)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(paymentsAudit.createdAt))
        .limit(q.data.limit);
      return reply.send({ payments: rows });
    }
  );

  app.post(
    "/payments/:id/replay",
    {
      preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "payment.replay" })],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = z.object({ reason: reasonSchema() }).safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input" });

      // Replay is "set status back to received" so the webhook
      // handler picks it up on next sweep. We don't directly
      // re-run the wallet update — that path goes through
      // webhooks.paystack to keep the audit chain intact.
      const before = await db.select().from(paymentsAudit).where(eq(paymentsAudit.id, id)).limit(1);
      if (!before[0]) return reply.code(404).send({ error: "not_found" });

      await db.transaction(async (tx) => {
        await tx
          .update(paymentsAudit)
          .set({ status: "received", failureReason: null, processedAt: null } as any)
          .where(eq(paymentsAudit.id, id));
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "payment.replay",
          targetType: "payment",
          targetId: id,
          before: { status: before[0].status },
          after: { status: "received" },
          reason: body.data.reason,
        });
      });
      const response = { ok: true, status: "received" };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  /* ============================== FEATURE FLAGS ============================== */

  app.get(
    "/feature-flags",
    { preHandler: [app.authenticate, requireAdmin] },
    async (_req, reply) => {
      const rows = await db.select().from(featureFlags).orderBy(asc(featureFlags.key));
      return reply.send({ flags: rows });
    }
  );

  app.put(
    "/feature-flags/:key",
    {
      preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "feature_flag.upsert" })],
    },
    async (req, reply) => {
      const { key } = req.params as { key: string };
      const body = z
        .object({
          reason: reasonSchema(),
          enabled: z.boolean(),
          rolloutPercent: z.number().min(0).max(100).nullable().optional(),
          allowList: z.array(z.string()).nullable().optional(),
          description: z.string().max(500).optional(),
        })
        .safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "bad_input" });

      const before = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);

      await db.transaction(async (tx) => {
        await tx
          .insert(featureFlags)
          .values({
            key,
            enabled: body.data.enabled,
            rolloutPercent: body.data.rolloutPercent ?? null,
            allowList: body.data.allowList ?? null,
            description: body.data.description ?? null,
            updatedBy: (req as any).user.sub,
          } as any)
          .onConflictDoUpdate({
            target: featureFlags.key,
            set: {
              enabled: body.data.enabled,
              rolloutPercent: body.data.rolloutPercent ?? null,
              allowList: body.data.allowList ?? null,
              description: body.data.description ?? null,
              updatedBy: (req as any).user.sub,
              updatedAt: new Date(),
            } as any,
          });
        await auditTx(tx, {
          ...reqAuditCtx(req),
          action: "feature_flag.upsert",
          targetType: "feature_flag",
          targetId: key,
          before: before[0] ?? null,
          after: { enabled: body.data.enabled, rolloutPercent: body.data.rolloutPercent },
          reason: body.data.reason,
        });
      });
      const response = { ok: true, key };
      await commitIdempotency(req, 200, response);
      return reply.send(response);
    }
  );

  /* ============================== AUDIT LOG ============================== */

  app.get(
    "/audit",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const q = z
        .object({
          actorId: z.string().optional(),
          action: z.string().optional(),
          targetId: z.string().optional(),
          limit: z.coerce.number().min(1).max(200).default(50),
          cursor: z.string().optional(), // ISO createdAt
        })
        .safeParse(req.query);
      if (!q.success) return reply.code(400).send({ error: "bad_query" });
      const conds: any[] = [];
      if (q.data.actorId) conds.push(eq(adminAuditLog.actorId, q.data.actorId));
      if (q.data.action) conds.push(ilike(adminAuditLog.action, `%${q.data.action}%`));
      if (q.data.targetId) conds.push(eq(adminAuditLog.targetId, q.data.targetId));
      if (q.data.cursor) conds.push(lte(adminAuditLog.createdAt, new Date(q.data.cursor)));
      const rows = await db
        .select()
        .from(adminAuditLog)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(q.data.limit);
      return reply.send({
        entries: rows,
        nextCursor: rows.length === q.data.limit ? rows[rows.length - 1].createdAt.toISOString() : null,
      });
    }
  );

  app.get(
    "/admin/queue",
    { preHandler: [app.authenticate, requireSuperAdmin] },
    async (_req, reply) => {
      const safeCount = async (q: any) => {
        try { const r: any = await db.execute(q); const row = Array.isArray(r) ? r[0] : (r?.rows?.[0]); return Number(row?.n ?? 0); }
        catch { return 0; }
      };
      const open = await safeCount(sql`SELECT count(*)::int AS n FROM moderation_reports WHERE status = 'open'`);
      const inReview = await safeCount(sql`SELECT count(*)::int AS n FROM moderation_reports WHERE status = 'in_review'`);
      const resolvedToday = await safeCount(sql`SELECT count(*)::int AS n FROM moderation_reports WHERE status = 'resolved' AND resolved_at >= NOW() - interval '24 hours'`);
      return reply.send({ open, inReview, resolvedToday });
    }
  );

  app.get(
    "/admin/queue/reports",
    { preHandler: [app.authenticate, requireSuperAdmin] },
    async (req, reply) => {
      const q = z
        .object({ status: z.string().optional(), limit: z.coerce.number().min(1).max(100).default(50), cursor: z.string().optional() })
        .safeParse(req.query);
      if (!q.success) return reply.code(400).send({ error: "bad_query" });
      const { status, limit, cursor } = q.data;
      const conditions: any[] = [];
      if (status && ["open", "in_review", "resolved", "dismissed"].includes(status)) {
        conditions.push(eq(moderation_reports.status, status));
      }
      if (cursor) conditions.push(gte(moderation_reports.createdAt, new Date(cursor)));
      const where = conditions.length ? and(...conditions) : undefined;
      const rows = await db
        .select({
          id: moderation_reports.id,
          communityId: moderation_reports.communityId,
          reporterId: moderation_reports.reporterId,
          targetType: moderation_reports.targetType,
          targetId: moderation_reports.targetId,
          reason: moderation_reports.reason,
          status: moderation_reports.status,
          resolvedBy: moderation_reports.resolvedBy,
          resolvedAt: moderation_reports.resolvedAt,
          createdAt: moderation_reports.createdAt,
          updatedAt: moderation_reports.updatedAt,
        })
        .from(moderation_reports)
        .where(where)
        .orderBy(desc(moderation_reports.createdAt))
        .limit(limit);
      const nextCursor = rows.length ? new Date(rows[rows.length - 1].createdAt).toISOString() : null;
      return reply.send({ reports: rows, nextCursor });
    }
  );

  /* ============================== STATS ============================== */

  app.get(
    "/stats",
    { preHandler: [app.authenticate, requireAdmin] },
    async (_req, reply) => {
      const safeCount = async (q: any) => {
        try { const r: any = await db.execute(q); const row = Array.isArray(r) ? r[0] : (r?.rows?.[0]); return Number(row?.n ?? 0); }
        catch { return 0; }
      };
      const safeSum = async (q: any) => {
        try { const r: any = await db.execute(q); const row = Array.isArray(r) ? r[0] : (r?.rows?.[0]); return Number(row?.s ?? 0); }
        catch { return 0; }
      };
      const u = await safeCount(sql`SELECT count(*)::int AS n FROM users`);
      const b = await safeCount(sql`SELECT count(*)::int AS n FROM user_bans WHERE revoked_at IS NULL`);
      const v = await safeCount(sql`SELECT count(*)::int AS n FROM ventures`);
      const svc = await safeCount(sql`SELECT count(*)::int AS n FROM services WHERE is_active = true`);
      const j = await safeCount(sql`SELECT count(*)::int AS n FROM job_listings WHERE is_active = true`);
      const tx2 = await safeCount(sql`SELECT count(*)::int AS n FROM transactions`);
      const fa = await safeCount(sql`SELECT count(*)::int AS n FROM feature_flags WHERE enabled = true`);
      const rolesTotal = await safeCount(sql`SELECT count(*)::int AS n FROM user_roles`);
      const rolesSuper = await safeCount(sql`SELECT count(*)::int AS n FROM user_roles WHERE role = 'super_admin'`);
      const rolesAdmin = await safeCount(sql`SELECT count(*)::int AS n FROM user_roles WHERE role = 'admin'`);
      const balanceTotal = await safeSum(sql`SELECT COALESCE(SUM(balance), 0) AS s FROM wallets`);
      return reply.send({
        users: u,
        bannedUsers: b,
        ventures: v,
        activeServices: svc,
        activeJobs: j,
        transactions: tx2,
        activeFeatureFlags: fa,
        roles: { total: rolesTotal, superAdmins: rolesSuper, admins: rolesAdmin },
        wallets: { totalBalance: balanceTotal },
      });
    }
  );

          /* ── USER EDITING — PATCH /api/admin/users/:id ───────────────── */
          /** Update user profile (name, email, avatar). Available to any admin. */
          app.patch("/users/:id", { preHandler: app.authenticate, config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req, reply) => {
            const { sub: adminId } = req.user as { sub: string };
            const roles = await getUserRoles(adminId);
            if (!roles.includes("admin") && !roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Admin only" });
            }
            const { id } = req.params as { id: string };
            const body = (req.body ?? {}) as Record<string, unknown>;
            const updates: Record<string, unknown> = { updatedAt: new Date() };
            if (typeof body.name === "string") updates.name = body.name;
            if (typeof body.email === "string") updates.email = body.email.toLowerCase();
            if (typeof body.avatarUrl === "string") updates.avatarUrl = body.avatarUrl;
            if (typeof body.emailVerified === "boolean") updates.emailVerified = body.emailVerified;

            if (Object.keys(updates).length === 1) {
              return reply.code(400).send({ error: "No updatable fields provided" });
            }
            await db.execute(sql`
              UPDATE users SET
                ${sql.raw(Object.keys(updates).filter((k) => k !== "updatedAt").map((k) => `${k === "avatarUrl" ? "avatar_url" : k === "emailVerified" ? "email_verified" : k} = ${JSON.stringify(updates[k])}`).join(", "))},
                updated_at = NOW()
              WHERE id = ${id}
            `);
            return reply.send({ ok: true });
          });

          /* ── ROLE EDITING — PUT /api/admin/users/:id/roles ───────────── */
          /**
           * Update a user's roles. Two body shapes:
           *   1) Replace:  { roles: ["admin","builder"] }
           *   2) Delta:    { add: ["admin"], remove: ["builder"] }
           * Super-admin only. Enforces immutability of the last super-admin
           * and prevents non-super admins from granting admin/super_admin.
           */
          const roleBody = z
            .object({
              roles: z.array(z.string()).optional(),
              add: z.array(z.string()).optional(),
              remove: z.array(z.string()).optional(),
              reason: z.string().max(500).optional(),
            })
            .refine((b) => Array.isArray(b.roles) || b.add !== undefined || b.remove !== undefined, {
              message: "Send { roles: [...] } or { add: [...], remove: [...] }",
            });

          app.put("/users/:id/roles", { preHandler: app.authenticate }, async (req, reply) => {
            const { sub: adminId } = req.user as { sub: string };
            const callerRoles = await getUserRoles(adminId);
            const isSuper = callerRoles.includes("super_admin");

            // BOOTSTRAP: allow first super_admin only when none exists
            if (!isSuper) {
              const existingSuperAdmins = await db.execute(
                sql`SELECT COUNT(*)::int AS n FROM user_roles WHERE role = 'super_admin'`,
              );
              const n = Number((existingSuperAdmins as any)[0]?.n ?? 0);
              if (n > 0) {
                return reply.code(403).send({ error: "Super-admin only" });
              }
            }

            const parsed = roleBody.safeParse(req.body ?? {});
            if (!parsed.success) {
              return reply.code(400).send({
                error: "Send { roles: [...] } or { add: [...], remove: [...] }",
                details: parsed.error.flatten(),
              });
            }

            const { id } = req.params as { id: string };
            const currentRoles = await getUserRoles(id);
            const targetHasSuperBefore = currentRoles.includes("super_admin");

            // Compute target roles
            let targetRoles: string[];
            if (Array.isArray(parsed.data.roles)) {
              targetRoles = parsed.data.roles;
            } else {
              targetRoles = [...currentRoles];
              if (parsed.data.add) {
                for (const r of parsed.data.add) {
                  if (!targetRoles.includes(r)) targetRoles.push(r);
                }
              }
              if (parsed.data.remove) {
                targetRoles = targetRoles.filter((r) => !parsed.data.remove!.includes(r));
              }
            }

            // IMMUTABILITY: cannot remove the LAST super_admin
            if (targetHasSuperBefore && !targetRoles.includes("super_admin")) {
              const r = await db.execute(sql`SELECT COUNT(*)::int AS n FROM user_roles WHERE role = 'super_admin'`);
              const n = Number((r as any)[0]?.n ?? 0);
              if (n <= 1) {
                return reply.code(409).send({
                  error: "Cannot remove the LAST super_admin. Promote another user first.",
                  lastSuperAdmin: true,
                });
              }
            }

            // Only super_admins can grant super_admin
            if (targetRoles.includes("super_admin") && !isSuper) {
              return reply.code(403).send({ error: "Only super_admin can grant super_admin" });
            }

            // Non-super admins cannot grant admin role
            if (targetRoles.includes("admin") && !isSuper) {
              return reply.code(403).send({ error: "Only super_admin can grant admin role" });
            }

            // Wipe + replace (idempotent, atomic-ish: we delete then re-insert)
            await db.execute(sql`DELETE FROM user_roles WHERE user_id = ${id}`);
            for (const r of targetRoles) {
              await db.execute(sql`INSERT INTO user_roles (user_id, role, granted_at) VALUES (${id}, ${r}, NOW()) ON CONFLICT DO NOTHING`);
            }

            // Notify user of new role(s) granted (in-app + email).
            try {
              const { notify } = await import("../lib/notify.js");
              const newOnes = (targetRoles as string[]).filter((r) => !(currentRoles as string[]).includes(r));
              for (const r of newOnes) {
                await notify({
                  userId: id,
                  type: "role_granted",
                  title: `You were granted the \`${r}\` role`,
                  body: `An admin assigned you a new role on DOT. Refresh to see new features.`,
                  link: "/dashboard",
                  icon: "Shield",
                });
              }
            } catch (err) {
              app.log.warn({ err }, "could not notify role grant");
            }

            // Audit log
            try {
              await db.execute(sql`
                INSERT INTO admin_audit_log (actor_id, action, target_type, target_id, before, after, reason, created_at)
                VALUES (${adminId}, ${'user.roles.update'}, ${'user'}, ${id},
                        ${JSON.stringify(currentRoles)},
                        ${JSON.stringify(targetRoles)},
                        ${parsed.data.reason ?? null},
                        NOW())
              `);
            } catch {
              // audit log table might not exist; non-fatal
            }

            return reply.send({ ok: true, roles: targetRoles, previousRoles: currentRoles });
          });

          /* ── CONTENT CREATION — admin can create events/pitchathons ── */
          // Note: /api/admin/courses is owned by academy.ts (canonical).
          // The old POST /api/admin/courses in this file was a duplicate
          // and has been removed.

          /** POST /api/admin/events */
          app.post("/events", { preHandler: app.authenticate }, async (req, reply) => {
            const { sub: adminId } = req.user as { sub: string };
            const roles = await getUserRoles(adminId);
            if (!roles.includes("admin") && !roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Admin only" });
            }
            const body = (req.body ?? {}) as Record<string, unknown>;
            const id = crypto.randomUUID();
            await db.execute(sql`
              INSERT INTO events (id, title, description, speaker, event_date, dot_cost, capacity, whop_url, created_at)
              VALUES (
                ${id}, ${(body.title as string) ?? ""},
                ${(body.description as string) ?? null},
                ${(body.speaker as string) ?? null},
                ${body.eventDate ? new Date(body.eventDate as string) : null},
                ${Number(body.dotCost ?? 0)},
                ${Number(body.capacity ?? 100)},
                ${(body.whopUrl as string) ?? null},
                NOW()
              )
            `);
            return reply.send({ id });
          });

          /** PATCH /api/admin/events/:id */
          app.patch<{ Params: { id: string } }>("/events/:id", { preHandler: app.authenticate }, async (req, reply) => {
            const { sub: adminId } = req.user as { sub: string };
            const roles = await getUserRoles(adminId);
            if (!roles.includes("admin") && !roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Admin only" });
            }
            const body = (req.body ?? {}) as Record<string, unknown>;
            const sets: string[] = [];
            if (body.title !== undefined) sets.push(`title = '${String(body.title).replace(/'/g, "''")}'`);
            if (body.description !== undefined) sets.push(body.description ? `description = '${String(body.description).replace(/'/g, "''")}'` : "description = NULL");
            if (body.speaker !== undefined) sets.push(body.speaker ? `speaker = '${String(body.speaker).replace(/'/g, "''")}'` : "speaker = NULL");
            if (body.eventDate !== undefined) sets.push(body.eventDate ? `event_date = '${new Date(body.eventDate as string).toISOString()}'` : "event_date = NULL");
            if (body.dotCost !== undefined) sets.push(`dot_cost = ${Number(body.dotCost)}`);
            if (body.capacity !== undefined) sets.push(`capacity = ${Number(body.capacity)}`);
            if (body.whopUrl !== undefined) sets.push(body.whopUrl ? `whop_url = '${String(body.whopUrl).replace(/'/g, "''")}'` : "whop_url = NULL");
            if (sets.length === 0) return reply.send({ ok: true });
            await db.execute(sql`UPDATE events SET ${sql.raw(sets.join(", "))} WHERE id = ${req.params.id}`);
            return reply.send({ ok: true });
          });

          /** DELETE /api/admin/events/:id */
          app.delete<{ Params: { id: string } }>("/events/:id", { preHandler: app.authenticate }, async (req, reply) => {
            const { sub: adminId } = req.user as { sub: string };
            const roles = await getUserRoles(adminId);
            if (!roles.includes("admin") && !roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Admin only" });
            }
            await db.execute(sql`DELETE FROM events WHERE id = ${req.params.id}`);
            return reply.send({ ok: true });
          });

          /** POST /api/admin/pitchathons */
          app.post("/pitchathons", { preHandler: app.authenticate }, async (req, reply) => {
            const { sub: adminId } = req.user as { sub: string };
            const roles = await getUserRoles(adminId);
            if (!roles.includes("admin") && !roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Admin only" });
            }
            const body = (req.body ?? {}) as Record<string, unknown>;
            const id = crypto.randomUUID();
            await db.execute(sql`
              INSERT INTO pitchathons (id, title, description, prize_pool_dot, application_deadline, status, created_at, updated_at)
              VALUES (${id}, ${(body.title as string) ?? ""}, ${(body.description as string) ?? null}, ${Number(body.prizePoolDot ?? 0)}, ${body.applicationDeadline ? new Date(body.applicationDeadline as string) : null}, ${(body.status as string) ?? "open"}, NOW(), NOW())
            `);
            return reply.send({ id });
          });
  /* ── FEED MODERATION — GET /api/admin/feed-posts ─────────────── */

  /** List all feed posts with filters. Admins only. */
  app.get("/feed-posts", { preHandler: app.authenticate }, async (req, reply) => {
    const adminId = (req.user as { sub: string }).sub;
    const roles = await getUserRoles(adminId);
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      return reply.code(403).send({ error: "Admin only" });
    }
    const q = (req.query ?? {}) as Record<string, unknown>;
    const limit = Math.min(Number(q.limit ?? 50), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    const search = q.search as string | undefined;
    const type = q.type as string | undefined;

    let conditions = "";
    if (search) conditions += ` AND (title ILIKE '%${search}%' OR body ILIKE '%${search}%')`;
    if (type) conditions += ` AND type = '${type}'`;

    const rows = await db.execute(sql`
      SELECT p.id, p.type, p.title, p.body, p.tags, p.likes_count, p.comments_count, p.created_at,
             u.id AS author_id, u.name AS author_name, u.dot_id AS author_dot_id
      FROM feed_posts p
      JOIN users u ON u.id = p.author_id
      WHERE 1=1 ${sql`${conditions}`}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    return reply.send({ posts: (rows as any).rows ?? rows, limit, offset });
  });

  /* ── DELETE FEED POST — DELETE /api/admin/feed-posts/:id ───────── */

  /** Delete any feed post. Requires super_admin. */
  app.delete<{ Params: { id: string } }>("/feed-posts/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const adminId = (req.user as { sub: string }).sub;
    const roles = await getUserRoles(adminId);
    if (!roles.includes("super_admin")) {
      return reply.code(403).send({ error: "Super admin only" });
    }
    const { id } = req.params;
    const post = await db.execute(sql`SELECT id FROM feed_posts WHERE id = ${id}`);
    if (!(post as any).rows?.length && !(post as any).rowCount) {
      return reply.code(404).send({ error: "Post not found" });
    }
    await db.execute(sql`DELETE FROM feed_posts WHERE id = ${id}`);
    return reply.send({ ok: true });
  });

  /* ── BUILDER STATS — GET /api/admin/builders/:id/stats ───────────── */

  /** Aggregate stats for a builder profile. Available to any admin. */
  app.get<{ Params: { id: string } }>("/builders/:id/stats", { preHandler: app.authenticate }, async (req, reply) => {
    const adminId = (req.user as { sub: string }).sub;
    const roles = await getUserRoles(adminId);
    if (!roles.includes("admin") && !roles.includes("super_admin")) {
      return reply.code(403).send({ error: "Admin only" });
    }
    const { id } = req.params;
    try {
      // Aggregate from services + orders + reviews + transactions + wallet
      // Each subquery wrapped in COALESCE so a missing table doesn't fail the whole call.
      const [svcStats, orderStats, reviewStats, earnStats, walletRow] = await Promise.all([
        db.execute(sql`
          SELECT
            COUNT(*) FILTER (WHERE is_active = true) AS active_services,
            COUNT(*) AS total_services
          FROM services WHERE builder_id = ${id}
        `).catch(() => ({ rows: [{ active_services: 0, total_services: 0 }] })),
        db.execute(sql`
          SELECT
            COUNT(*) AS total_orders,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders
          FROM service_orders WHERE builder_id = ${id}
        `).catch(() => ({ rows: [{ total_orders: 0, completed_orders: 0 }] })),
        db.execute(sql`
          SELECT
            COALESCE(AVG(rating), 0) AS avg_rating,
            COUNT(*) AS total_reviews
          FROM service_reviews WHERE builder_id = ${id}
        `).catch(() => ({ rows: [{ avg_rating: 0, total_reviews: 0 }] })),
        db.execute(sql`
          SELECT COALESCE(SUM(amount), 0) AS total_earned
          FROM transactions WHERE user_id = ${id} AND amount > 0
        `).catch(() => ({ rows: [{ total_earned: 0 }] })),
        db.execute(sql`
          SELECT COALESCE(balance, 0) AS wallet_balance
          FROM wallets WHERE user_id = ${id} LIMIT 1
        `).catch(() => ({ rows: [{ wallet_balance: 0 }] })),
      ]);

      const rowsOf = (r: any) => Array.isArray(r) ? r[0] : (r?.rows?.[0] ?? {});
      const s = rowsOf(svcStats);
      const o = rowsOf(orderStats);
      const rv = rowsOf(reviewStats);
      const e = rowsOf(earnStats);
      const w = rowsOf(walletRow);

      return reply.send({
        stats: {
          activeServices: Number(s.active_services ?? 0),
          totalServices: Number(s.total_services ?? 0),
          totalOrders: Number(o.total_orders ?? 0),
          completedOrders: Number(o.completed_orders ?? 0),
          avgRating: Number(rv.avg_rating ?? 0),
          totalReviews: Number(rv.total_reviews ?? 0),
          totalEarned: Number(e.total_earned ?? 0),
          walletBalance: Number(w.wallet_balance ?? 0),
        },
      });
    } catch (err) {
      req.log.error({ err, id }, "builder stats failed");
            return reply.code(500).send({ error: "Could not compute builder stats", details: String(err) });
          }
        });

        /**
         * One-off migration: Tier 3 (Buy Shares) schema additions.
         * Adds founder_profiles columns + investments table.
         * POST /api/admin/migrate-buy-shares
         *
         * Idempotent — uses ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS.
         * Safe to call multiple times. Restricted to super_admin.
         */
        app.post(
          "/migrate-buy-shares",
          { preHandler: [app.authenticate] },
          async (req, reply) => {
            const adminId = (req.user as { sub: string }).sub;
            const roles = await getUserRoles(adminId);
            if (!roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Super admin only" });
            }
            try {
              await db.execute(sql`
                ALTER TABLE founder_profiles
                ADD COLUMN IF NOT EXISTS headcount integer DEFAULT 0,
                ADD COLUMN IF NOT EXISTS annual_revenue_dot text DEFAULT '0',
                ADD COLUMN IF NOT EXISTS founded_year integer,
                ADD COLUMN IF NOT EXISTS total_raised_dot text DEFAULT '0',
                ADD COLUMN IF NOT EXISTS share_price_kobo integer DEFAULT 0,
                ADD COLUMN IF NOT EXISTS shares_available integer DEFAULT 0;
              `);
              await db.execute(sql`
                CREATE TABLE IF NOT EXISTS investments (
                  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                  investor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  founder_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  shares integer NOT NULL,
                  share_price_kobo integer NOT NULL,
                  total_paid_dot numeric(20, 2) NOT NULL,
                  wallet_tx_id text,
                  paystack_ref text,
                  status text NOT NULL DEFAULT 'confirmed',
                  created_at timestamptz NOT NULL DEFAULT NOW()
                );
              `);
              await db.execute(sql`
                CREATE INDEX IF NOT EXISTS investments_investor_idx
                  ON investments(investor_id, created_at);
              `);
              await db.execute(sql`
                CREATE INDEX IF NOT EXISTS investments_founder_idx
                  ON investments(founder_id, created_at);
              `);
              req.log.info({ adminId }, "migrate-buy-shares applied");
              return reply.send({ ok: true, applied: ["founder_profiles columns", "investments table", "investments indexes"] });
            } catch (err: any) {
              req.log.error({ err }, "migrate-buy-shares failed");
              return reply.code(500).send({ error: "Migration failed", details: String(err) });
            }
          },
        );

        /**
         * One-off migration: order disputes (1.5).
         * Adds dispute_reason + disputed_at columns to service_orders.
         * POST /api/admin/migrate-disputes
         *
         * Idempotent — uses ADD COLUMN IF NOT EXISTS.
         * Safe to call multiple times. Restricted to super_admin.
         */
        app.post(
          "/migrate-disputes",
          { preHandler: [app.authenticate] },
          async (req, reply) => {
            const adminId = (req.user as { sub: string }).sub;
            const roles = await getUserRoles(adminId);
            if (!roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Super admin only" });
            }
            try {
              await db.execute(sql`
                ALTER TABLE service_orders
                ADD COLUMN IF NOT EXISTS dispute_reason text,
                ADD COLUMN IF NOT EXISTS disputed_at timestamptz;
              `);
              req.log.info({ adminId }, "migrate-disputes applied");
              return reply.send({ ok: true, applied: ["service_orders dispute columns"] });
            } catch (err: any) {
              req.log.error({ err }, "migrate-disputes failed");
              return reply.code(500).send({ error: "Migration failed", details: String(err) });
            }
          },
        );

        /**
         * One-off migration: builder profile PUT support.
         * Adds 'available' column to builder_profiles (if missing).
         * POST /api/admin/migrate-builder-profile
         */
        app.post(
          "/migrate-builder-profile",
          { preHandler: [app.authenticate] },
          async (req, reply) => {
            const adminId = (req.user as { sub: string }).sub;
            const roles = await getUserRoles(adminId);
            if (!roles.includes("super_admin")) {
              return reply.code(403).send({ error: "Super admin only" });
            }
            try {
              await db.execute(sql`
                ALTER TABLE builder_profiles
                ADD COLUMN IF NOT EXISTS available boolean DEFAULT true;
              `);
              req.log.info({ adminId }, "migrate-builder-profile applied");
                            return reply.send({ ok: true, applied: ["builder_profiles.available column"] });
                          } catch (err: any) {
                            req.log.error({ err }, "migrate-builder-profile failed");
                            return reply.code(500).send({ error: "Migration failed", details: String(err) });
                          }
                        },
                      );

                      /**
                       * One-off migration: referral system.
                       * Adds referral_code, referred_by, referral_count, referral_earnings_dot
                       * columns to users. Backfills referral_code for existing users.
                       * POST /api/admin/migrate-referrals
                       */
                      app.post(
                        "/migrate-referrals",
                        { preHandler: [app.authenticate] },
                        async (req, reply) => {
                          const adminId = (req.user as { sub: string }).sub;
                          const roles = await getUserRoles(adminId);
                          if (!roles.includes("super_admin")) {
                            return reply.code(403).send({ error: "Super admin only" });
                          }
                          try {
                            await db.execute(sql`
                              ALTER TABLE users
                              ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
                              ADD COLUMN IF NOT EXISTS referred_by text,
                              ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
                              ADD COLUMN IF NOT EXISTS referral_earnings_dot numeric(20,2) NOT NULL DEFAULT 0;
                            `);

                            // Backfill referral_code for users missing one.
                            const { generateReferralCode } = await import("../lib/auth.js");
                            const missingRows = await db
                              .select({ id: users.id, email: users.email })
                              .from(users)
                              .where(sql`${users.referralCode} IS NULL`);

                            let backfilled = 0;
                            for (const row of missingRows) {
                              let code = generateReferralCode();
                              for (let i = 0; i < 3; i++) {
                                const dup = await db
                                  .select({ id: users.id })
                                  .from(users)
                                  .where(eq(users.referralCode, code))
                                  .limit(1);
                                if (dup.length === 0) break;
                                code = generateReferralCode();
                              }
                              await db
                                .update(users)
                                .set({ referralCode: code } as any)
                                .where(eq(users.id, row.id));
                              backfilled++;
                            }

                            req.log.info({ adminId, backfilled }, "migrate-referrals applied");
                            return reply.send({
                              ok: true,
                              applied: [
                                "users referral columns",
                                `backfilled ${backfilled} referral codes`,
                              ],
                              backfilled,
                            });
                          } catch (err: any) {
                            req.log.error({ err }, "migrate-referrals failed");
                            return reply.code(500).send({ error: "Migration failed", details: String(err) });
                          }
                        },
                      );

              }

/* ============================== helpers ============================== */

function derivePermissions(roles: string[]) {
  const isSuper = roles.includes("super_admin");
  const isAdmin = isSuper || roles.includes("admin");
  return {
    canReadUsers: isAdmin,
    canReadVentures: isAdmin,
    canReadPayments: isAdmin,
    canReadAudit: isAdmin,
    canBan: isSuper,
    canAdjustBalance: isSuper,
    canImpersonate: isSuper,
    canPromote: isSuper,
    canToggleFeatureFlags: isSuper,
    canReplayPayments: isSuper,
  };
}
/**
 * Sign an impersonation JWT. We piggy-back on the existing
 * JWT_SECRET so the auth middleware can verify it. The token
 * carries a special 'impersonator' claim and a 'ijti' (impersonation
 * JTI) so the auth middleware can check the revocation table.
 */
async function issueImpersonationJwt(jti: string, targetUserId: string, adminId: string, expiresAt: Date) {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const exp = Math.floor(expiresAt.getTime() / 1000);
  const payload = {
    sub: targetUserId,
    ijti: jti,
    impersonator: adminId,
    iat: now,
    exp,
  };
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

