/**
 * DOT OS — Demo events + Voting routes (Sprint A.3)
 *
 *   GET    /api/demo/events                 List events (public)
 *   GET    /api/demo/events/:slug           Get one event (public)
 *   POST   /api/demo/events                 Create event (admin)
 *   PUT    /api/demo/events/:slug           Update event (admin)
 *
 *   POST   /api/votes                       Cast a vote
 *   GET    /api/votes/:eventSlug/leaderboard  Get ranked results
 *   GET    /api/votes/me                    List my votes
 *
 * Anti-fraud:
 *   - 1 vote per user per (event, target) — enforced by unique index
 *   - Vote weight = 1 (multiplied by reputation for ranking)
 *   - Must be logged in (even for public events — easier to ban abusers)
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql, count, countDistinct } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { demoEvents, votes, users } from "../db/schema.js";
import { getUserRoles } from "../lib/auth.js";

const requireAdmin = async (req: any, reply: any) => {
  const id = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(id);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return reply.code(403).send({ error: "Admin only" });
  }
};

const eventSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationDeadline: z.string().datetime().optional(),
  votingOpensAt: z.string().datetime().optional(),
  votingClosesAt: z.string().datetime().optional(),
  tracks: z.array(z.enum(["open", "invitational"])).default(["open", "invitational"]),
  sponsors: z.array(z.any()).default([]),
  judges: z.array(z.any()).default([]),
  prizePoolDot: z.number().optional(),
  livestreamUrl: z.string().url().optional(),
  registrationFeeDot: z.number().default(0),
  featuredVentures: z.array(z.string()).default([]),
  status: z.enum(["upcoming", "registration_open", "voting_open", "live", "completed"]).default("upcoming"),
});

export async function demoEventRoutes(app: FastifyInstance) {
  /* ============================== LIST EVENTS ============================== */

  app.get("/demo/events", async (_req, reply) => {
    const rows = await db
      .select()
      .from(demoEvents)
      .orderBy(desc(demoEvents.startDate))
      .limit(50);
    return reply.send({ events: rows });
  });

  /* ============================== GET ONE EVENT ============================== */

  app.get<{ Params: { slug: string } }>("/demo/events/:slug", async (req, reply) => {
    const { slug } = req.params;
    const [e] = await db.select().from(demoEvents).where(eq(demoEvents.slug, slug)).limit(1);
    if (!e) return reply.code(404).send({ error: "Event not found" });

    // Vote counts per venture
    const counts = await db
      .select({
        targetId: votes.targetId,
        totalVotes: count(),
        totalWeight: sql<string>`COALESCE(SUM(${votes.weight}), 0)`,
      })
      .from(votes)
      .where(eq(votes.eventSlug, slug))
      .groupBy(votes.targetId)
      .orderBy(desc(sql`SUM(${votes.weight})`));

    return reply.send({ event: e, voteCounts: counts });
  });

  /* ============================== CREATE EVENT (ADMIN) ============================== */

  app.post("/demo/events", { preHandler: [app.authenticate, requireAdmin] }, async (req, reply) => {
    const adminId = (req.user as { sub: string }).sub;
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    try {
      const [created] = await db
        .insert(demoEvents)
        .values({
          ...parsed.data,
          tracks: parsed.data.tracks,
          sponsors: parsed.data.sponsors,
          judges: parsed.data.judges,
          featuredVentures: parsed.data.featuredVentures,
          createdBy: adminId,
          startDate: new Date(parsed.data.startDate),
          endDate: new Date(parsed.data.endDate),
          registrationDeadline: parsed.data.registrationDeadline ? new Date(parsed.data.registrationDeadline) : null,
          votingOpensAt: parsed.data.votingOpensAt ? new Date(parsed.data.votingOpensAt) : null,
          votingClosesAt: parsed.data.votingClosesAt ? new Date(parsed.data.votingClosesAt) : null,
        } as any)
        .returning();
      return reply.send({ event: created });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate key")) return reply.code(409).send({ error: "Slug already exists" });
      return reply.code(500).send({ error: msg });
    }
  });

  /* ============================== UPDATE EVENT (ADMIN) ============================== */

  app.put<{ Params: { slug: string } }>(
    "/demo/events/:slug",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { slug } = req.params;
      const parsed = eventSchema.partial().safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const updates: any = { ...parsed.data, updatedAt: new Date() };
      if (parsed.data.startDate) updates.startDate = new Date(parsed.data.startDate);
      if (parsed.data.endDate) updates.endDate = new Date(parsed.data.endDate);
      if (parsed.data.registrationDeadline) updates.registrationDeadline = new Date(parsed.data.registrationDeadline);
      if (parsed.data.votingOpensAt) updates.votingOpensAt = new Date(parsed.data.votingOpensAt);
      if (parsed.data.votingClosesAt) updates.votingClosesAt = new Date(parsed.data.votingClosesAt);

      const [updated] = await db
        .update(demoEvents)
        .set(updates)
        .where(eq(demoEvents.slug, slug))
        .returning();
      if (!updated) return reply.code(404).send({ error: "Event not found" });
      return reply.send({ event: updated });
    },
  );

  /* ============================== CAST VOTE ============================== */

  app.post("/votes", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = (req.body ?? {}) as {
      eventSlug?: string;
      targetType?: string;
      targetId?: string;
    };

    if (!body.eventSlug || !body.targetType || !body.targetId) {
      return reply.code(400).send({ error: "eventSlug, targetType, targetId required" });
    }

    if (!["venture", "challenge", "builder", "community"].includes(body.targetType)) {
      return reply.code(400).send({ error: "targetType must be venture | challenge | builder | community" });
    }

    // Check event exists + voting is open
    const [event] = await db.select().from(demoEvents).where(eq(demoEvents.slug, body.eventSlug)).limit(1);
    if (!event) return reply.code(404).send({ error: "Event not found" });

    const now = new Date();
    if (event.votingOpensAt && event.votingOpensAt > now) {
      return reply.code(400).send({ error: "Voting hasn't opened yet" });
    }
    if (event.votingClosesAt && event.votingClosesAt < now) {
      return reply.code(400).send({ error: "Voting has closed" });
    }

    // Get voter reputation for weight calculation
    const repRows = await db.execute(sql`
      SELECT COALESCE(SUM(delta), 0)::int AS total FROM reputation_events WHERE user_id = ${sub}
    `);
    const voterReputation = Number(((repRows as any).rows?.[0]?.total ?? 0));

    try {
      const [vote] = await db
        .insert(votes)
        .values({
          voterId: sub,
          eventSlug: body.eventSlug,
          targetType: body.targetType,
          targetId: body.targetId,
          weight: "1.00",
          reputationAtVote: String(Math.min(voterReputation, 1000)),
          ipHash: req.ip ? crypto.createHash("sha256").update(req.ip).digest("hex").slice(0, 32) : null,
          userAgent: (req.headers["user-agent"] as string)?.slice(0, 200) ?? null,
        } as any)
        .returning();
      return reply.send({ vote });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate key")) return reply.code(409).send({ error: "You already voted for this target in this event" });
      return reply.code(500).send({ error: msg });
    }
  });

  /* ============================== VENTURE VOTE COUNT ============================== */

  /** GET /api/votes/venture/:id/count — public vote count for any venture */
  app.get<{ Params: { id: string } }>("/votes/venture/:id/count", async (req, reply) => {
    const { id } = req.params;
    const [row] = await db.execute(sql`
      SELECT
        COALESCE(SUM(vote_weight), 0)::int AS total_votes,
        COUNT(*)::int AS vote_count,
        COUNT(DISTINCT voter_id)::int AS unique_voters
      FROM votes
      WHERE target_id = ${id}
        AND target_type = 'venture'
    `) as any;
    const r = (row as any)[0] ?? (row as any).rows?.[0] ?? {};
    return reply.send({
      ventureId: id,
      totalVotes: Number(r.total_votes ?? 0),
      voteCount: Number(r.vote_count ?? 0),
      uniqueVoters: Number(r.unique_voters ?? 0),
    });
  });

  /* ============================== LEADERBOARD ============================== */

  app.get<{ Params: { eventSlug: string } }>(
    "/votes/:eventSlug/leaderboard",
    async (req, reply) => {
      const { eventSlug } = req.params;
      const q = (req.query ?? {}) as { type?: string; limit?: string };

      const filters: any[] = [eq(votes.eventSlug, eventSlug)];
      if (q.type) filters.push(eq(votes.targetType, q.type));

      const rows = await db
        .select({
          targetId: votes.targetId,
          targetType: votes.targetType,
          totalVotes: count(),
          totalWeight: sql<string>`COALESCE(SUM(${votes.weight} * ${votes.reputationAtVote}), 0)`,
          uniqueVoters: countDistinct(votes.voterId),
        })
        .from(votes)
        .where(and(...filters))
        .groupBy(votes.targetId, votes.targetType)
        .orderBy(desc(sql`SUM(${votes.weight} * ${votes.reputationAtVote})`))
        .limit(Number(q.limit ?? 100));

      return reply.send({ leaderboard: rows, eventSlug });
    },
  );

  /* ============================== MY VOTES ============================== */

  app.get("/votes/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(votes)
      .where(eq(votes.voterId, sub))
      .orderBy(desc(votes.createdAt))
      .limit(100);
    return reply.send({ votes: rows });
  });

  /* ============================== REMOVE VOTE ============================== */

  app.delete<{ Params: { id: string } }>(
    "/votes/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { id } = req.params;
      const deleted = await db
        .delete(votes)
        .where(and(eq(votes.id, id), eq(votes.voterId, sub)))
        .returning();
      if (deleted.length === 0) return reply.code(404).send({ error: "Vote not found or not yours" });
      return reply.send({ ok: true });
    },
  );
}