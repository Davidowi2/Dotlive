/**
 * Social Feed routes — /api/feed/*
 *
 * POST   /api/feed               Create a post
 * GET    /api/feed               Get feed (tab: latest|popular|trending, page)
 * POST   /api/feed/:id/like      Toggle like
 * POST   /api/feed/:id/bookmark  Toggle bookmark
 * GET    /api/feed/:id/comments  List comments
 * POST   /api/feed/:id/comments  Add a comment
 *
 * Post types: gig | announcement | venture_update | funding | general
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";

/* ── In-memory store (replace with DB table when ready) ────────────
 * Using an in-memory Map so this works immediately without a migration.
 * Swap feedPosts → a real "feed_posts" table for production.
 */

interface FeedPost {
  id: string;
  type: string;
  title: string | null;
  body: string;
  authorId: string;
  authorName: string | null;
  authorDotId: string | null;
  authorRole: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  likedBy: Set<string>;
  bookmarkedBy: Set<string>;
  budgetDot: number | null;
  gigType: string | null;
  fundingGoal: number | null;
  fundingRound: string | null;
  createdAt: Date;
}

interface FeedComment {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  authorName: string | null;
  authorDotId: string | null;
  likesCount: number;
  createdAt: Date;
}

// Simple in-memory stores
const feedPosts = new Map<string, FeedPost>();
const feedComments = new Map<string, FeedComment[]>();

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
  /* ── GET /api/feed ── */
  app.get("/feed", async (req, reply) => {
    const q = (req.query ?? {}) as { tab?: string; page?: string; limit?: string };
    const tab = q.tab ?? "latest";
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "20", 10) || 20));
    const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);

    // Get caller's user ID if authenticated
    let callerId: string | null = null;
    try {
      await app.authenticate(req as any, reply);
      callerId = (req as any).user?.sub ?? null;
    } catch {}

    let posts = Array.from(feedPosts.values());

    // Sort by tab
    if (tab === "popular") {
      posts.sort((a, b) => b.likesCount - a.likesCount || b.createdAt.getTime() - a.createdAt.getTime());
    } else if (tab === "trending") {
      // Trending: score = likes * 2 + comments, weighted by recency
      const now = Date.now();
      posts.sort((a, b) => {
        const ageA = (now - a.createdAt.getTime()) / 3600000; // hours
        const ageB = (now - b.createdAt.getTime()) / 3600000;
        const scoreA = (a.likesCount * 2 + a.commentsCount) / Math.pow(ageA + 2, 1.5);
        const scoreB = (b.likesCount * 2 + b.commentsCount) / Math.pow(ageB + 2, 1.5);
        return scoreB - scoreA;
      });
    } else {
      // latest (default)
      posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const start = (page - 1) * limit;
    const slice = posts.slice(start, start + limit);

    const serialized = slice.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      authorId: p.authorId,
      authorName: p.authorName,
      authorDotId: p.authorDotId,
      authorRole: p.authorRole,
      tags: p.tags,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      isLiked: callerId ? p.likedBy.has(callerId) : false,
      isBookmarked: callerId ? p.bookmarkedBy.has(callerId) : false,
      budgetDot: p.budgetDot,
      gigType: p.gigType,
      fundingGoal: p.fundingGoal,
      fundingRound: p.fundingRound,
      createdAt: p.createdAt.toISOString(),
    }));

    return reply.send({ posts: serialized, hasMore: posts.length > start + limit, total: posts.length });
  });

  /* ── POST /api/feed ── */
  app.post("/feed", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    // Enrich with user info
    const userRow = await db.select({ name: users.name, dotId: users.dotId })
      .from(users).where(eq(users.id, sub)).limit(1);
    const u = userRow[0];

    const id = crypto.randomUUID();
    const post: FeedPost = {
      id,
      type: parsed.data.type,
      title: parsed.data.title ?? null,
      body: parsed.data.body,
      authorId: sub,
      authorName: u?.name ?? null,
      authorDotId: u?.dotId ?? null,
      authorRole: null,
      tags: parsed.data.tags,
      likesCount: 0,
      commentsCount: 0,
      likedBy: new Set(),
      bookmarkedBy: new Set(),
      budgetDot: parsed.data.budgetDot ?? null,
      gigType: parsed.data.gigType ?? null,
      fundingGoal: parsed.data.fundingGoal ?? null,
      fundingRound: parsed.data.fundingRound ?? null,
      createdAt: new Date(),
    };

    feedPosts.set(id, post);
    feedComments.set(id, []);

    return reply.code(201).send({
      post: { ...post, likedBy: undefined, bookmarkedBy: undefined, isLiked: false, isBookmarked: false, createdAt: post.createdAt.toISOString() },
    });
  });

  /* ── POST /api/feed/:id/like ── */
  app.post<{ Params: { id: string } }>("/feed/:id/like", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const post = feedPosts.get(req.params.id);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    if (post.likedBy.has(sub)) {
      post.likedBy.delete(sub);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.add(sub);
      post.likesCount += 1;
    }

    return reply.send({ liked: post.likedBy.has(sub), likesCount: post.likesCount });
  });

  /* ── POST /api/feed/:id/bookmark ── */
  app.post<{ Params: { id: string } }>("/feed/:id/bookmark", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const post = feedPosts.get(req.params.id);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    if (post.bookmarkedBy.has(sub)) {
      post.bookmarkedBy.delete(sub);
    } else {
      post.bookmarkedBy.add(sub);
    }

    return reply.send({ bookmarked: post.bookmarkedBy.has(sub) });
  });

  /* ── GET /api/feed/:id/comments ── */
  app.get<{ Params: { id: string } }>("/feed/:id/comments", async (req, reply) => {
    const comments = feedComments.get(req.params.id) ?? [];
    return reply.send({
      comments: comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  });

  /* ── POST /api/feed/:id/comments ── */
  app.post<{ Params: { id: string } }>("/feed/:id/comments", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const post = feedPosts.get(req.params.id);
    if (!post) return reply.code(404).send({ error: "Post not found" });

    const parsed = addCommentSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const userRow = await db.select({ name: users.name, dotId: users.dotId })
      .from(users).where(eq(users.id, sub)).limit(1);
    const u = userRow[0];

    const comment: FeedComment = {
      id: crypto.randomUUID(),
      postId: req.params.id,
      body: parsed.data.body,
      authorId: sub,
      authorName: u?.name ?? null,
      authorDotId: u?.dotId ?? null,
      likesCount: 0,
      createdAt: new Date(),
    };

    const existing = feedComments.get(req.params.id) ?? [];
    existing.push(comment);
    feedComments.set(req.params.id, existing);
    post.commentsCount += 1;

    return reply.code(201).send({ comment: { ...comment, createdAt: comment.createdAt.toISOString() } });
  });

  /* ── DELETE /api/feed/:id ── */
  app.delete<{ Params: { id: string } }>("/feed/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const post = feedPosts.get(req.params.id);
    if (!post) return reply.code(404).send({ error: "Post not found" });
    if (post.authorId !== sub) return reply.code(403).send({ error: "Not your post" });

    feedPosts.delete(req.params.id);
    feedComments.delete(req.params.id);
    return reply.send({ ok: true });
  });
}
