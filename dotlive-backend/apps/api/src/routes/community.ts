/**
 * Community routes: create, list, join via referral, list members.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
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

  /** GET /api/communities — list all communities */
  app.get("/communities", async (_req, reply) => {
    const rows = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        leaderId: communities.leaderId,
        referralCode: communities.referralCode,
        memberCount: communityMembers.id,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .leftJoin(communityMembers, eq(communityMembers.communityId, communities.id))
      .orderBy(desc(communities.createdAt));
    return reply.send({ communities: rows });
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
      role: "member",
      status: "active",
      joinedAt: new Date(),
    } as any).onConflictDoNothing();

    return reply.send({ ok: true, community: comm[0] });
  });

  /** GET /api/communities/:id/members — list members */
  app.get<{ Params: { id: string } }>("/communities/:id/members", async (req, reply) => {
    const rows = await db
      .select({
        id: communityMembers.id,
        role: communityMembers.role,
        status: communityMembers.status,
        userId: users.id,
        name: users.name,
        dotId: users.dotId,
        avatarUrl: users.avatarUrl,
      })
      .from(communityMembers)
      .innerJoin(users, eq(users.id, communityMembers.founderId))
      .where(eq(communityMembers.communityId, req.params.id))
      .orderBy(desc(communityMembers.joinedAt));
    return reply.send({ members: rows });
  });

  /** GET /api/community/membership — current user's community membership */
  app.get("/community/membership", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select({
        id: communityMembers.id,
        communityId: communityMembers.communityId,
        founderId: communityMembers.founderId,
        role: communityMembers.role,
        status: communityMembers.status,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communityMembers)
      .where(and(eq(communityMembers.founderId, sub), eq(communityMembers.status, "active")))
      .limit(1);
    const membership = rows[0];
    if (!membership) return reply.send({ membership: null });

    const comm = await db
      .select()
      .from(communities)
      .where(eq(communities.id, membership.communityId))
      .limit(1);
    return reply.send({
      membership: { ...membership, community: comm[0] ?? null },
    });
  });
}
// @ts-nocheck