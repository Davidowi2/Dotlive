/**
 * Community routes: create, list, join via referral, list members.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { communities, communityMembers, users } from "../db/schema.js";
import { userHasRole } from "../lib/auth.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

const joinSchema = z.object({
  referralCode: z.string().min(1).max(64),
});

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
    const referralCode = crypto.randomBytes(4).toString("hex");
    await db.insert(communities).values({
      id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      leaderId: sub,
      referralCode,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      .where(eq(communities.referralCode, parsed.data.referralCode))
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
}
// @ts-nocheck