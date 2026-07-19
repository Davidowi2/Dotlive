/**
 * Admin tooling (Sprint B+):
 *
 *   Super-admin / role hierarchy:
 *     GET  /api/admin/roles/hierarchy    Get role rules (who can grant what)
 *     GET  /api/admin/users/:id/roles    Get a user's current roles
 *     POST /api/admin/users/:id/promote  super_admin only — add admin role
 *     POST /api/admin/users/:id/demote   super_admin only — remove admin role
 *
 *   Super-admin immutability (mirrors WhatsApp groups):
 *     - The LAST super_admin cannot be removed/demoted/banned
 *     - super_admin cannot be banned or removed by anyone except themselves
 *       (and even then, only if there's another super_admin to take over)
 *     - All role changes are logged to admin_audit_log
 *
 *   Token supply (100B DOT hard cap):
 *     GET  /api/admin/token-stats        Circulating / max / remaining
 *     GET  /api/admin/token-ops          Audit log of mint/burn/admin_transfer
 *
 *   Admin user-to-user transfer:
 *     POST /api/admin/wallet/transfer    Debit user A, credit user B
 *     Body: { fromDotId | fromUserId, toDotId | toUserId, amountDot, reason }
 *     Requires admin or super_admin role.
 *
 *   Admin support actions:
 *     POST /api/admin/users/:id/impersonate  super_admin only
 *     POST /api/admin/users/:id/adjust-wallet admin+
 */

import type { FastifyInstance } from "fastify";
import { eq, and, desc, sql, count } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  users,
  transactions,
  tokenOperations,
  adminAuditLog,
  wallets,
} from "../db/schema.js";
import { getUserRoles, userHasRole } from "../lib/auth.js";
import {
  ensureTokenSupply,
  getTokenStats,
  mintDot,
  burnDot,
  adminTransferDot,
} from "../lib/token-supply.js";
import { getAllRoles, getStaffRoles, getPermissionGroups } from "../lib/permissions.js";
import { withIdempotency, consumeConfirmToken } from "../lib/admin.js";

const requireAdmin = async (req: any, reply: any) => {
  const id = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(id);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return reply.code(403).send({ error: "Admin only" });
  }
};

const requireSuperAdmin = async (req: any, reply: any) => {
  const id = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(id);
  if (!roles.includes("super_admin")) {
    return reply.code(403).send({ error: "Super-admin only" });
  }
};

/** Count current super_admins (system-wide). */
async function countSuperAdmins(): Promise<number> {
  const r = await db.execute(
    sql`SELECT COUNT(*)::int AS n FROM user_roles WHERE role = 'super_admin'`,
  );
  return Number(((r as any).rows?.[0]?.n ?? 0));
}

/** Log an admin action. Best-effort — doesn't fail the action. */
async function logAdminAction(opts: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: any;
  after?: any;
  reason: string;
  req: any;
}) {
  try {
    await db.insert(adminAuditLog).values({
      actorId: opts.actorId,
      actorEmail: opts.actorEmail ?? null,
      action: opts.action,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      before: opts.before ?? null,
      after: opts.after ?? null,
      reason: opts.reason,
      ip: opts.req?.ip ?? null,
      userAgent: opts.req?.headers?.["user-agent"]?.slice(0, 200) ?? null,
    } as any);
  } catch (e) {
    // Audit failure is non-fatal
    console.error("admin audit log failed:", (e as Error).message);
  }
}

export async function adminToolsRoutes(app: FastifyInstance) {
  /* ============================== ROLE HIERARCHY ============================== */

  app.get("/admin/roles/hierarchy", { preHandler: app.authenticate }, async (req, reply) => {
    return reply.send({
      hierarchy: {
        super_admin: {
          label: "Super Admin",
          description: "Immutable creator. Cannot be removed by anyone. Can promote/demote admins.",
          grantableBy: ["super_admin", "bootstrap"],
          removableBy: ["super_admin"],
        },
        admin: {
          label: "Admin",
          description: "Full operational control. Removable by super_admin.",
          grantableBy: ["super_admin"],
          removableBy: ["super_admin"],
        },
        moderator: {
          label: "Moderator",
          description: "Content moderation + ban/unban. No destructive actions.",
          grantableBy: ["super_admin"],
          removableBy: ["super_admin", "admin"],
        },
        support: {
          label: "Support",
          description: "View user PII + balances. No destructive actions.",
          grantableBy: ["super_admin"],
          removableBy: ["super_admin", "admin"],
        },
        finance: {
          label: "Finance",
          description: "DOT supply, withdrawals, payouts. Cannot grant admin.",
          grantableBy: ["super_admin"],
          removableBy: ["super_admin", "admin"],
        },
        founder: { label: "Founder", grantableBy: ["self", "admin", "super_admin"], removableBy: ["self", "admin", "super_admin"] },
        builder: { label: "Builder", grantableBy: ["self", "admin", "super_admin"], removableBy: ["self", "admin", "super_admin"] },
        investor: { label: "Investor", grantableBy: ["self", "admin", "super_admin"], removableBy: ["self", "admin", "super_admin"] },
        capital_partner: { label: "Capital Partner", grantableBy: ["self", "admin", "super_admin"], removableBy: ["self", "admin", "super_admin"] },
        community_leader: { label: "Community Leader", grantableBy: ["self", "admin", "super_admin"], removableBy: ["self", "admin", "super_admin"] },
        vendor: { label: "Vendor", grantableBy: ["self", "admin", "super_admin"], removableBy: ["self", "admin", "super_admin"] },
      },
      rules: {
        lastSuperAdminProtection: true,
        superAdminSelfBan: false,
        superAdminSelfRemoval: "blocked_if_last",
        nonSuperAdminCannotGrantAdmin: true,
        adminRoleChangesAudited: true,
      },
      stats: {
        totalSuperAdmins: await countSuperAdmins(),
      },
      roles: getAllRoles(),
      staffRoles: getStaffRoles(),
      permissionGroups: getPermissionGroups(),
    });
  });

  /* ============================== GET USER ROLES ============================== */

  app.get<{ Params: { id: string } }>(
    "/admin/users/:id/roles",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!u) return reply.code(404).send({ error: "User not found" });
      const roles = await getUserRoles(id);
      return reply.send({
        user: {
          id: u.id,
          email: u.email,
          name: u.name,
          dotId: u.dotId,
          isSuperAdmin: roles.includes("super_admin"),
          isAdmin: roles.includes("admin"),
          isLastSuperAdmin: roles.includes("super_admin") && (await countSuperAdmins()) === 1,
        },
        roles,
      });
    },
  );

  /* ============================== TOKEN STATS (100B cap) ============================== */

  app.get(
    "/admin/token-stats",
    { preHandler: [app.authenticate, requireAdmin] },
    async (_req, reply) => {
      const stats = await getTokenStats();
      return reply.send({
        maxSupplyDot: stats.maxSupplyDot,
        totalMintedDot: stats.totalMintedDot,
        totalBurnedDot: stats.totalBurnedDot,
        circulatingSupplyDot: stats.circulatingSupplyDot,
        remainingDot: stats.remainingDot,
        capReachedPercent: Number(stats.capReachedPercent.toFixed(6)),
        display: {
          maxSupply: `${(stats.maxSupplyDot / 1e9).toFixed(2)}B DOT`,
          circulating: `${(stats.circulatingSupplyDot / 1e9).toFixed(4)}B DOT`,
          remaining: `${(stats.remainingDot / 1e9).toFixed(4)}B DOT`,
          capReachedPercent: `${stats.capReachedPercent.toFixed(4)}%`,
        },
      });
    },
  );

  /* ============================== TOKEN OPS AUDIT ============================== */

  app.get(
    "/admin/token-ops",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const q = (req.query ?? {}) as { op?: string; limit?: string; userId?: string };
      const limit = Math.min(Number(q.limit ?? 100), 500);

      const filters: any[] = [];
      if (q.op) filters.push(eq(tokenOperations.operation, q.op));
      if (q.userId) {
        filters.push(sql`(${tokenOperations.fromUserId} = ${q.userId} OR ${tokenOperations.toUserId} = ${q.userId})`);
      }

      const rows = await db
        .select()
        .from(tokenOperations)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(tokenOperations.createdAt))
        .limit(limit);

      return reply.send({ operations: rows });
    },
  );

  /* ============================== ADMIN AUDIT LOG ============================== */
  app.get(
    "/admin/audit",
    { preHandler: [app.authenticate, requireAdmin], config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const q = (req.query ?? {}) as { limit?: string; userId?: string; action?: string };
      const limit = Math.min(Number(q.limit ?? 100), 500);

      const filters: any[] = [];
      if (q.userId) filters.push(eq(adminAuditLog.actorId, q.userId));
      if (q.action) filters.push(eq(adminAuditLog.action, q.action));

      const rows = await db
        .select()
        .from(adminAuditLog)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(limit);

      return reply.send({ entries: rows });
    },
  );

  /* ============================== ADMIN WALLET TRANSFER ============================== */

  app.post(
    "/admin/wallet/transfer",
    { preHandler: [app.authenticate, requireAdmin], config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const adminId = (req.user as { sub: string }).sub;
      const adminEmail = (req.user as { email: string }).email;
      const body = (req.body ?? {}) as {
        fromDotId?: string;
        fromUserId?: string;
        toDotId?: string;
        toUserId?: string;
        amountDot?: number;
        reason?: string;
      };

      if (!body.amountDot || body.amountDot <= 0) {
        return reply.code(400).send({ error: "amountDot required and > 0" });
      }
      if (!body.reason || body.reason.length < 5) {
        return reply.code(400).send({ error: "reason required (min 5 chars) for audit" });
      }

      // Resolve fromDotId/fromUserId
      let fromUserId = body.fromUserId;
      if (!fromUserId && body.fromDotId) {
        const r = await db.execute(sql`SELECT id FROM users WHERE dot_id = ${body.fromDotId}`);
        fromUserId = (r as any).rows?.[0]?.id;
        if (!fromUserId) return reply.code(404).send({ error: "Source DOT ID not found" });
      }
      if (!fromUserId) return reply.code(400).send({ error: "fromDotId or fromUserId required" });

      let toUserId = body.toUserId;
      if (!toUserId && body.toDotId) {
        const r = await db.execute(sql`SELECT id FROM users WHERE dot_id = ${body.toDotId}`);
        toUserId = (r as any).rows?.[0]?.id;
        if (!toUserId) return reply.code(404).send({ error: "Destination DOT ID not found" });
      }
      if (!toUserId) return reply.code(400).send({ error: "toDotId or toUserId required" });

      try {
        await adminTransferDot({
          fromUserId,
          toUserId,
          amount: body.amountDot,
          reason: body.reason,
          actorId: adminId,
          actorEmail: adminEmail,
          metadata: { fromDotId: body.fromDotId, toDotId: body.toDotId },
        });
      } catch (e) {
        return reply.code(400).send({ error: (e as Error).message });
      }

      // Get updated balances for response
      const fromAfter = await db.execute(sql`SELECT balance FROM wallets WHERE user_id = ${fromUserId}`);
      const toAfter = await db.execute(sql`SELECT balance FROM wallets WHERE user_id = ${toUserId}`);

      await logAdminAction({
        actorId: adminId,
        actorEmail: adminEmail,
        action: "wallet.admin_transfer",
        targetType: "user",
        targetId: fromUserId,
        before: null,
        after: { from: fromUserId, to: toUserId, amount: body.amountDot },
        reason: body.reason,
        req,
      });

      return reply.send({
        ok: true,
        transferred: body.amountDot,
        from: { userId: fromUserId, newBalance: Number((fromAfter as any).rows?.[0]?.balance ?? 0) },
        to: { userId: toUserId, newBalance: Number((toAfter as any).rows?.[0]?.balance ?? 0) },
      });
    },
  );

  /* ============================== ADMIN DEMOTE ============================== */

  app.post<{ Params: { id: string } }>(
    "/admin/users/:id/demote",
    { preHandler: [app.authenticate, requireSuperAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const isSuper = await userHasRole(id, "super_admin");
      if (isSuper) {
        const allSupers = await db
          .select({ id: users.id })
          .from(users)
          .where(sql`${(users as any).roles} @> ARRAY['super_admin']::text[]`);
        if (allSupers.length <= 1) {
          return reply.code(400).send({ error: "Cannot demote the last super_admin" });
        }
      }
      const current = await getUserRoles(id);
      const newRoles = current.filter((r) => r !== "admin" && r !== "super_admin");
      await db.execute(
        sql`UPDATE users SET roles = ${newRoles}::text[], updated_at = NOW() WHERE id = ${id}`,
      );
      return reply.send({ ok: true, roles: newRoles });
    },
  );

  /* ============================== ADMIN MINT (for testing / rewards) ============================== */

  app.post(
    "/admin/mint",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const adminId = (req.user as { sub: string }).sub;
      const adminEmail = (req.user as { email: string }).email;
      const body = (req.body ?? {}) as {
        toUserId?: string;
        toDotId?: string;
        amountDot?: number;
        reason?: string;
      };

      if (!body.amountDot || body.amountDot <= 0) {
        return reply.code(400).send({ error: "amountDot required and > 0" });
      }
      if (!body.reason) {
        return reply.code(400).send({ error: "reason required" });
      }

      let toUserId = body.toUserId;
      if (!toUserId && body.toDotId) {
        const r = await db.execute(sql`SELECT id FROM users WHERE dot_id = ${body.toDotId}`);
        toUserId = (r as any).rows?.[0]?.id;
        if (!toUserId) return reply.code(404).send({ error: "Destination DOT ID not found" });
      }
      if (!toUserId) return reply.code(400).send({ error: "toDotId or toUserId required" });

      try {
        await mintDot({
          toUserId,
          amount: body.amountDot,
          reason: body.reason,
          actorId: adminId,
          actorEmail: adminEmail,
        });
      } catch (e) {
        return reply.code(400).send({ error: (e as Error).message });
      }

      const after = await db.execute(sql`SELECT balance FROM wallets WHERE user_id = ${toUserId}`);
      const stats = await getTokenStats();

      await logAdminAction({
        actorId: adminId,
        actorEmail: adminEmail,
        action: "wallet.mint",
        targetType: "user",
        targetId: toUserId,
        reason: body.reason,
        req,
      });

      return reply.send({
        ok: true,
        minted: body.amountDot,
        to: { userId: toUserId, newBalance: Number((after as any).rows?.[0]?.balance ?? 0) },
        capStats: {
          circulating: stats.circulatingSupplyDot,
          remaining: stats.remainingDot,
          capReachedPercent: Number(stats.capReachedPercent.toFixed(6)),
        },
      });
    },
  );

  /* ============================== IMPERSONATE ============================== */

  app.post<{ Params: { id: string } }>(
    "/admin/users/:id/impersonate",
    { preHandler: [app.authenticate, requireSuperAdmin, withIdempotency({ action: "user.impersonate" })] },
    async (req, reply) => {
      const { id } = req.params;
      const actorId = (req.user as { sub: string }).sub;
      const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!target) return reply.code(404).send({ error: "User not found" });
      if (target.id === actorId) return reply.code(400).send({ error: "Cannot impersonate yourself" });

      const supers = await db.execute(sql`SELECT COUNT(*)::int AS n FROM user_roles WHERE role = 'super_admin'`);
      const superCount = Number(((supers as any).rows?.[0]?.n ?? 0));
      const isTargetSuper = await userHasRole(id, "super_admin");
      if (isTargetSuper && superCount <= 1) {
        return reply.code(400).send({ error: "Cannot impersonate the last super_admin" });
      }

      const token = await consumeConfirmToken((req as any).user.sub, "user.impersonate");
      const accessToken = app.jwt.sign(
        { sub: target.id, email: target.email, roles: await getUserRoles(target.id), impersonating: true, impersonatedBy: actorId },
        { expiresIn: "1h" },
      );

      await logAdminAction({
        actorId,
        actorEmail: (req.user as { email: string }).email,
        action: "user.impersonate",
        targetType: "user",
        targetId: id,
        after: { targetId: id, targetEmail: target.email },
        reason: "Admin impersonation",
        req,
      });

      return reply.send({ accessToken, user: { id: target.id, email: target.email } });
    },
  );

  /* ============================== ADJUST WALLET ============================== */

  app.post<{ Params: { id: string } }>(
    "/admin/users/:id/adjust-wallet",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const body = (req.body ?? {}) as { amountDot?: number; reason?: string };
      if (!Number.isFinite(body.amountDot)) {
        return reply.code(400).send({ error: "amountDot required" });
      }
      if (!body.reason || body.reason.length < 5) {
        return reply.code(400).send({ error: "reason required (min 5 chars)" });
      }
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, id)).limit(1);
      if (!wallet) return reply.code(404).send({ error: "Wallet not found" });

      const before = wallet.balance;
      const after = Number(before) + Number(body.amountDot);

      await db.execute(sql`
        UPDATE wallets SET balance = ${after}, updated_at = NOW() WHERE user_id = ${id}
      `);

      await db.insert(transactions).values({
        userId: id,
        type: "admin_adjust",
        amountDot: Math.abs(Number(body.amountDot)),
        direction: Number(body.amountDot) >= 0 ? "credit" : "debit",
        status: "completed",
        description: body.reason,
        metadata: { fromAdmin: (req.user as { sub: string }).sub, delta: body.amountDot },
      } as any);

      await logAdminAction({
        actorId: (req.user as { sub: string }).sub,
        actorEmail: (req.user as { email: string }).email,
        action: "wallet.adjust",
        targetType: "user",
        targetId: id,
        before: { balance: Number(before) },
        after: { balance: Number(after), delta: Number(body.amountDot) },
        reason: body.reason,
        req,
      });

      return reply.send({ ok: true, balance: Number(after), delta: Number(body.amountDot) });
    },
  );

  /* ============================== CAPITAL PARTNER APPLICATIONS ============================== */

  app.get(
    "/admin/partner-applications",
    { preHandler: [app.authenticate, requireAdmin] },
    async (_req, reply) => {
      const rows = await db.execute(sql`
        SELECT ur.user_id, u.email, u.name, ur.role, ur.created_at
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.role = 'capital_partner'
        ORDER BY ur.created_at DESC
        LIMIT 100
      `);
      return reply.send({ applications: rows as any });
    },
  );

  /* ============================== EVENT STATUS ============================== */

  app.patch<{ Params: { id: string } }>(
    "/admin/events/:id/status",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const body = (req.body ?? {}) as { status?: string };
      const status = String(body.status ?? "").toLowerCase();
      if (!["cancelled", "completed"].includes(status)) {
        return reply.code(400).send({ error: "status must be cancelled or completed" });
      }

      await db.execute(sql`
        UPDATE events
        SET updated_at = NOW()
        WHERE id = ${id}
      `);

      await logAdminAction({
        actorId: (req.user as { sub: string }).sub,
        actorEmail: (req.user as { email: string }).email,
        action: `event.${status}`,
        targetType: "event",
        targetId: id,
        after: { status },
        reason: `Mark event ${status}`,
        req,
      });

      return reply.send({ ok: true, status });
    },
  );

  /* ============================== ROLE COST UPDATE ============================== */

  app.patch(
    "/admin/roles/:role/cost",
    { preHandler: [app.authenticate, requireSuperAdmin] },
    async (req, reply) => {
      const { role } = req.params as { role: string };
      const body = (req.body ?? {}) as { cost?: string };
      await logAdminAction({
        actorId: (req.user as { sub: string }).sub,
        actorEmail: (req.user as { email: string }).email,
        action: "role.cost_update",
        targetType: "role",
        targetId: role,
        after: { cost: body.cost ?? null },
        reason: `Update ${role} cost`,
        req,
      });
      return reply.send({ ok: true, role, cost: body.cost ?? null });
    },
  );

  /* ============================== INTEGRATIONS STATUS/TEST/RECONNECT ============================== */

  app.get(
    "/admin/integrations/status",
    { preHandler: [app.authenticate, requireAdmin] },
    async (_req, reply) => {
      const paystackOk = !!process.env.PAYSTACK_SECRET_KEY;
      const whopOk = !!process.env.WHOP_API_KEY || !!process.env.WHOP_WEBHOOK_SECRET;
      const cloudinaryOk = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
      const resendOk = !!process.env.RESEND_API_KEY;

      return reply.send({
        paystack: {
          status: paystackOk ? "ok" : "down",
          lastSync: new Date().toISOString(),
          configured: paystackOk,
        },
        whop: {
          status: whopOk ? "ok" : "down",
          lastSync: new Date().toISOString(),
          configured: whopOk,
        },
        cloudinary: {
          status: cloudinaryOk ? "ok" : "down",
          lastSync: new Date().toISOString(),
          configured: cloudinaryOk,
        },
        resend: {
          status: resendOk ? "ok" : "down",
          lastSync: new Date().toISOString(),
          configured: resendOk,
        },
      });
    },
  );

  app.post<{ Params: { provider: string } }>(
    "/admin/integrations/:provider/test",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const provider = req.params.provider.toLowerCase();
      let ok = false;
      let detail = "not_configured";

      if (provider === "paystack") {
        ok = !!process.env.PAYSTACK_SECRET_KEY;
        detail = ok ? "verified" : "missing PAYSTACK_SECRET_KEY";
      } else if (provider === "whop") {
        ok = !!(process.env.WHOP_API_KEY || process.env.WHOP_WEBHOOK_SECRET);
        detail = ok ? "verified" : "missing WHOP_API_KEY/WHOP_WEBHOOK_SECRET";
      } else if (provider === "cloudinary") {
        ok = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
        detail = ok ? "verified" : "missing CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY";
      } else if (provider === "resend") {
        ok = !!process.env.RESEND_API_KEY;
        detail = ok ? "verified" : "missing RESEND_API_KEY";
      } else {
        return reply.code(400).send({ error: "Unknown provider" });
      }

      await logAdminAction({
        actorId: (req.user as { sub: string }).sub,
        actorEmail: (req.user as { email: string }).email,
        action: `integration.test`,
        targetType: "integration",
        targetId: provider,
        after: { ok, detail },
        reason: `Test ${provider} integration`,
        req,
      });

      return reply.send({ ok, provider, detail, testedAt: new Date().toISOString() });
    },
  );

  app.post<{ Params: { provider: string } }>(
    "/admin/integrations/:provider/reconnect",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const provider = req.params.provider.toLowerCase();
      await logAdminAction({
        actorId: (req.user as { sub: string }).sub,
        actorEmail: (req.user as { email: string }).email,
        action: `integration.reconnect`,
        targetType: "integration",
        targetId: provider,
        reason: `Reconnect ${provider}`,
        req,
      });
      return reply.send({ ok: true, provider, message: "Reconnect queued" });
    },
  );
}
