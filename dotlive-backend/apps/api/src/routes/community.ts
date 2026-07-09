/**
 * Community routes: create, list, join via referral, list members.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { communities, communityMembers, communityChannels, communityPosts, users } from "../db/schema.js";
import { userHasRole } from "../lib/auth.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  region: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  isPrivate: z.boolean().default(false),
});

const joinSchema = z.object({
  referralCode: z.string().min(1).max(64).optional(),
  code: z.string().min(1).max(64).optional(),
}).refine((d) => d.referralCode || d.code, { message: "referralCode or code required" });

export async function communityRoutes(app: FastifyInstance) {
  /** POST /api/communities — create a new community */
  app.post("/communities", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    if (!(await userHasRole(sub, "community_leader"))) {
      return reply.code(403).send({ error: "Only community leaders can create communities" });
    }

    const id = crypto.randomUUID();
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    await db.insert(communities).values({
      id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      region: parsed.data.region ?? null,
      category: parsed.data.category ?? null,
      leaderId: sub,
      referralCode,
    } as any);

    return reply.send({ community: { id, referralCode } });
  });

  /** GET /api/communities — list all communities (public) */
    app.get("/communities", async (_req, reply) => {
      const rows = await db
        .select({
          id: communities.id,
          name: communities.name,
          description: communities.description,
          leaderId: communities.leaderId,
          referralCode: communities.referralCode,
          category: communities.category,
          tier: communities.tier,
          region: communities.region,
          memberCount: communities.memberCount,
          createdAt: communities.createdAt,
        })
        .from(communities)
        .orderBy(desc(communities.createdAt));

      // Enrich with leader info
      const leaderIds: string[] = Array.from(new Set(rows.map((r: any) => r.leaderId).filter(Boolean)));
            let leaderMap: Record<string, { name: string | null; dotId: string }> = {};
            if (leaderIds.length) {
              const leaders = await db
                .select({ id: users.id, name: users.name, dotId: users.dotId })
                .from(users)
                .where(inArray(users.id, leaderIds));
              leaderMap = Object.fromEntries(leaders.map((l) => [l.id, { name: l.name, dotId: l.dotId }]));
            }

      return reply.send({
        communities: rows.map((r) => ({
          ...r,
          leader: leaderMap[r.leaderId] ?? null,
        })),
      });
    });

    /** GET /api/communities/:id — single community detail (public) */
    app.get("/communities/:id", async (req, reply) => {
      const { id } = req.params as { id: string };
      const [c] = await db
        .select()
        .from(communities)
        .where(eq(communities.id, id))
        .limit(1);
      if (!c) return reply.code(404).send({ error: "not_found" });

      const [leader] = await db
        .select({ id: users.id, name: users.name, dotId: users.dotId, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, c.leaderId))
        .limit(1);

      // Member count by status
      const memberCountRows = await db.execute(sql`
        SELECT status, COUNT(*)::int as n
        FROM community_members
        WHERE community_id = ${id}
        GROUP BY status
      `);
      const memberBreakdown: Record<string, number> = {};
      for (const r of (memberCountRows as any) ?? []) {
        memberBreakdown[r.status] = Number(r.n);
      }

      return reply.send({
        community: { ...c, leader, memberBreakdown },
      });
    });

  /** POST /api/communities/join — join a community using referral code */
  app.post("/communities/join", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const comm = await db
      .select()
      .from(communities)
      .where(eq(communities.referralCode, parsed.data.referralCode ?? parsed.data.code ?? ""))
      .limit(1);
    if (!comm[0]) return reply.code(404).send({ error: "Community not found" });

    await db.insert(communityMembers).values({
      id: crypto.randomUUID(),
      communityId: comm[0].id,
      founderId: sub,
      status: "active",
      joinedAt: new Date(),
    } as any).onConflictDoNothing();

    return reply.send({ ok: true, community: comm[0] });
  });

  /** GET /api/communities/:id/members — list members */
  app.get<{ Params: { id: string } }>("/communities/:id/members", async (req, reply) => {
    const rows = await db.execute(sql`
      SELECT
        m.id, m.status, m.joined_at AS "joinedAt",
        u.id AS "userId", u.name, u.dot_id AS "dotId", u.avatar_url AS "avatarUrl"
      FROM community_members m
      INNER JOIN users u ON u.id = m.founder_id
      WHERE m.community_id = ${req.params.id}
      ORDER BY m.joined_at DESC
    `);
    return reply.send({ members: (rows as any).rows ?? [] });
  });

  /** GET /api/community/my — leader's own community (if any)
   *  Returns the community the current user LEADS, used by /community
   *  to show "your community" after creation. */
  app.get("/community/my", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        leaderId: communities.leaderId,
        referralCode: communities.referralCode,
        category: communities.category,
        tier: communities.tier,
        region: communities.region,
        memberCount: communities.memberCount,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .where(eq(communities.leaderId, sub))
      .orderBy(desc(communities.createdAt))
      .limit(1);
    const r = rows[0];
    if (!r) return reply.send({ community: null });
    return reply.send({
      community: {
        id: r.id,
        name: r.name,
        description: r.description,
        leaderId: r.leaderId,
        referralCode: r.referralCode,
        category: r.category,
        tier: r.tier ?? "starter",
        region: r.region,
        memberCount: r.memberCount ?? 0,
        createdAt: r.createdAt,
      },
    });
  });

  /** GET /api/community/membership — current user's community membership */
  app.get("/community/membership", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db.execute(sql`
      SELECT
        m.id, m.community_id AS "communityId", m.founder_id AS "founderId",
        m.status, m.joined_at AS "joinedAt",
        c.id AS "commId", c.name AS "commName", c.description AS "commDescription",
        c.referral_code AS "commReferralCode", c.leader_id AS "commLeaderId"
      FROM community_members m
      INNER JOIN communities c ON c.id = m.community_id
      WHERE m.founder_id = ${sub} AND m.status = 'active'
      LIMIT 1
    `);
    const row = ((rows as any).rows ?? [])[0];
    if (!row) return reply.send({ membership: null });
    return reply.send({
      membership: {
        id: row.id,
        communityId: row.communityId,
        founderId: row.founderId,
        status: row.status,
        joinedAt: row.joinedAt,
        community: {
          id: row.commId,
          name: row.commName,
          description: row.commDescription,
          referralCode: row.commReferralCode,
          leaderId: row.commLeaderId,
        },
      },
    });
  });

  /** GET /api/communities/by-referral/:code — public lookup so /join/$code works. */
  app.get<{ Params: { code: string } }>(
    "/communities/by-referral/:code",
    async (req, reply) => {
      const rows = await db
        .select({
          id: communities.id,
          name: communities.name,
          description: communities.description,
          leaderId: communities.leaderId,
          referralCode: communities.referralCode,
        })
        .from(communities)
        .where(eq(communities.referralCode, req.params.code))
        .limit(1);
      if (rows.length === 0) return reply.code(404).send({ community: null });
      return reply.send({ community: rows[0] });
    },
  );

  /** GET /api/communities/:id/dashboard — leader-only metrics. */
  app.get<{ Params: { id: string } }>(
    "/communities/:id/dashboard",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const comm = await db.select().from(communities).where(eq(communities.id, req.params.id)).limit(1);
      if (comm.length === 0) return reply.code(404).send({ error: "Not found" });
      if (comm[0].leaderId !== sub) return reply.code(403).send({ error: "Not the leader" });

      const members = await db
        .select()
        .from(communityMembers)
        .where(eq(communityMembers.communityId, req.params.id));

      // Cross-reference founder profiles for member average valuation
      const { founderProfiles, builderProfiles, challenges } = await import("../db/schema.js");
      const { computeVentureValuation } = await import("../lib/os-engine.js");

      const memberIds = members.map((m: any) => m.founderId || m.userId).filter(Boolean);

      let valuations: number[] = [];
      if (memberIds.length > 0) {
        const profiles = await db
          .select()
          .from(founderProfiles)
          .where(sql`${founderProfiles.userId} = ANY(${memberIds})`);
        valuations = profiles.map((p: any) =>
          computeVentureValuation({
            stage: p.stage || "Idea",
            vantage: Number(p.vantagePoint || 50),
            fundability: Number(p.fundability || 50),
          }).valuation_ngn,
        );
      }

      const openChallenges = await db
        .select()
        .from(challenges)
        .where(eq(challenges.status, "open"));

      return reply.send({
        community: comm[0],
        metrics: {
          members: members.length,
          active: members.filter((m: any) => m.status === "active").length,
          avgValuationNgn: valuations.length
            ? Math.round(valuations.reduce((s, v) => s + v, 0) / valuations.length)
            : 0,
          totalValuationNgn: valuations.reduce((s, v) => s + v, 0),
        },
        openChallenges: openChallenges.length,
        leader: { id: sub },
      });
    },
  );

  /** GET /api/communities/:id/hub — public hub data (anyone can read). */
  app.get<{ Params: { id: string } }>(
    "/communities/:id/hub",
    async (req, reply) => {
      const comm = await db.select().from(communities).where(eq(communities.id, req.params.id)).limit(1);
      if (comm.length === 0) return reply.code(404).send({ error: "Not found" });

      const members = await db
        .select({ userId: communityMembers.founderId })
        .from(communityMembers)
        .where(eq(communityMembers.communityId, req.params.id))
        .limit(100);

      return reply.send({
        community: {
          id: comm[0].id,
          name: comm[0].name,
          description: comm[0].description,
          referralCode: comm[0].referralCode,
          createdAt: comm[0].createdAt,
        },
        memberCount: members.length,
      });
    },
  );

  /* ============================== CHANNELS (Discord model) ============================== */

  /** GET /api/communities/:id/channels — list channels with post counts */
  app.get<{ Params: { id: string } }>("/communities/:id/channels", async (req, reply) => {
    const rows = await db.execute(sql`
      SELECT
        c.id, c.community_id AS "communityId", c.name, c.description,
        c.is_admin_only AS "isAdminOnly", c.position, c.created_at AS "createdAt",
        (SELECT COUNT(*)::int FROM community_posts p WHERE p.channel_id = c.id) AS "postCount",
        (SELECT COUNT(*)::int FROM community_posts p WHERE p.channel_id = c.id AND p.created_at > NOW() - INTERVAL '7 days') AS "recentCount"
      FROM community_channels c
      WHERE c.community_id = ${req.params.id}
      ORDER BY c.position ASC, c.created_at ASC
    `);
    return reply.send({ channels: (rows as any).rows ?? [] });
  });

  /** POST /api/communities/:id/channels — admin only */
  app.post<{ Params: { id: string }; Body: { name?: string; description?: string; isAdminOnly?: boolean } }>(
    "/communities/:id/channels",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { name, description, isAdminOnly } = req.body ?? {};
      if (!name || typeof name !== "string" || name.length < 1) {
        return reply.code(400).send({ error: "name required" });
      }
      // Check admin: must be community leader OR staff role
      const isLeader = await db
        .select({ id: communities.id })
        .from(communities)
        .where(and(eq(communities.id, req.params.id), eq(communities.leaderId, sub)))
        .limit(1);
      if (!isLeader[0] && !(await userHasRole(sub, "admin"))) {
        return reply.code(403).send({ error: "Only the community leader or an admin can create channels" });
      }
      const [row] = await db
        .insert(communityChannels)
        .values({
          communityId: req.params.id,
          name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 32),
          description: description ?? null,
          isAdminOnly: !!isAdminOnly,
          position: 99,
        } as any)
        .returning();
      return reply.send({ channel: row });
    },
  );

  /* ============================== POSTS ============================== */

  /** GET /api/communities/:id/posts?channelId=xxx&limit=50 */
  app.get<{ Params: { id: string }; Querystring: { channelId?: string; limit?: string } }>(
    "/communities/:id/posts",
    async (req, reply) => {
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "50", 10) || 50));
      const channelId = req.query.channelId;
      const whereParts = [eq(communityPosts.communityId, req.params.id), sql`parent_id IS NULL`];
      if (channelId) whereParts.push(eq(communityPosts.channelId, channelId));

      const rows = await db.execute(sql`
        SELECT
          p.id, p.community_id AS "communityId", p.channel_id AS "channelId",
          p.author_id AS "authorId", p.body, p.reactions, p.reply_count AS "replyCount",
          p.pinned, p.created_at AS "createdAt",
          u.name AS "authorName", u.dot_id AS "authorDotId", u.avatar_url AS "authorAvatarUrl"
        FROM community_posts p
        LEFT JOIN users u ON u.id = p.author_id
        WHERE p.community_id = ${req.params.id}
          AND (${channelId ? sql`p.channel_id = ${channelId}` : sql`TRUE`})
          AND p.parent_id IS NULL
        ORDER BY p.pinned DESC, p.created_at DESC
        LIMIT ${limit}
      `);
      return reply.send({ posts: (rows as any).rows ?? [] });
    },
  );

  /** POST /api/communities/:id/posts — create a post in a channel */
  app.post<{ Params: { id: string }; Body: { channelId?: string; body?: string; parentId?: string } }>(
    "/communities/:id/posts",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { channelId, body, parentId } = req.body ?? {};
      if (!channelId || !body || typeof body !== "string" || body.trim().length === 0) {
        return reply.code(400).send({ error: "channelId and body required" });
      }
      if (body.length > 4000) {
        return reply.code(400).send({ error: "body too long (max 4000 chars)" });
      }
      // Verify channel belongs to this community
      const ch = await db
        .select()
        .from(communityChannels)
        .where(and(eq(communityChannels.id, channelId), eq(communityChannels.communityId, req.params.id)))
        .limit(1);
      if (!ch[0]) return reply.code(404).send({ error: "Channel not found in this community" });

      // If it's a reply, verify parent post exists
      if (parentId) {
        const parent = await db
          .select({ id: communityPosts.id, authorId: communityPosts.authorId })
          .from(communityPosts)
          .where(eq(communityPosts.id, parentId))
          .limit(1);
        if (!parent[0]) return reply.code(404).send({ error: "Parent post not found" });
      }

      const [row] = await db
        .insert(communityPosts)
        .values({
          communityId: req.params.id,
          channelId,
          authorId: sub,
          parentId: parentId ?? null,
          body: body.trim(),
        } as any)
        .returning();

      // Increment reply_count on parent
      if (parentId) {
        await db.execute(sql`UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = ${parentId}`);
      }

      // Fire notifications (best-effort)
      try {
        const { notify } = await import("../lib/notify.js");
        if (parentId) {
          // Reply: notify parent author (unless it's the same user)
          const parent = await db
            .select({ authorId: communityPosts.authorId })
            .from(communityPosts)
            .where(eq(communityPosts.id, parentId))
            .limit(1);
          if (parent[0] && parent[0].authorId !== sub) {
            notify({
              userId: parent[0].authorId,
              type: "community_post",
              title: "Someone replied to your post",
              body: body.trim().slice(0, 100),
              link: `/community`,
              icon: "MessageSquare",
            }).catch(() => {});
          }
        } else {
          // New post: notify all community members
          const members = await db
            .select({ userId: communityMembers.founderId })
            .from(communityMembers)
            .where(eq(communityMembers.communityId, req.params.id));
          for (const m of members) {
            if (m.userId === sub) continue; // don't notify yourself
            notify({
              userId: m.userId,
              type: "community_post",
              title: `New post in #${ch[0].name}`,
              body: body.trim().slice(0, 100),
              link: `/community`,
              icon: "MessageSquare",
            }).catch(() => {});
          }
        }
      } catch {}

      return reply.send({ post: row });
    },
  );

  /** POST /api/communities/:id/posts/:postId/react — toggle emoji reaction */
  app.post<{ Params: { id: string; postId: string }; Body: { emoji?: string } }>(
    "/communities/:id/posts/:postId/react",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { emoji } = req.body ?? {};
      if (!emoji || typeof emoji !== "string") {
        return reply.code(400).send({ error: "emoji required" });
      }

      const post = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, req.params.postId))
        .limit(1);
      if (!post[0]) return reply.code(404).send({ error: "Post not found" });

      const reactions = (post[0].reactions as Record<string, string[]>) ?? {};
      const users = reactions[emoji] ?? [];
      const idx = users.indexOf(sub);
      if (idx >= 0) {
        users.splice(idx, 1);
        if (users.length === 0) delete reactions[emoji];
        else reactions[emoji] = users;
      } else {
        reactions[emoji] = [...users, sub];
      }

      await db
        .update(communityPosts)
        .set({ reactions: reactions as any, updatedAt: new Date() } as any)
        .where(eq(communityPosts.id, req.params.postId));

      return reply.send({ reactions });
    },
  );
}
// @ts-nocheck