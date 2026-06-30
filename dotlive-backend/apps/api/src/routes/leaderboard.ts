/**
 * DOT Work Leaderboard.
 *
 * Aggregates publicly-visible stats from existing tables:
 *   - DOT earned (sum of credits on service orders completed, per builder)
 *   - Contracts completed (count of completed service orders)
 *   - Reputation (already in user_reputation table)
 *
 * Top-N: 50.
 * Cache: 60s.
 */
import type { FastifyInstance } from "fastify";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, wallets } from "../db/schema.js";

export async function leaderboardRoutes(app: FastifyInstance) {
  /* GET /api/leaderboard?sort=earnings|contracts|reputation&limit=50 */
  app.get("/leaderboard", async (req, reply) => {
    const q = req.query as { sort?: string; limit?: string };
    const sort = (q.sort ?? "earnings") as "earnings" | "contracts" | "reputation";
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 50)));

    // CTE that joins: user → wallet (current balance) → reputation (if exists).
    // We pick the top builders by their lifetime earned DOT, not current
    // balance, because the latter includes deposits.
    //
    // For an MVP, "earnings" = current wallet balance (proxy: builders earn DOT
    // by completing gigs; a separate ledger of credits would be the next step).
    // "contracts" = COUNT(serviceOrders where status='completed' and builderId=userId)
    //
    // serviceOrders may not be in the schema cast, so we use a raw subquery.

    let orderBy: any;
    if (sort === "contracts") {
      orderBy = sql`contracts_completed DESC NULLS LAST`;
    } else if (sort === "reputation") {
      orderBy = sql`reputation DESC NULLS LAST`;
    } else {
      orderBy = sql`dot_earned DESC NULLS LAST`;
    }

    const rows = await db.execute(sql`
      WITH board AS (
        SELECT
          u.id,
          u.name,
          u.avatar_url,
          u.headline,
          u.location,
          COALESCE(w.balance, 0)::numeric AS dot_balance,
          COALESCE((
            SELECT SUM(amount)::numeric
            FROM "transaction"
            WHERE "userId" = u.id AND type = 'credit'
          ), 0) AS dot_earned,
          COALESCE((
            SELECT COUNT(*)::int
            FROM service_orders
            WHERE "builderId" = u.id AND status = 'completed'
          ), 0) AS contracts_completed,
          COALESCE((
            SELECT score::int
            FROM user_reputation
            WHERE "userId" = u.id
            LIMIT 1
          ), 0) AS reputation
        FROM users u
        LEFT JOIN wallets w ON w."userId" = u.id
      )
      SELECT
        id, name, avatar_url, headline, location,
        dot_balance, dot_earned, contracts_completed, reputation
      FROM board
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `);

    return reply.send({
      sort,
      leaders: (rows as any).rows ?? rows ?? [],
    });
  });
}