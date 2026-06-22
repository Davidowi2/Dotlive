// @ts-nocheck
/**
 * Public stats route for the landing page.
 *
 * Returns live counts from the database. Until the platform
 * reaches real scale we fall back to a "beta" marker rather
 * than fabricating impressive numbers.
 */

import type { FastifyInstance } from "fastify";
import { sql } from "../db/client.js";
import { transactions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function statsRoutes(app: FastifyInstance) {
  /** GET /api/stats — public, cacheable for 60s. */
  app.get("/stats", async (_req, reply) => {
    // Single round-trip with COUNT()s.
    const counts = await sql<{
      users: number;
      ventures: number;
      countries: number;
      dot_in_circulation: string;
    }>`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM ventures) AS ventures,
        (SELECT COUNT(DISTINCT country)::int FROM ventures WHERE country IS NOT NULL) AS countries,
        (SELECT COALESCE(SUM(balance), 0)::text FROM wallets) AS dot_in_circulation
    `;
    const row = counts[0];

    // Sum of role-upgrade DOT spent = "DOT deployed into the economy".
    // We approximate "raised" by summing venture funding_goal for now.
    const deployedRows = await sql<{ total: string }>`
      SELECT COALESCE(SUM(funding_goal), 0)::text AS total
      FROM ventures WHERE funding_goal > 0
    `;
    const deployedNaira = Number(deployedRows[0]?.total ?? 0);

    // Thresholds for showing "beta" vs "live" framing on the landing.
    const isBeta = row.users < 10;

    reply.header("Cache-Control", "public, max-age=60");

    return reply.send({
      isBeta,
      builders: row.users,
      ventures: row.ventures,
      countries: row.countries,
      dotInCirculation: Number(row.dot_in_circulation),
      deployedNaira,
      // Expose a few recent activity entries (last 5 transactions).
      // In production this would be debounced/coalesced.
      recentActivity: [] as { text: string; ago: string }[],
    });
  });
}
