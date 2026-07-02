/**
 * Events + Pitchathons routes.
 *
 * Events: listing and registration (DOT debit on paid events).
 * Pitchathons: listing and venture applications.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import { db, sql } from "../db/client.js";
import { events, eventRegistrations, pitchathons, pitchathonApplications, pitchathonScores } from "../db/schema.js";
import { debitWallet } from "../lib/dot.js";
import { userHasRole } from "../lib/auth.js";

export async function pitchathonRoutes(app: FastifyInstance) {
  /* ---------- Events ---------- */
  app.get("/events", async (_req, reply) => {
    const rows = await db.select().from(events).orderBy(desc(events.eventDate));
    return reply.send({ events: rows });
  });

  app.post<{ Params: { id: string } }>(
    "/events/:id/register",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const ev = await db.select().from(events).where(eq(events.id, req.params.id)).limit(1);
      if (ev.length === 0) return reply.code(404).send({ error: "Event not found" });

      // Check for existing registration.
      const existing = await db
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, req.params.id), eq(eventRegistrations.userId, sub)))
        .limit(1);
      if (existing.length > 0) return reply.code(409).send({ error: "Already registered" });

      // Capacity check.
      const countRows = await sql`SELECT COUNT(*)::int AS n FROM event_registrations WHERE event_id = ${req.params.id}`;
      const count = countRows[0]?.n ?? 0;
      if (count >= (ev[0].capacity ?? 100)) return reply.code(409).send({ error: "Event is full" });

      // Debit DOT for paid events.
      if (ev[0].dotCost && ev[0].dotCost > 0) {
        try {
          await debitWallet({
            userId: sub,
            amount: ev[0].dotCost,
            type: "Event Registration",
            description: `Event ${ev[0].title}`,
          });
        } catch (e) {
          return reply.code(402).send({ error: e instanceof Error ? e.message : "Insufficient DOT" });
        }
      }

      const inserted = await db
        .insert(eventRegistrations)
        .values({ eventId: req.params.id, userId: sub } as any)
        .returning();
      return reply.send({ registration: inserted[0] });
    }
  );

  /** GET /api/events/registrations/me — list event IDs the current user registered for. */
  app.get(
    "/events/registrations/me",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const rows = await db
        .select({ eventId: eventRegistrations.eventId, attended: eventRegistrations.attended })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.userId, sub));
      return reply.send({ registrations: rows });
    }
  );

  /* ---------- Pitchathons ---------- */
  // (GET /pitchathons is declared later in the admin section.)

  app.post<{ Params: { id: string } }>(
    "/pitchathons/:id/apply",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const parsed = z
        .object({
          ventureName: z.string().min(1).max(200),
          pitchDeckUrl: z.string().url().optional(),
          fundingAsk: z.number().nonnegative().optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const existing = await db
        .select()
        .from(pitchathonApplications)
        .where(
          and(eq(pitchathonApplications.pitchathonId, req.params.id), eq(pitchathonApplications.founderId, sub))
        )
        .limit(1);
      if (existing.length > 0) return reply.code(409).send({ error: "Already applied" });

      try {
        const inserted = await db
          .insert(pitchathonApplications)
          .values({
            pitchathonId: req.params.id,
            founderId: sub,
            ventureName: parsed.data.ventureName,
            pitchDeckUrl: parsed.data.pitchDeckUrl,
            fundingAsk: parsed.data.fundingAsk != null ? String(parsed.data.fundingAsk) : null,
            status: "submitted",
          } as any)
          .returning();
        return reply.send({ application: inserted[0] });
      } catch (e) {
        return reply.code(500).send({ error: e instanceof Error ? e.message : "Apply failed" });
      }
    }
  );
  /* ---------- Judge scoring (DOT Demo) ---------- */

  /** POST /api/pitchathons/:id/score — judges score an application (1-10). */
  app.post<{ Params: { id: string } }>(
    "/pitchathons/:id/score",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const isJudge = await userHasRole(sub, "judge");
      const isCapitalPartner = await userHasRole(sub, "capital_partner");
      const isAdmin = await userHasRole(sub, "admin");
      if (!isJudge && !isCapitalPartner && !isAdmin) return reply.code(403).send({ error: "Judges only" });

      const parsed = z
        .object({
          applicationId: z.string().uuid(),
          score: z.number().int().min(1).max(10),
          note: z.string().max(2000).optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      try {
        const inserted = await db
          .insert(pitchathonScores)
          .values({
            pitchathonId: req.params.id,
            applicationId: parsed.data.applicationId,
            judgeId: sub,
            score: parsed.data.score,
            note: parsed.data.note ?? null,
          } as any)
          .returning();
        return reply.send({ score: inserted[0] });
      } catch {
        return reply.code(409).send({ error: "Already scored this application" });
      }
    },
  );

  /** GET /api/pitchathons/:id/applications — list applications for a pitchathon.
   *  Used by the judge portal to show pending submissions.                */
  app.get<{ Params: { id: string } }>(
    "/pitchathons/:id/applications",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const isJudge = await userHasRole(sub, "judge");
      const isCapitalPartner = await userHasRole(sub, "capital_partner");
      const isAdmin = await userHasRole(sub, "admin");
      if (!isJudge && !isCapitalPartner && !isAdmin) {
        return reply.code(403).send({ error: "Judges only" });
      }
      // Pull all applications for the pitchathon, then attach a "myScore"
      // for the current judge and an aggregate "avgScore" across judges.
      const apps = await db
        .select()
        .from(pitchathonApplications)
        .where(eq(pitchathonApplications.pitchathonId, req.params.id))
        .orderBy(desc(pitchathonApplications.createdAt));

      const out: any[] = [];
      for (const a of apps) {
        const allScores = await db
          .select()
          .from(pitchathonScores)
          .where(eq(pitchathonScores.applicationId, a.id));
        const my = allScores.find((s) => s.judgeId === sub) ?? null;
        const avg = allScores.length
          ? Math.round(
              (allScores.reduce((s, r) => s + r.score, 0) / allScores.length) * 10,
            ) / 10
          : null;
        out.push({ ...a, myScore: my, avgScore: avg, scoreCount: allScores.length });
      }
      return reply.send({ applications: out });
    },
  );

  /** GET /api/pitchathons — list all pitchathons. */
  app.get("/pitchathons", async (_req, reply) => {
    const rows = await db
      .select()
      .from(pitchathons)
      .orderBy(desc(pitchathons.startDate));
    return reply.send({ pitchathons: rows });
  });

  /** GET /api/pitchathons/:id/leaderboard — ranked applications by avg score. */
  app.get<{ Params: { id: string } }>(
    "/pitchathons/:id/leaderboard",
    async (req, reply) => {
      // Get all applications with their average score
      const apps = await db
        .select()
        .from(pitchathonApplications)
        .where(eq(pitchathonApplications.pitchathonId, req.params.id));

      const rows: any[] = [];
      for (const a of apps) {
        const scores = await db
          .select()
          .from(pitchathonScores)
          .where(eq(pitchathonScores.applicationId, a.id));
        const avg = scores.length
          ? Math.round((scores.reduce((s, r) => s + r.score, 0) / scores.length) * 10) / 10
          : 0;
        rows.push({ application: a, scoreCount: scores.length, avgScore: avg });
      }
      rows.sort((x, y) => y.avgScore - x.avgScore);
      return reply.send({ leaderboard: rows });
    },
  );
}
// @ts-nocheck