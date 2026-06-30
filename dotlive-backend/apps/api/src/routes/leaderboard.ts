/**
 * DOT Work Leaderboard.
 *
 * Aggregates publicly-visible stats from existing tables:
 *   - DOT earned (sum of credits on service orders completed, per builder)
 *   - Contracts completed (count of completed service orders)
 *   - Reputation (from user_reputation table)
 *
 * Sort:   earnings | contracts | reputation  (default: earnings)
 * Window: all | monthly | weekly | daily     (default: all)
 * Limit:  max 100 (default 50)
 */
import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

type Sort = "earnings" | "contracts" | "reputation";
type Window = "all" | "monthly" | "weekly" | "daily";

export async function leaderboardRoutes(app: FastifyInstance) {
  /* GET /api/leaderboard?sort=earnings|contracts|reputation&window=all|monthly|weekly|daily */
  app.get("/leaderboard", async (req, reply) => {
    const q = req.query as { sort?: string; window?: string; limit?: string };

    const sort: Sort = (["earnings", "contracts", "reputation"] as Sort[]).includes(
      (q.sort as Sort) ?? "earnings",
    )
      ? ((q.sort as Sort) ?? "earnings")
      : "earnings";

    const window: Window = (["all", "monthly", "weekly", "daily"] as Window[]).includes(
      (q.window as Window) ?? "all",
    )
      ? ((q.window as Window) ?? "all")
      : "all";

    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 50)));

    // Build the date filter for the contracts + credit subqueries.
    // "all" → no filter (lifetime).
    // daily → last 24 h; weekly → last 7 d; monthly → last 30 d.
    const sinceClause =
      window === "all"
        ? sql``
        : window === "daily"
        ? sql`AND t.created_at >= NOW() - INTERVAL '1 day'`
        : window === "weekly"
        ? sql`AND t.created_at >= NOW() - INTERVAL '7 days'`
        : sql`AND t.created_at >= NOW() - INTERVAL '30 days'`;

    const orderBy =
      sort === "contracts"
        ? sql`contracts_completed DESC NULLS LAST`
        : sort === "reputation"
        ? sql`reputation DESC NULLS LAST`
        : sql`dot_earned DESC NULLS LAST`;

    const rows = await db.execute(sql`
      WITH board AS (
        SELECT
          u.id,
          u.name,
          u.avatar_url,
          u.headline,
          u.location,
          u.dot_id,
          COALESCE(w.balance, 0)::numeric AS dot_balance,
          COALESCE((
            SELECT SUM(amount)::numeric
            FROM "transaction" t
            WHERE t."userId" = u.id AND t.type IN ('credit', 'Gig Order', 'Service Order')
              ${sinceClause}
          ), 0) AS dot_earned,
          COALESCE((
            SELECT COUNT(*)::int
            FROM service_orders so
            WHERE so."builderId" = u.id AND so.status = 'completed'
              ${window === "all" ? sql`` : window === "daily" ? sql`AND so."updated_at" >= NOW() - INTERVAL '1 day'` : window === "weekly" ? sql`AND so."updated_at" >= NOW() - INTERVAL '7 days'` : sql`AND so."updated_at" >= NOW() - INTERVAL '30 days'`}
          ), 0) AS contracts_completed,
          COALESCE((
            SELECT score::int
            FROM user_reputation ur
            WHERE ur."userId" = u.id
            LIMIT 1
          ), 0) AS reputation
        FROM users u
        LEFT JOIN wallets w ON w."userId" = u.id
      )
      SELECT
        id, name, avatar_url, headline, location, dot_id,
        dot_balance, dot_earned, contracts_completed, reputation
      FROM board
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `);

    return reply.send({
      sort,
      window,
      leaders: (rows as any).rows ?? rows ?? [],
    });
  });
}
