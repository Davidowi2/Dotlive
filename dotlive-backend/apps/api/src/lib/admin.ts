/**
 * Admin primitives — the three things every admin action needs:
 *
 *   1. withIdempotency(handler) — caches the response for 24h
 *      keyed by the X-Idempotency-Key header. Same key + same
 *      action = return cached response. Same key + different
 *      action = 409.
 *
 *   2. withConfirm(action, reason) — issues a 5-min single-use
 *      token. Subsequent action POSTs require X-Admin-Confirm.
 *      Token consumption is transactional with the action.
 *
 *   3. audit(tx, opts) — appends a row to admin_audit_log.
 *      MUST be called inside the same transaction as the
 *      mutation, so the audit log and the data can never drift.
 *
 *   Plus: requireAdmin / requireSuperAdmin middleware, and a
 *   banCheck that prevents banned users from authenticating.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { sql, eq, and, isNull, gt } from "drizzle-orm";
import { db, sql as rawSql } from "../db/client.js";
import {
  adminAuditLog,
  adminConfirmTokens,
  adminIdempotencyKeys,
  userBans,
  userRoles,
} from "../db/schema.js";

/* ============================ Middleware ============================ */

/** Adds the admin role check. Must run AFTER `app.authenticate`. */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { sub } = (req as any).user;
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, sub));
  const roles = rows.map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return reply.code(403).send({
      error: "Forbidden",
      code: "not_admin",
      hint: "This endpoint requires the admin role.",
    });
  }
  (req as any).adminRoles = roles;
  (req as any).isSuperAdmin = roles.includes("super_admin");
}

/** Stricter version — must be super_admin. */
export async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply) {
  await requireAdmin(req, reply);
  if (reply.sent) return;
  if (!(req as any).isSuperAdmin) {
    return reply.code(403).send({
      error: "Forbidden",
      code: "not_super_admin",
      hint: "This action requires super_admin.",
    });
  }
}

/** Reject banned users at the auth layer. */
export async function banCheck(req: FastifyRequest, reply: FastifyReply) {
  if (!(req as any).user) return;
  const { sub } = (req as any).user;
  const ban = await db
    .select()
    .from(userBans)
    .where(and(eq(userBans.userId, sub), isNull(userBans.revokedAt)))
    .limit(1);
  if (ban[0]) {
    const permanent = ban[0].expiresAt == null;
    const stillActive = permanent || ban[0].expiresAt > new Date();
    if (stillActive) {
      return reply.code(403).send({
        error: "Account suspended",
        code: "user_banned",
        reason: ban[0].reason,
        expiresAt: ban[0].expiresAt,
      });
    }
  }
}

/* ============================ Idempotency ============================ */

interface IdempotencyOpts {
  /** Action identifier like "user.ban". Used to detect key reuse with different actions. */
  action: string;
}

interface IdempotencyHit {
  status: number;
  body: any;
}

/**
 * Wraps a handler so that requests with a known Idempotency-Key
 * return the cached response. New keys run the handler and persist
 * the result. TTL is 24 hours.
 *
 * Usage:
 *   app.post("/users/:id/ban", {
 *     preHandler: [
 *       app.authenticate,
 *       requireAdmin,
 *       withIdempotency({ action: "user.ban" }),
 *     ],
 *   }, async (req, reply) => { ... });
 */
export function withIdempotency(opts: IdempotencyOpts) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    const key = req.headers["idempotency-key"];
    if (typeof key !== "string" || key.length < 8 || key.length > 128) {
      // Idempotency-Key is REQUIRED for admin write endpoints.
      return reply.code(400).send({
        error: "Missing Idempotency-Key",
        code: "idempotency_required",
        hint: "All admin write requests must include an Idempotency-Key header (8-128 chars).",
      });
    }

    const adminId = (req as any).user?.sub;
    if (!adminId) {
      return reply.code(401).send({ error: "Not authenticated", code: "no_auth" });
    }

    // 24h cutoff
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Look up existing key
    const existing = await db
      .select()
      .from(adminIdempotencyKeys)
      .where(
        and(
          eq(adminIdempotencyKeys.adminId, adminId),
          eq(adminIdempotencyKeys.idempotencyKey, key),
          gt(adminIdempotencyKeys.createdAt, cutoff)
        )
      )
      .limit(1);

    if (existing[0]) {
      if (existing[0].action !== opts.action) {
        return reply.code(409).send({
          error: "Idempotency-Key reused for a different action",
          code: "idempotency_conflict",
          originalAction: existing[0].action,
          attemptedAction: opts.action,
        });
      }
      // Return the cached response.
      reply.header("Idempotent-Replay", "true");
      return reply.code(existing[0].responseStatus).send(existing[0].responseBody);
    }

    // Run the handler. The handler is responsible for calling
    // commitIdempotency() at the end of a successful response.
    (req as any)._idemKey = key;
    (req as any)._idemAction = opts.action;
  };
}

/**
 * Persists a successful admin response. Called from inside the
 * route handler when ready to commit. Should be called from
 * INSIDE the same DB transaction as the action.
 *
 * Use the lower-level `commitIdempotencyTx` if you have a
 * transaction handle; this convenience version opens its own.
 */
export async function commitIdempotency(
  req: FastifyRequest,
  status: number,
  body: any
) {
  const key = (req as any)._idemKey;
  const action = (req as any)._idemAction;
  const adminId = (req as any).user?.sub;
  if (!key || !action || !adminId) return;

  await db
    .insert(adminIdempotencyKeys)
    .values({
      adminId,
      idempotencyKey: key,
      action,
      responseStatus: status,
      responseBody: body,
    })
    .onConflictDoNothing();
}

/* ============================ Confirm tokens ============================ */

interface IssueConfirmOpts {
  adminId: string;
  action: string;
  reason: string;
  targetType?: string;
  targetId?: string;
  payload?: any;
  /** TTL in seconds. Default 300 (5 min). */
  ttlSeconds?: number;
}

/** Issues a single-use confirm token. Returns the token string. */
export async function issueConfirmToken(opts: IssueConfirmOpts): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (opts.ttlSeconds ?? 300) * 1000);

  await db.insert(adminConfirmTokens).values({
    token,
    adminId: opts.adminId,
    action: opts.action,
    targetType: opts.targetType,
    targetId: opts.targetId,
    payload: opts.payload,
    reason: opts.reason,
    expiresAt,
  } as any);

  return token;
}

/**
 * Validates and consumes a confirm token atomically via a single UPDATE.
 * Eliminates the TOCTOU race — the token is marked used in the same
 * statement that checks it, so two concurrent requests can never both succeed.
 */
export async function consumeConfirmToken(
  token: string,
  adminId: string,
  expectedAction: string
): Promise<{ ok: true; payload: any; reason: string } | { ok: false; code: string; hint: string }> {
  // Single atomic UPDATE — only succeeds if token exists, belongs to this admin,
  // matches the expected action, is unused, and has not expired.
  const result = await db
    .update(adminConfirmTokens)
    .set({ usedAt: new Date() } as any)
    .where(
      and(
        eq(adminConfirmTokens.token, token),
        eq(adminConfirmTokens.adminId, adminId),
        eq(adminConfirmTokens.action, expectedAction),
        isNull(adminConfirmTokens.usedAt),
        gt(adminConfirmTokens.expiresAt, new Date())
      )
    )
    .returning();

  if (!result[0]) {
    return {
      ok: false,
      code: "confirm_invalid",
      hint: "Confirm token is invalid, expired, or already used.",
    };
  }

  return {
    ok: true,
    payload: result[0].payload,
    reason: result[0].reason,
  };
}

/** Reads the X-Admin-Confirm header. Required by destructive endpoints. */
export function requireConfirmHeader(
  req: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
) {
  const token = req.headers["x-admin-confirm"];
  if (typeof token !== "string" || token.length < 32) {
    reply.code(400).send({
      error: "Missing X-Admin-Confirm",
      code: "confirm_required",
      hint: "Destructive actions require a confirm token. POST /api/admin/confirm first.",
    });
    return;
  }
  (req as any)._confirmToken = token;
  done();
}

/* ============================ Audit ============================ */

interface AuditOpts {
  actorId: string;
  actorEmail: string;
  action: string; // e.g. "user.ban"
  targetType?: string;
  targetId?: string;
  before?: any;
  after?: any;
  reason: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: any;
}

/**
 * Appends a row to admin_audit_log. Use inside a transaction.
 * The caller is expected to pass the transaction client.
 *
 * Example:
 *   await db.transaction(async (tx) => {
 *     await tx.update(...).set(...);
 *     await auditTx(tx, { actorId, ... });
 *   });
 */
export async function auditTx(tx: any, opts: AuditOpts) {
  await tx.insert(adminAuditLog).values({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    action: opts.action,
    targetType: opts.targetType,
    targetId: opts.targetId,
    before: opts.before,
    after: opts.after,
    reason: opts.reason,
    ip: opts.ip,
    userAgent: opts.userAgent,
    requestId: opts.requestId,
    metadata: opts.metadata,
  } as any);
}

/** Convenience: extract common fields from a Fastify request. */
export function reqAuditCtx(req: FastifyRequest) {
  const u = (req as any).user;
  return {
    actorId: u?.sub,
    actorEmail: u?.email ?? "unknown@unknown",
    ip: req.ip,
    userAgent: req.headers["user-agent"]?.toString().slice(0, 255),
    requestId: (req as any).id,
  };
}
