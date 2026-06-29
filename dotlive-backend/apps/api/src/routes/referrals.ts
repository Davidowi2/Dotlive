import type { FastifyInstance } from "fastify";
import { eq, sql, desc, and, isNotNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

/**
 * Referral system routes.
 *
 *   GET  /api/referrals/me          — get my referral code, link, count, earnings
 *   GET  /api/referrals/leaderboard — top referrers by count
 *   POST /api/referrals/validate    — check if a code exists (signup pre-flight)
 */
export async function referralRoutes(app: FastifyInstance) {
  /** GET /api/referrals/me */
  app.get("/referrals/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    const [me] = await db
      .select({
        id: users.id,
        referralCode: users.referralCode,
        referredBy: users.referredBy,
        referralCount: users.referralCount,
        referralEarningsDot: users.referralEarningsDot,
        name: users.name,
        dotId: users.dotId,
      })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);

    if (!me) return reply.code(404).send({ error: "User not found" });

    return reply.send({
      code: me.referralCode,
      link: `https://dotlive.cv/r/${me.referralCode}`,
      count: Number(me.referralCount ?? 0),
      earningsDot: String(me.referralEarningsDot ?? "0"),
      referredBy: me.referredBy ?? null,
    });
  });

  /** GET /api/referrals/leaderboard */
  app.get("/referrals/leaderboard", async (_req, reply) => {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        dotId: users.dotId,
        referralCode: users.referralCode,
        referralCount: users.referralCount,
        referralEarningsDot: users.referralEarningsDot,
      })
      .from(users)
      .where(sql`${users.referralCount} > 0`)
      .orderBy(desc(users.referralCount))
      .limit(20);

    return reply.send({
      leaderboard: rows.map((r) => ({
        name: r.name ?? "Anonymous",
        dotId: r.dotId,
        referralCode: r.referralCode,
        referralCount: Number(r.referralCount ?? 0),
        earningsDot: String(r.referralEarningsDot ?? "0"),
      })),
    });
  });

  /** POST /api/referrals/validate — checks if a code is real (for signup form) */
  app.post<{ Body: { code?: string } }>("/referrals/validate", async (req, reply) => {
    const code = (req.body?.code ?? "").trim().toUpperCase();
    if (!code) return reply.code(400).send({ error: "Missing code" });

    const [u] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (!u) return reply.code(404).send({ valid: false, error: "Referral code not found" });

    return reply.send({ valid: true, referrerName: u.name ?? "A DOT member" });
  });
}