import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { feedPosts, users, ventures } from "../db/schema.js";
import { sql } from "drizzle-orm";

export async function searchRoutes(app: FastifyInstance) {
  app.get("/search", async (req, reply) => {
    const q = String((req.query as any)?.q ?? "").trim();
    if (!q) return reply.send({ posts: [], people: [], ventures: [] });

    const limit = Math.min(parseInt(String((req.query as any)?.limit ?? "5"), 10) || 5, 20);
    const like = `%${q.replace(/\s+/g, " ").trim()}%`;

    const [postRows, peopleRows, ventureRows] = await Promise.all([
      db.execute(sql`
        SELECT id, type, title, body, image_url, tags, likes_count, comments_count,
               budget_dot, gig_type, funding_goal, funding_round, created_at,
               author_id, author_name, author_dot_id, author_avatar
        FROM feed_posts
        WHERE title ILIKE ${like} OR body ILIKE ${like}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `),
      db.execute(sql`
        SELECT id, name, dot_id, avatar_url, email
        FROM users
        WHERE name ILIKE ${like}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `),
      db.execute(sql`
        SELECT id, name, industry, stage, country, vantage_point, fundability
        FROM ventures
        WHERE name ILIKE ${like} OR industry ILIKE ${like}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `),
    ]);

    const posts = ((postRows as any)?.rows ?? postRows).map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      imageUrl: r.image_url ?? null,
      tags: r.tags ?? [],
      likesCount: Number(r.likes_count ?? 0),
      commentsCount: Number(r.comments_count ?? 0),
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

    const people = ((peopleRows as any)?.rows ?? peopleRows).map((r: any) => ({
      id: r.id,
      name: r.name,
      dotId: r.dot_id,
      avatarUrl: r.avatar_url,
      email: r.email,
    }));

    const ventures = ((ventureRows as any)?.rows ?? ventureRows).map((r: any) => ({
      id: r.id,
      name: r.name,
      industry: r.industry,
      stage: r.stage,
      country: r.country,
      vantagePoint: Number(r.vantage_point ?? 0),
      fundability: Number(r.fundability ?? 0),
    }));

    return reply.send({ posts, people, ventures });
  });
}
