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
      const { sub } = (req as any).user as { sub: string };
      // Fetch the meeting first so we know both sides.
      const existing = await db
        .select()
        .from(meetingRequests)
        .where(eq(meetingRequests.id, req.params.id))
        .limit(1);
      if (existing.length === 0) return reply.code(404).send({ error: "Not found" });

      await db
        .update(meetingRequests)
        .set({ status: parsed.data.status, updatedAt: new Date() } as any)
        .where(eq(meetingRequests.id, req.params.id));

      const m = existing[0];
      let newConnectionId: string | null = null;
      // Notify the *other* side of the meeting outcome + open chat thread.
      try {
        const { notify } = await import("../lib/notify.js");
        const { connections, connectionMessages } = await import("../db/schema.js");
        const status = parsed.data.status;
        if (status === "accepted") {
          // Open or reactivate a connection between the two parties.
          const [userA, userB] = [m.investorId, m.founderId].sort();
          const existing_conn = await db
            .select()
            .from(connections)
            .where(and(
              eq(connections.userAId, userA),
              eq(connections.userBId, userB),
            ))
            .limit(1);
          if (existing_conn.length === 0) {
            const [inserted] = await db.insert(connections).values({
              userAId: userA,
              userBId: userB,
              status: "active",
              meetingId: m.id,
              initiatedBy: m.investorId,
            } as any).returning({ id: connections.id });
            if (inserted) {
              newConnectionId = inserted.id;
            }
          } else if (existing_conn[0].status !== "active") {
            await db
              .update(connections)
              .set({ status: "active" } as any)
              .where(eq(connections.id, existing_conn[0].id));
            newConnectionId = existing_conn[0].id;
          } else {
            newConnectionId = existing_conn[0].id;
          }
          await notify({
            userId: m.investorId,
            type: "meeting_accepted",
            title: "Meeting accepted",
            body: `A founder accepted your meeting request. Open the conversation → /messages.`,
            link: "/meetings",
            icon: "CalendarCheck",
          });
          // Notify founder too that their accept was logged (if distinct from actor).
          if (m.founderId && m.founderId !== sub) {
            await notify({
              userId: m.founderId,
              type: "meeting_requested",
              title: "Meeting opened",
              body: `You accepted a meeting. The chat thread with the investor is live.`,
              link: "/meetings",
              icon: "MessageSquare",
            });
          }
        } else if (status === "declined") {
          await notify({
            userId: m.investorId,
            type: "system",
            title: "Meeting declined",
            body: `A founder declined your meeting request.`,
            link: "/discover",
            icon: "X",
          });
        }
      } catch (err) {
        app.log?.warn?.({ err }, "meeting notify failed");
      }

      return reply.send({ ok: true, connectionId: newConnectionId });
    },
  );
}
// @ts-nocheck
