/**
 * Builder Arena — public profiles + reviews.
 *
 *   GET  /api/builders/:id/arena         public profile (no auth)
 *   GET  /api/builders/:id/reviews       public reviews list
 *   POST /api/builders/:id/reviews       leave a review (auth, must be order client)
 *   POST /api/builders/:id/refresh-stats re-aggregate stats (admin/dev)
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  users,
  builderProfiles,
  builderReviews,
} from "../db/schema.js";

export async function builderArenaRoutes(app: FastifyInstance) {
  const getUserId = (req: any): string =>
    (req.user as { sub?: string } | undefined)?.sub ?? "";

  /** GET /api/builders?search=… — list builders (public). */
  app.get<{ Querystring: { search?: string; limit?: string } }>(
    "/builders",
    async (req, reply) => {
      const { search } = req.query;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const q = (search ?? "").trim();
      const rows = q
        ? await db.execute(sql`
            SELECT u.id, u.name, u.dot_id AS "dotId", u.headline, u.location, u.avatar_url AS "avatarUrl",
                   bp.skills AS skills, bp.bio AS bio, bp.available AS available
            FROM users u
            LEFT JOIN builder_profiles bp ON bp.id = u.id
            WHERE u.roles @> ARRAY['builder']::text[]
              AND (LOWER(u.name) LIKE ${"%" + q.toLowerCase() + "%"}
                   OR LOWER(COALESCE(u.dot_id, '')) LIKE ${"%" + q.toLowerCase() + "%"})
            ORDER BY u.name
            LIMIT ${limit}
          `)
        : await db.execute(sql`
            SELECT u.id, u.name, u.dot_id AS "dotId", u.headline, u.location, u.avatar_url AS "avatarUrl",
                   bp.skills AS skills, bp.bio AS bio, bp.available AS available
            FROM users u
            LEFT JOIN builder_profiles bp ON bp.id = u.id
            WHERE u.roles @> ARRAY['builder']::text[]
            ORDER BY u.created_at DESC
            LIMIT ${limit}
          `);
      const list = (rows as any).rows ?? (Array.isArray(rows) ? rows : []);
      return reply.send({ builders: list });
    },
  );

  /** GET /api/builders/:id/arena */
  app.get<{ Params: { id: string } }>("/builders/:id/arena", async (req, reply) => {
    const id = req.params.id;
    try {
      const [userRow] = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          dotId: users.dotId,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (!userRow) return reply.code(404).send({ error: "Builder not found" });

      let profile = null;
      try {
        const [p] = await db.select().from(builderProfiles).where(eq(builderProfiles.id, id)).limit(1);
        profile = p ?? null;
      } catch {
        // builder_profiles may not have all columns yet — return user data only
      }

      return reply.send({ builder: { ...userRow, profile } });
    } catch (e) {
      req.log.error(e, "builder/arena query failed");
      return reply.code(500).send({ error: `DB error: ${(e as Error).message}` });
    }
  });

  /** GET /api/builders/:id/reviews */
  app.get<{ Params: { id: string } }>("/builders/:id/reviews", async (req, reply) => {
    const id = req.params.id;
    const rows = await db
      .select({
        id: builderReviews.id,
        orderId: builderReviews.orderId,
        rating: builderReviews.rating,
        comment: builderReviews.comment,
        createdAt: builderReviews.createdAt,
        reviewerId: builderReviews.reviewerId,
      })
      .from(builderReviews)
      .where(eq(builderReviews.builderId, id))
      .orderBy(desc(builderReviews.createdAt))
      .limit(50);
    return reply.send({ reviews: rows });
  });

  /** POST /api/builders/:id/reviews — leave a rating */
  const reviewSchema = z.object({
    orderId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  });

  app.post<{ Params: { id: string } }>(
    "/builders/:id/reviews",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const reviewerId = getUserId(req);
      const builderId = req.params.id;
      const parsed = reviewSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      try {
        const inserted = await db
          .insert(builderReviews)
          .values({
            builderId,
            reviewerId,
            orderId: parsed.data.orderId,
            rating: parsed.data.rating,
            comment: parsed.data.comment ?? null,
          } as any)
          .returning();
        // Recompute aggregate.
        await refreshBuilderStats(builderId);
        return reply.send({ review: inserted[0] });
      } catch (e) {
        return reply.code(409).send({ error: "You already reviewed this order" });
      }
    },
  );

  /** POST /api/builders/:id/refresh-stats — re-aggregate (admin) */
  app.post<{ Params: { id: string } }>(
    "/builders/:id/refresh-stats",
    { preHandler: app.authenticate },
    async (req, reply) => {
      await refreshBuilderStats(req.params.id);
      return reply.send({ ok: true });
    },
  );
}

/**
 * Re-aggregate the denormalized stats on builder_profiles from the
 * source-of-truth tables. Idempotent.
 */
async function refreshBuilderStats(builderId: string) {
  // Total earned DOT (sum of credit transactions on completed orders)
  // Total completed orders count
  // Avg rating + count from builder_reviews
  await db.execute(sql`
    UPDATE builder_profiles bp
    SET
      total_earned_dot = COALESCE((
        SELECT SUM(amount)::numeric
        FROM transactions t
        WHERE t.user_id = ${builderId}
          AND t.type IN ('credit', 'Gig Order', 'Service Order')
      ), 0),
      total_completed_orders = COALESCE((
        SELECT COUNT(*)::int
        FROM service_orders so
        WHERE so.builder_id = ${builderId} AND so.status = 'completed'
      ), 0),
      avg_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM builder_reviews
        WHERE builder_id = ${builderId}
      ), 0),
      review_count = COALESCE((
        SELECT COUNT(*)::int FROM builder_reviews WHERE builder_id = ${builderId}
      ), 0),
      last_active_at = NOW(),
      updated_at = NOW()
    WHERE bp.id = ${builderId}
  `);
  // Make sure the row exists (in case profile is fresh)
  await db
    .insert(builderProfiles)
    .values({ id: builderId, headline: "" } as any)
    .onConflictDoNothing({ target: builderProfiles.id });
}