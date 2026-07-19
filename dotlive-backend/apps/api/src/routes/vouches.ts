/**
 * Vouch primitive routes.
 *
 *   POST   /api/vouches              — create a vouch (auth required)
 *   GET    /api/vouches/received/:id  — list vouches received by a user
 *   GET    /api/vouches/given/:id     — list vouches given by a user
 *   DELETE /api/vouches/:id           — revoke own vouch (auth required)
 *
 * Score is computed at insert as:
 *   score = min(voucher_vantagePoint, 200) × scope_multiplier
 *
 * Scope multipliers (voucher's role at vouch time):
 *   - 'founder'  → 1.0
 *   - 'builder'  → 0.8
 *   - 'capital'  → 0.6
 *
 * The scope is sent by the client but the server re-derives the multiplier
 * from the voucher's roles table to prevent front-end gaming. The role
 * hierarchy (founder > builder > capital) means a user with multiple roles
 * gets the highest multiplier their roles qualify for.
 *
 * Decay (1% / 30 days) is applied on the client at read time. The DB stores
 * the snapshot value.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { userVouches, users, userRoles, assessments } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { invalidatePrefix } from "../lib/cache.js";

const VOUCH_CAPS = {
  founder: 1.0,
  builder: 0.8,
  capital: 0.6,
} as const;

type VouchScope = keyof typeof VOUCH_CAPS;

const createVouchSchema = z.object({
  voucheeId: z.string().min(1).max(64),
  scope: z.enum(["founder", "builder", "capital"]),
});

/** Returns the voucher's vantagePoint (latest assessment) or 0. */
async function getVoucherVantage(voucherId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT vantage_point FROM assessments
    WHERE user_id = ${voucherId}
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const row = (rows as any).rows?.[0];
  return Number(row?.vantage_point ?? 0);
}

/**
 * Returns the best scope multiplier the voucher qualifies for, based on
 * their roles. Returns null if they have none of the qualifying roles.
 */
async function getVoucherScopeMultiplier(voucherId: string): Promise<{ scope: VouchScope; multiplier: number } | null> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, voucherId));
  const roles = new Set(rows.map((r) => r.role));
  // Priority order: founder > builder > capital_partner (mapped to 'capital')
  if (roles.has("founder")) return { scope: "founder", multiplier: VOUCH_CAPS.founder };
  if (roles.has("builder")) return { scope: "builder", multiplier: VOUCH_CAPS.builder };
  if (roles.has("capital_partner") || roles.has("investor")) {
    return { scope: "capital", multiplier: VOUCH_CAPS.capital };
  }
  return null;
}

export async function vouchesRoutes(app: FastifyInstance) {
  /** POST /api/vouches */
  app.post("/vouches", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createVouchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { voucheeId } = parsed.data;
    const claimedScope = parsed.data.scope;

    if (voucheeId === sub) {
      return reply.code(400).send({ error: "You cannot vouch yourself." });
    }

    // Confirm vouchee exists.
    const [vouchee] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, voucheeId))
      .limit(1);
    if (!vouchee) {
      return reply.code(404).send({ error: "User not found." });
    }

    // Re-derive the voucher's actual scope from roles (don't trust client).
    const derived = await getVoucherScopeMultiplier(sub);
    if (!derived) {
      return reply
        .code(403)
        .send({ error: "You need a Founder, Builder or Capital Partner role to vouch." });
    }
    // Use the server-derived scope. The client's claim is logged for debugging.
    const scope = derived.scope;

    const vantage = await getVoucherVantage(sub);
    if (vantage <= 0) {
      return reply
        .code(403)
        .send({ error: "You need a Vantage score above 0 to vouch." });
    }
    const score = Math.round(Math.min(vantage, 200) * derived.multiplier);

    try {
      const inserted = await db
        .insert(userVouches)
        .values({
          voucherId: sub,
          voucheeId,
          scope,
          score,
        } as any)
        .returning();
      invalidateAfterVouchChange();
      return reply.code(201).send({ vouch: inserted[0] });
    } catch (err: any) {
      // Unique-pair violation → already vouched.
      if (typeof err?.message === "string" && err.message.includes("user_vouches_pair_unique")) {
        return reply.code(409).send({ error: "You have already vouched this user." });
      }
      throw err;
    }
  });

  /**
   * NOTE on cache invalidation:
   *  - `users:*` — public profile view shows vouch counts.
   *  - `leaderboard:*` — user reputation rank is derived from vouches.
   *  - `feed:*` — Discover feed surfaces top-vouched users / ventures.
   */
  function invalidateAfterVouchChange() {
    invalidatePrefix("users:profile");
    invalidatePrefix("leaderboard");
    invalidatePrefix("feed");
  }

  /** GET /api/vouches/received/:userId */
  app.get<{ Params: { userId: string } }>(
    "/vouches/received/:userId",
    async (req, reply) => {
      const { userId } = req.params;
      const rows = await db
        .select()
        .from(userVouches)
        .where(eq(userVouches.voucheeId, userId))
        .orderBy(desc(userVouches.createdAt));
      return reply.send({ vouches: rows });
    },
  );

  /** GET /api/vouches/given/:userId */
  app.get<{ Params: { userId: string } }>(
    "/vouches/given/:userId",
    async (req, reply) => {
      const { userId } = req.params;
      const rows = await db
        .select()
        .from(userVouches)
        .where(eq(userVouches.voucherId, userId))
        .orderBy(desc(userVouches.createdAt));
      return reply.send({ vouches: rows });
    },
  );

  /** GET /api/vouches/stats/:userId — aggregated stats */
  app.get<{ Params: { userId: string } }>(
    "/vouches/stats/:userId",
    async (req, reply) => {
      const { userId } = req.params;
      const [received] = await db
        .select({ count: count() })
        .from(userVouches)
        .where(eq(userVouches.voucheeId, userId));
      const [given] = await db
        .select({ count: count() })
        .from(userVouches)
        .where(eq(userVouches.voucherId, userId));
      const [totalScore] = await db
        .select({ score: sql`COALESCE(SUM(${userVouches.score}),0)` })
        .from(userVouches)
        .where(eq(userVouches.voucheeId, userId));

      return reply.send({
        userId,
        receivedCount: Number(received?.count ?? 0),
        givenCount: Number(given?.count ?? 0),
        totalScore: Number(totalScore?.score ?? 0),
        decayedScore: Number(totalScore?.score ?? 0), // client applies 1%/30d
      });
    },
  );

  /** DELETE /api/vouches/:id — only the original voucher can revoke. */
  app.delete<{ Params: { id: string } }>(
    "/vouches/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { id } = req.params;
      const deleted = await db
        .delete(userVouches)
        .where(and(eq(userVouches.id, id), eq(userVouches.voucherId, sub)))
        .returning();
      if (deleted.length === 0) {
        return reply.code(404).send({ error: "Vouch not found or not owned by you." });
      }
      invalidateAfterVouchChange();
      return reply.send({ ok: true });
    },
  );
}
