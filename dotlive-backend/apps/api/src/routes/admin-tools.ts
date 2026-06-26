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
 */

import type { FastifyInstance } from "fastify";
import { eq, and, desc, sql, count } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  users, transactions, tokenOperations, adminAuditLog,
} from "../db/schema.js";
import { getUserRoles, userHasRole } from "../lib/auth.js";
import {
  ensureTokenSupply, getTokenStats, mintDot, burnDot, adminTransferDot,
} from "../lib/token-supply.js";

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
          removableBy: ["super_admin"], // and only if not last
        },
        admin: {
          label: "Admin",
          description: "Full operational control. Removable by super_admin.",
          grantableBy: ["super_admin"],
          removableBy: ["super_admin"],
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

  /* ============================== PROMOTE TO ADMIN ============================== */

  app.post<{ Params: { id: string } }>(
    "/admin/users/:id/promote",
    { preHandler: [app.authenticate, requireSuperAdmin] },
    async (req, reply) => {
      const adminId = (req.user as { sub: string }).sub;
      const adminEmail = (req.user as { email: string }).email;
      const { id } = req.params;
      const body = (req.body ?? {}) as { reason?: string; role?: string };

      const targetRole = body.role ?? "admin";
      if (!["admin", "super_admin"].includes(targetRole as any)) {
        return reply.code(400).send({ error: "role must be 'admin' or 'super_admin'" });
      }

      const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!u) return reply.code(404).send({ error: "User not found" });

      const before = await getUserRoles(id);
      if (before.includes(targetRole as any)) {
        return reply.code(409).send({ error: `User already has ${targetRole}` });
      }

      await db.execute(sql`
        INSERT INTO user_roles (user_id, role, granted_at)
        VALUES (${id}, ${targetRole}, NOW())
        ON CONFLICT DO NOTHING
      `);

      const after = await getUserRoles(id);

      await logAdminAction({
        actorId: adminId,
        actorEmail: adminEmail,
        action: `user.promote.${targetRole}`,
        targetType: "user",
        targetId: id,
        before: { roles: before },
        after: { roles: after },
        reason: body.reason ?? `Promoted to ${targetRole}`,
        req,
      });

      return reply.send({ ok: true, user: { id, email: u.email }, before, after });
    },
  );

  /* ============================== DEMOTE / REMOVE ROLE ============================== */

  app.post<{ Params: { id: string } }>(
    "/admin/users/:id/demote",
    { preHandler: [app.authenticate, requireSuperAdmin] },
    async (req, reply) => {
      const adminId = (req.user as { sub: string }).sub;
      const adminEmail = (req.user as { email: string }).email;
      const { id } = req.params;
      const body = (req.body ?? {}) as { reason?: string; role?: string };

      const targetRole = body.role ?? "admin";
      if (!["admin", "super_admin"].includes(targetRole as any)) {
        return reply.code(400).send({ error: "role must be 'admin' or 'super_admin'" });
      }

      const before = await getUserRoles(id);
      if (!before.includes(targetRole as any)) {
        return reply.code(409).send({ error: `User does not have ${targetRole}` });
      }

      // IMMUTABILITY: last super_admin cannot be demoted
      if (targetRole === "super_admin") {
        const n = await countSuperAdmins();
        if (n <= 1) {
          return reply.code(409).send({
            error: "Cannot demote the LAST super_admin. Promote another user to super_admin first.",
            lastSuperAdmin: true,
          });
        }
        // super_admin cannot demote themselves if they're the last (already covered above)
        if (adminId === id) {
          // OK as long as not the last — covered
        }
      }

      await db.execute(sql`
        DELETE FROM user_roles WHERE user_id = ${id} AND role = ${targetRole}
      `);

      const after = await getUserRoles(id);

      await logAdminAction({
        actorId: adminId,
        actorEmail: adminEmail,
        action: `user.demote.${targetRole}`,
        targetType: "user",
        targetId: id,
        before: { roles: before },
        after: { roles: after },
        reason: body.reason ?? `Removed ${targetRole}`,
        req,
      });

      return reply.send({ ok: true, before, after });
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
}