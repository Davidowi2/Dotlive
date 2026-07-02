/**
 * Social Feed routes — /api/feed/*
 *
 * POST   /api/feed               Create a post
 * GET    /api/feed               Get feed (tab: latest|popular|trending, page)
 * POST   /api/feed/:id/like      Toggle like
 * POST   /api/feed/:id/bookmark  Toggle bookmark
 * GET    /api/feed/:id/comments  List comments
 * POST   /api/feed/:id/comments  Add a comment
 * DELETE /api/feed/:id           Delete own post
 *
 * Post types: gig | announcement | venture_update | funding | general
 * Persisted to feed_posts / feed_post_likes / feed_post_bookmarks / feed_comments
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const createPostSchema = z.object({
  type: z.enum(["gig", "announcement", "venture_update", "funding", "general"]).default("general"),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
  tags: z.array(z.string().max(50)).max(10).default([]),
  budgetDot: z.number().optional(),
  gigType: z.string().optional(),
  fundingGoal: z.number().optional(),
  fundingRound: z.string().optional(),
});

const addCommentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function feedRoutes(app: FastifyInstance) {

  /* ── GET /api/feed ─────────────────────────────────────────── */
  app.get("/feed", async (req, reply) => {
    const q = (req.query ?? {}) as { tab?: string; page?: string; limit?: string };
    const tab = q.tab ?? "latest";
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10) || 20));
    const offset = Math.max(0, (parseInt(q.page ?? "1", 10) - 1) * limit);

    // Get caller id if authenticated (for isLiked / isBookmarked)
    let callerId: string | null = null;
    try {
      await app.authenticate(req as any, reply);
      callerId = (req as any).user?.sub ?? null;
    } catch {}

    // Build ORDER BY based on tab
    const orderBy =
      tab === "popular"  ? sql`likes_count DESC, created_at DESC`  :
      tab === "trending" ? sql`(likes_count * 2 + comments_count) DESC, created_at DESC` :
                          sql`created_at DESC`;

    const rows = await db.execute(sql`
      SELECT
        p.id, p.type, p.title, p.body, p.tags,
        p.likes_count, p.comments_count,
        p.budget_dot, p.gig_type, p.funding_goal, p.funding_round,
        p.created_at,
        u.id AS author_id, u.name AS author_name, u.dot_id AS author_dot_id,
        u.avatar_url AS author_avatar
        ${callerId ? sql`, EXISTS(
            SELECT 1 FROM feed_post_likes l
            WHERE l.post_id = p.id AND l.user_id = ${callerId}
          ) AS is_liked,
          EXISTS(
            SELECT 1 FROM feed_post_bookmarks b
            WHERE b.post_id = p.id AND b.user_id = ${callerId}
          ) AS is_bookmarked` : sql`, false AS is_liked, false AS is_bookmarked`}
      FROM feed_posts p
      JOIN users u ON u.id = p.author_id
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `) as any;

    const countRow = await db.execute(sql`SELECT COUNT(*)::int AS n FROM feed_posts`) as any;
    const total = Number((countRow?.rows ?? countRow)?.[0]?.n ?? 0);

    const posts = ((rows as any).rows ?? rows).map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      tags: r.tags ?? [],
      likesCount: Number(r.likes_count ?? 0),
      commentsCount: Number(r.comments_count ?? 0),
      isLiked: !!r.is_liked,
      isBookmarked: !!r.is_bookmarked,
      budgetDot: r.budget_dot ? Number(r.budget_dot) : null,
      gigType: r.gig_type,
      fundingGoal: r.funding_goal ? Number(r.funding_goal) : null,
      fundingRound: r.funding_round,
      createdAt: r.created_at,
      authorId: r.author_id,
      authorName: r.author_name,
      authorDotId: r.author_dot_id,
      authorAvatar: r.author_avatar,
    }));

    return reply.send({ posts, hasMore: offset + limit < total, total });
  });

  /* ── POST /api/feed ────────────────────────────────────────── */
  app.post("/feed", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    const userRow = await db.select({ name: users.name, dotId: users.dotId })
      .from(users).where(eq(users.id, sub)).limit(1);
    const u = userRow[0];

    const id = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO feed_posts (id, type, title, body, author_id, tags, budget_dot, gig_type, funding_goal, funding_round)
      VALUES (
        ${id}, ${parsed.data.type}, ${parsed.data.title ?? null}, ${parsed.data.body},
        ${sub}, ${parsed.data.tags as any},
        ${parsed.data.budgetDot ?? null}, ${parsed.data.gigType ?? null},
        ${parsed.data.fundingGoal ?? null}, ${parsed.data.fundingRound ?? null}
      )
    `);

    return reply.code(201).send({
      post: {
        id, type: parsed.data.type, title: parsed.data.title ?? null,
        body: parsed.data.body, tags: parsed.data.tags,
        likesCount: 0, commentsCount: 0,
        isLiked: false, isBookmarked: false,
        budgetDot: parsed.data.budgetDot ?? null,
        gigType: parsed.data.gigType ?? null,
        fundingGoal: parsed.data.fundingGoal ?? null,
        fundingRound: parsed.data.fundingRound ?? null,
        createdAt: new Date().toISOString(),
        authorId: sub, authorName: u?.name ?? null, authorDotId: u?.dotId ?? null,
      },
    });
  });

  /* ── POST /api/feed/:id/like ───────────────────────────────── */
  app.post<{ Params: { id: string } }>("/feed/:id/like", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params;

    // Check if already liked
    const existing = await db.execute(sql`
      SELECT 1 FROM feed_post_likes WHERE post_id = ${id} AND user_id = ${sub}
    `) as any;
    const alreadyLiked = ((existing?.rows ?? existing) as any[]).length > 0;

    if (alreadyLiked) {
      await db.execute(sql`DELETE FROM feed_post_likes WHERE post_id = ${id} AND user_id = ${sub}`);
      await db.execute(sql`UPDATE feed_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ${id}`);
    } else {
      await db.execute(sql`INSERT INTO feed_post_likes (post_id, user_id) VALUES (${id}, ${sub}) ON CONFLICT DO NOTHING`);
      await db.execute(sql`UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = ${id}`);
    }

    const row = await db.execute(sql`SELECT likes_count FROM feed_posts WHERE id = ${id}`) as any;
    const likesCount = Number(((row?.rows ?? row) as any[])[0]?.likes_count ?? 0);

    return reply.send({ liked: !alreadyLiked, likesCount });
  });

  /* ── POST /api/feed/:id/bookmark ──────────────────────────── */
  app.post<{ Params: { id: string } }>("/feed/:id/bookmark", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params;

    const existing = await db.execute(sql`
      SELECT 1 FROM feed_post_bookmarks WHERE post_id = ${id} AND user_id = ${sub}
    `) as any;
    const alreadyBookmarked = ((existing?.rows ?? existing) as any[]).length > 0;

    if (alreadyBookmarked) {
      await db.execute(sql`DELETE FROM feed_post_bookmarks WHERE post_id = ${id} AND user_id = ${sub}`);
    } else {
      await db.execute(sql`INSERT INTO feed_post_bookmarks (post_id, user_id) VALUES (${id}, ${sub}) ON CONFLICT DO NOTHING`);
    }

    return reply.send({ bookmarked: !alreadyBookmarked });
  });

  /* ── GET /api/feed/:id/comments ────────────────────────────── */
  app.get<{ Params: { id: string } }>("/feed/:id/comments", async (req, reply) => {
    const rows = await db.execute(sql`
      SELECT
        c.id, c.body, c.likes_count, c.created_at,
        u.name AS author_name, u.dot_id AS author_dot_id
      FROM feed_comments c
      JOIN users u ON u.id = c.author_id
      WHERE c.post_id = ${req.params.id}
      ORDER BY c.created_at ASC
      LIMIT 100
    `) as any;

    const comments = ((rows?.rows ?? rows) as any[]).map((r) => ({
      id: r.id,
      body: r.body,
      likesCount: Number(r.likes_count ?? 0),
      createdAt: r.created_at,
      authorName: r.author_name,
      authorDotId: r.author_dot_id,
    }));

    return reply.send({ comments });
  });

  /* ── POST /api/feed/:id/comments ───────────────────────────── */
  app.post<{ Params: { id: string } }>("/feed/:id/comments", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = addCommentSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    // Verify post exists
    const post = await db.execute(sql`SELECT id FROM feed_posts WHERE id = ${req.params.id}`) as any;
    if (((post?.rows ?? post) as any[]).length === 0) return reply.code(404).send({ error: "Post not found" });

    const userRow = await db.select({ name: users.name, dotId: users.dotId })
      .from(users).where(eq(users.id, sub)).limit(1);
    const u = userRow[0];

    const id = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO feed_comments (id, post_id, author_id, body)
      VALUES (${id}, ${req.params.id}, ${sub}, ${parsed.data.body})
    `);
    await db.execute(sql`
      UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = ${req.params.id}
    `);

    return reply.code(201).send({
      comment: {
        id, body: parsed.data.body, likesCount: 0,
        createdAt: new Date().toISOString(),
        authorName: u?.name ?? null, authorDotId: u?.dotId ?? null,
      },
    });
  });

  /* ── DELETE /api/feed/:id ──────────────────────────────────── */
  app.delete<{ Params: { id: string } }>("/feed/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const post = await db.execute(sql`SELECT author_id FROM feed_posts WHERE id = ${req.params.id}`) as any;
    const row = ((post?.rows ?? post) as any[])[0];
    if (!row) return reply.code(404).send({ error: "Post not found" });
    if (row.author_id !== sub) return reply.code(403).send({ error: "Not your post" });

    await db.execute(sql`DELETE FROM feed_posts WHERE id = ${req.params.id}`);
    return reply.send({ ok: true });
  });

  /* ── GET /api/feed/trending-tags ───────────────────────────── */
  app.get("/feed/trending-tags", async (_req, reply) => {
    try {
      const rows = await db.execute(sql`
        SELECT tag, COUNT(*)::int AS count
        FROM feed_posts, unnest(tags) AS tag
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      `) as any;
      const tags = ((rows?.rows ?? rows) as any[]).map((r: any) => ({
        tag: r.tag,
        count: Number(r.count),
      }));
      return reply.send({ tags });
    } catch {
      return reply.send({ tags: [] });
    }
  });
}
