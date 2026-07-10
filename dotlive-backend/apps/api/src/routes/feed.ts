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
import { users, userRoles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { publicCache, cached, k, invalidatePrefix } from "../lib/cache.js";

const FEED_TTL_MS = 30_000; // 30 seconds
const FEED_POST_TTL_MS = 60_000; // 60 seconds

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

    // Cache key includes caller id (auth changes isLiked / isBookmarked).
    let callerId: string | null = null;
    try {
      await app.authenticate(req as any, reply);
      callerId = (req as any).user?.sub ?? null;
    } catch {}

    const cacheKey = k("feed", tab, limit, offset, callerId ?? "anon");

    const payload = await cached(publicCache, cacheKey, FEED_TTL_MS, async () => {
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

      return { posts, hasMore: offset + limit < total, total };
    });

    // HTTP cache hint — matches in-memory TTL.
    reply.header("Cache-Control", `public, max-age=${Math.floor(FEED_TTL_MS / 1000)}`);
    return reply.send(payload);
  });

  /* ── POST /api/feed ────────────────────────────────────────── */
  app.post("/feed", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    // Check if posting announcement - requires admin role
    if (parsed.data.type === "announcement") {
      // Get user roles to check for admin
      const roleRows = await db.select({ role: userRoles.role })
        .from(userRoles).where(eq(userRoles.userId, sub));
      const roles = roleRows.map(r => r.role);
      if (!roles.includes("admin") && !roles.includes("super_admin")) {
        return reply.code(403).send({ error: "Only admins can post announcements" });
      }
    }

    const userRow = await db.select({ name: users.name, dotId: users.dotId })
      .from(users).where(eq(users.id, sub)).limit(1);
    const u = userRow[0];

    let newPostId: string | null = null;
    try {
      console.log("[feed] Creating post with:", {
        type: parsed.data.type,
        title: parsed.data.title,
        body: parsed.data.body.substring(0, 50),
        authorId: sub,
        authorName: u?.name,
        tags: parsed.data.tags,
        budgetDot: parsed.data.budgetDot,
      });
      
      // Insert post using raw SQL with explicit column list
      // tags column is text[] - need to format as JSON array and cast
      const tagsJson = JSON.stringify(parsed.data.tags || []);
      const insertResult = await db.execute(sql`
        INSERT INTO feed_posts (
          type, title, body, author_id, author_name, author_dot_id, author_role, 
          tags, budget_dot, gig_type, funding_goal, funding_round, likes_count, 
          comments_count, created_at, updated_at
        )
        VALUES (
          ${parsed.data.type}, ${parsed.data.title ?? null}, ${parsed.data.body},
          ${sub}, ${u?.name ?? "Unknown"}, ${u?.dotId ?? null}, 'builder', 
          CAST(${tagsJson} AS text[]),
          ${parsed.data.budgetDot ? parseInt(String(parsed.data.budgetDot), 10) : null}, 
          ${parsed.data.gigType ?? null},
          ${parsed.data.fundingGoal ? parseInt(String(parsed.data.fundingGoal), 10) : null}, 
          ${parsed.data.fundingRound ?? null},
          0, 0, NOW(), NOW()
        )
        RETURNING id
      `) as any;
      
      // Extract the returned ID
      newPostId = ((insertResult?.rows ?? insertResult)?.[0]?.id) as string;
      console.log("[feed] Post created successfully:", newPostId);
    } catch (err) {
      console.error("[feed] POST /feed error:", err);
      console.error("[feed] Error stack:", err instanceof Error ? err.stack : "no stack");
      console.error("[feed] Error type:", typeof err);
      console.error("[feed] Full error object:", JSON.stringify(err, null, 2));
      const errorMsg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      return reply.code(500).send({ error: "Failed to create post", details: errorMsg, fullError: err });
    }

    // Invalidate all feed caches — new post changes pagination & order.
    invalidatePrefix("feed");

    return reply.code(201).send({
      post: {
        id: newPostId || crypto.randomUUID(), type: parsed.data.type, title: parsed.data.title ?? null,
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

  /* ── GET /api/feed/posts/:id ───────────────────────────────── */
  // Single post lookup (cache-aside, 60s TTL).
  app.get<{ Params: { id: string } }>("/feed/posts/:id", async (req, reply) => {
    const { id } = req.params;

    // Resolve caller id for isLiked/isBookmarked.
    let callerId: string | null = null;
    try {
      await app.authenticate(req as any, reply);
      callerId = (req as any).user?.sub ?? null;
    } catch {}

    const cacheKey = k("feed:post", id, callerId ?? "anon");

    const payload = await cached(publicCache, cacheKey, FEED_POST_TTL_MS, async () => {
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
        WHERE p.id = ${id}
        LIMIT 1
      `) as any;
      const r = ((rows as any).rows ?? rows)?.[0];
      if (!r) return null;
      return {
        post: {
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
        },
      };
    });

    if (!payload) return reply.code(404).send({ error: "Post not found" });
    reply.header("Cache-Control", `public, max-age=${Math.floor(FEED_POST_TTL_MS / 1000)}`);
    return reply.send(payload);
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
      await db.execute(sql`INSERT INTO feed_post_likes (post_id, user_id, created_at) VALUES (${id}, ${sub}, NOW()) ON CONFLICT DO NOTHING`);
      await db.execute(sql`UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = ${id}`);
    }

    // Invalidate feed caches — like count changed.
    invalidatePrefix("feed");

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
      await db.execute(sql`INSERT INTO feed_post_bookmarks (post_id, user_id, created_at) VALUES (${id}, ${sub}, NOW()) ON CONFLICT DO NOTHING`);
    }

    // Invalidate feed caches — bookmark state changed for this user.
    invalidatePrefix("feed");

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

    let newCommentId: string | null = null;
    try {
      const result = await db.execute(sql`
        INSERT INTO feed_comments (
          post_id, author_id, author_name, author_dot_id, author_role, body, likes_count, created_at
        )
        VALUES (
          ${req.params.id}, ${sub}, ${u?.name ?? "Unknown"}, ${u?.dotId ?? null}, 'builder', ${parsed.data.body}, 0, NOW()
        )
        RETURNING id
      `) as any;
      newCommentId = ((result?.rows ?? result)?.[0]?.id) as string;
    } catch (err) {
      console.error("[feed] POST /feed/:id/comments error:", err);
      return reply.code(500).send({ error: "Failed to create comment", details: err instanceof Error ? err.message : String(err) });
    }
    await db.execute(sql`
      UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = ${req.params.id}
    `);

    // Invalidate feed caches — comment count changed.
    invalidatePrefix("feed");

    return reply.code(201).send({
      comment: {
        id: newCommentId || crypto.randomUUID(), body: parsed.data.body, likesCount: 0,
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

    // Check if admin - can delete any post
    const roleRows = await db.select({ role: userRoles.role })
      .from(userRoles).where(eq(userRoles.userId, sub));
    const roles = roleRows.map(r => r.role);
    const isAdmin = roles.includes("admin") || roles.includes("super_admin");

    if (row.author_id !== sub && !isAdmin) {
      return reply.code(403).send({ error: "Not your post" });
    }

    await db.execute(sql`DELETE FROM feed_posts WHERE id = ${req.params.id}`);

    // Invalidate feed caches — a post was removed.
    invalidatePrefix("feed");
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
