/**
 * Connections (chat threads) routes.
 *
 * Lifecycle:
 *   pending    — meeting request sent, awaiting other side's accept
 *   active     — meeting accepted; both sides can message
 *   closed     — either side ended the conversation
 *
 * Endpoints:
 *   GET  /api/connections                   — my threads (list)
 *   GET  /api/connections/:id               — thread + messages (paginated)
 *   POST /api/connections/:id/messages      — send message (active only)
 *   POST /api/connections/:id/close         — close thread
 *   POST /api/connections/from-meeting/:id  — open/activate from meeting accept
 *                                             (idempotent)
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, asc, eq, or, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  connections,
  connectionMessages,
  users,
} from "../db/schema.js";
import { notify } from "../lib/notify.js";

export async function connectionRoutes(app: FastifyInstance) {
  const getUserId = (req: any): string =>
    (req.user as { sub?: string } | undefined)?.sub ?? "";

  async function loadThread(id: string) {
    const rows = await db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async function loadThreadByPair(a: string, b: string) {
    const rows = await db
      .select()
      .from(connections)
      .where(
        or(
          and(eq(connections.userAId, a), eq(connections.userBId, b)),
          and(eq(connections.userAId, b), eq(connections.userBId, a)),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  /* -------------------- LIST my threads -------------------- */
  app.get("/connections", { preHandler: app.authenticate }, async (req, reply) => {
    const userId = getUserId(req);
    const status = (req.query as any)?.status as string | undefined;
    const rows = await db
      .select({
        id: connections.id,
        userAId: connections.userAId,
        userBId: connections.userBId,
        status: connections.status,
        meetingId: connections.meetingId,
        initiatedBy: connections.initiatedBy,
        createdAt: connections.createdAt,
        closedAt: connections.closedAt,
        otherName: sql<string>`COALESCE(ua.name, ub.name)`,
        otherDotId: sql<string>`COALESCE(ua.dot_id, ub.dot_id)`,
        otherAvatar: sql<string>`COALESCE(ua.avatar_url, ub.avatar_url)`,
        lastMessage: sql<string>`(SELECT body FROM connection_messages WHERE connection_id = ${connections.id} ORDER BY created_at DESC LIMIT 1)`,
        lastMessageAt: sql<string>`(SELECT created_at FROM connection_messages WHERE connection_id = ${connections.id} ORDER BY created_at DESC LIMIT 1)`,
        unreadCount: sql<string>`(
          SELECT COUNT(*) FROM connection_messages
          WHERE connection_id = ${connections.id}
            AND sender_id != ${userId}
            AND read_at IS NULL
        )`,
      })
      .from(connections)
      .leftJoin(users as ua, sql`${connections.userAId} = ${ua.id}`)
      .leftJoin(users as ub, sql`${connections.userBId} = ${ub.id}`)
      .where(or(eq(connections.userAId, userId), eq(connections.userBId, userId)))
      .orderBy(asc(connections.createdAt));
    return reply.send({ connections: rows });
  });

  /* -------------------- GET thread + messages -------------------- */
  app.get<{ Params: { id: string } }>(
    "/connections/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = getUserId(req);
      const thread = await loadThread(req.params.id);
      if (!thread) return reply.code(404).send({ error: "Not found" });
      if (thread.userAId !== userId && thread.userBId !== userId) {
        return reply.code(403).send({ error: "Not your thread" });
      }
      const messages = await db
        .select()
        .from(connectionMessages)
        .where(eq(connectionMessages.connectionId, thread.id))
        .orderBy(asc(connectionMessages.createdAt));
      // Mark as read.
      await db
        .update(connectionMessages)
        .set({ readAt: new Date() } as any)
        .where(
          and(
            eq(connectionMessages.connectionId, thread.id),
            sql`${connectionMessages.senderId} != ${userId}`,
            sql`${connectionMessages.readAt} IS NULL`,
          ),
        );
      return reply.send({ thread, messages });
    },
  );

  /* -------------------- SEND message -------------------- */
  const sendSchema = z.object({ body: z.string().min(1).max(2000) });
  app.post<{ Params: { id: string } }>(
    "/connections/:id/messages",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = getUserId(req);
      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const thread = await loadThread(req.params.id);
      if (!thread) return reply.code(404).send({ error: "Not found" });
      if (thread.userAId !== userId && thread.userBId !== userId) {
        return reply.code(403).send({ error: "Not your thread" });
      }
      if (thread.status !== "active") {
        return reply.code(403).send({ error: "Thread is not active" });
      }

      const inserted = await db
        .insert(connectionMessages)
        .values({
          connectionId: thread.id,
          senderId: userId,
          body: parsed.data.body,
        } as any)
        .returning();

      // Notify the other side.
      const otherId = thread.userAId === userId ? thread.userBId : thread.userAId;
      try {
        await notify({
          userId: otherId,
          type: "message_received",
          title: "New message",
          body: parsed.data.body.slice(0, 80) + (parsed.data.body.length > 80 ? "…" : ""),
          link: `/connect?thread=${thread.id}`,
          icon: "MessageSquare",
        });
      } catch { /* best-effort */ }

      return reply.send({ message: inserted[0] });
    },
  );

  /* -------------------- CLOSE thread -------------------- */
  app.post<{ Params: { id: string } }>(
    "/connections/:id/close",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = getUserId(req);
      const thread = await loadThread(req.params.id);
      if (!thread) return reply.code(404).send({ error: "Not found" });
      if (thread.userAId !== userId && thread.userBId !== userId) {
        return reply.code(403).send({ error: "Not your thread" });
      }
      if (thread.status === "closed") return reply.send({ ok: true });
      await db
        .update(connections)
        .set({ status: "closed", closedAt: new Date() } as any)
        .where(eq(connections.id, thread.id));
      return reply.send({ ok: true });
    },
  );

  /* -------------------- OPEN from meeting accept -------------------- */
  /**
   * Called by investor.ts when a meeting is accepted.
   * Idempotent: reuses the existing thread if it exists.
   */
  app.post<{ Params: { id: string } }>(
    "/connections/from-meeting/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const me = getUserId(req);
      const meetingId = req.params.id;
      // Read meeting to find the other party.
      const { meetingRequests } = await import("../db/schema.js");
      const rows = await db
        .select()
        .from(meetingRequests)
        .where(eq(meetingRequests.id, meetingId))
        .limit(1);
      if (rows.length === 0) return reply.code(404).send({ error: "Meeting not found" });
      const m = rows[0];
      // Identify the *other* user.
      const otherId = m.investorId === me ? m.founderId : m.investorId;
      if (!otherId) return reply.code(400).send({ error: "Missing party" });
      const [userA, userB] = [me, otherId].sort();
      const existing = await loadThreadByPair(userA, userB);
      let thread = existing;
      if (!thread) {
        const ins = await db
          .insert(connections)
          .values({
            userAId: userA,
            userBId: userB,
            status: "active",
            meetingId,
            initiatedBy: me,
          } as any)
          .returning();
        thread = ins[0];
      } else if (thread.status !== "active") {
        await db
          .update(connections)
          .set({ status: "active" } as any)
          .where(eq(connections.id, thread.id));
        thread = { ...thread, status: "active" };
      }
      return reply.send({ connection: thread });
    },
  );
}