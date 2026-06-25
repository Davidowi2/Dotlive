/**
 * Investor routes: save founders, request meetings.
 *
 * GET  /api/investor/saves            — saved founders
 * POST /api/investor/saves            — save a founder
 * DEL  /api/investor/saves/:founderId  — un-save
 *
 * GET  /api/investor/meetings         — meetings I requested
 * POST /api/investor/meetings         — request a meeting
 * PATCH /api/investor/meetings/:id    — accept/decline
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { investorSaves, meetingRequests, users } from "../db/schema.js";

const saveSchema = z.object({ founderId: z.string().min(1) });

const meetingSchema = z.object({
  founderId: z.string().min(1),
  topic: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  requestedFor: z.string().datetime().optional(),
});

const meetingUpdateSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

export async function investorRoutes(app: FastifyInstance) {
  /** GET /api/investor/saves */
  app.get("/investor/saves", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(investorSaves)
      .where(eq(investorSaves.investorId, sub))
      .orderBy(desc(investorSaves.createdAt));
    return reply.send({ saves: rows });
  });

  /** POST /api/investor/saves */
  app.post("/investor/saves", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    try {
      const inserted = await db
        .insert(investorSaves)
        .values({ investorId: sub, founderId: parsed.data.founderId } as any)
        .returning();
      return reply.send({ save: inserted[0] });
    } catch {
      return reply.code(409).send({ error: "Already saved" });
    }
  });

  /** DELETE /api/investor/saves/:founderId */
  app.delete<{ Params: { founderId: string } }>(
    "/investor/saves/:founderId",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      await db
        .delete(investorSaves)
        .where(
          and(eq(investorSaves.investorId, sub), eq(investorSaves.founderId, req.params.founderId)),
        );
      return reply.send({ ok: true });
    },
  );

  /** GET /api/investor/meetings */
  app.get("/investor/meetings", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(meetingRequests)
      .where(eq(meetingRequests.investorId, sub))
      .orderBy(desc(meetingRequests.createdAt));
    return reply.send({ meetings: rows });
  });

  /** POST /api/investor/meetings */
  app.post("/investor/meetings", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = meetingSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const inserted = await db
      .insert(meetingRequests)
      .values({
        id: crypto.randomUUID(),
        investorId: sub,
        founderId: parsed.data.founderId,
        topic: parsed.data.topic,
        message: parsed.data.message ?? null,
        requestedFor: parsed.data.requestedFor ? new Date(parsed.data.requestedFor) : null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();
    return reply.send({ meeting: inserted[0] });
  });

  /** PATCH /api/investor/meetings/:id */
  app.patch<{ Params: { id: string } }>(
    "/investor/meetings/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const parsed = meetingUpdateSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      await db
        .update(meetingRequests)
        .set({ status: parsed.data.status, updatedAt: new Date() } as any)
        .where(eq(meetingRequests.id, req.params.id));
      return reply.send({ ok: true });
    },
  );
}
// @ts-nocheck
