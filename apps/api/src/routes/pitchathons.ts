// @ts-nocheck
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
import { events, eventRegistrations, pitchathons, pitchathonApplications } from "../db/schema.js";
import { debitWallet } from "../lib/dot.js";

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
        .values({ eventId: req.params.id, userId: sub })
        .returning();
      return reply.send({ registration: inserted[0] });
    }
  );

  /* ---------- Pitchathons ---------- */
  app.get("/pitchathons", async (_req, reply) => {
    const rows = await db.select().from(pitchathons).orderBy(desc(pitchathons.createdAt));
    return reply.send({ pitchathons: rows });
  });

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
          })
          .returning();
        return reply.send({ application: inserted[0] });
      } catch (e) {
        return reply.code(500).send({ error: e instanceof Error ? e.message : "Apply failed" });
      }
    }
  );
}
// @ts-nocheck