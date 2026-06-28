/**
 * Notifications routes — in-app feed + email triggers.
 *
 *   GET    /api/notifications                  paginated feed (newest first)
 *   GET    /api/notifications/unread-count     just the count for the bell badge
 *   POST   /api/notifications/:id/read         mark single read
 *   POST   /api/notifications/read-all         mark all read
 *   POST   /api/notifications                 create one (admin/system)
 *
 *  Helper lives in src/lib/notify.ts — call notify() anywhere
 *  (transfers, community posts, etc) and it persists + optionally emails.
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { and, eq, isNull, sql, desc, lt } from "drizzle-orm";
import { db } from "../db/client.js";
import { notifications } from "../db/schema.js";
import { sendNotificationEmail } from "../lib/notify.js";

export async function notificationsRoutes(app: FastifyInstance) {
  /* ----- Helper: extract userId from JWT ----- */
  const getUserId = (req: FastifyRequest): string => {
    const u = (req.user as { sub?: string } | undefined)?.sub ?? "";
    return u;
  };

  /* ============================== LIST ============================== */
  /**
   * GET /api/notifications?limit=20&cursor=ISO_DATE&unreadOnly=false
   * Returns { items, unreadCount, nextCursor }
   */
  app.get(
    "/notifications",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const q = (req.query ?? {}) as {
        limit?: string;
        cursor?: string;
        unreadOnly?: string;
      };
      const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10) || 20));
      const unreadOnly = q.unreadOnly === "true";

      // Build where clause
      const whereParts = [eq(notifications.userId, userId)];
      if (unreadOnly) whereParts.push(isNull(notifications.readAt));
      if (q.cursor) whereParts.push(lt(notifications.createdAt, new Date(q.cursor)));

      const rows = await db
        .select()
        .from(notifications)
        .where(and(...whereParts))
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        link: r.link,
        icon: r.icon,
        read: r.readAt !== null,
        createdAt: r.createdAt,
      }));
      const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null;

      // Unread count (independent of pagination)
      const [unread] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

      return reply.send({
        items,
        unreadCount: Number(unread?.n ?? 0),
        nextCursor,
      });
    },
  );

  /* ============================== UNREAD COUNT ============================== */
  app.get(
    "/notifications/unread-count",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const [row] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

      return reply.send({ unreadCount: Number(row?.n ?? 0) });
    },
  );

  /* ============================== MARK READ ============================== */
  app.post<{ Params: { id: string } }>(
    "/notifications/:id/read",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const { id } = req.params;
      await db
        .update(notifications)
        .set({ readAt: new Date() } as any)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      return reply.send({ ok: true });
    },
  );

  /* ============================== READ ALL ============================== */
  app.post(
    "/notifications/read-all",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      await db
        .update(notifications)
        .set({ readAt: new Date() } as any)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

      return reply.send({ ok: true });
    },
  );

  /* ============================== CREATE (internal — for testing) ============================== */
  app.post<{
    Body: { type?: string; title?: string; body?: string; link?: string; icon?: string };
  }>(
    "/notifications",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });
      const { type, title, body, link, icon } = req.body ?? {};
      if (!type || !title || !body) {
        return reply.code(400).send({ error: "type, title, body are required" });
      }
      const [row] = await db
        .insert(notifications)
        .values({
          userId,
          type,
          title,
          body,
          link: link ?? null,
          icon: icon ?? null,
        } as any)
        .returning();
      return reply.send({ notification: row });
    },
  );
}
