/**
 * Community routes: create, list, join via referral, list members.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { communities, communityMembers, users } from "../db/schema.js";
import { userHasRole } from "../lib/auth.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  region: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
});

const joinSchema = z.object({ referralCode: z.string().min(4).max(40) });

export async function communityRoutes(app: FastifyInstance) {
  /** POST /api/communities */
  app.post("/communities", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    if (!(await userHasRole(sub, "community_leader"))) {
      return reply.code(403).send({ error: "Only community leaders can create communities" });
    }
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const referralCode = crypto.randomBytes(4).toString("hex");
    const inserted = await db
      .insert(communities)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        leaderId: sub,
        region: parsed.data.region,
        category: parsed.data.category,
        referralCode,
      } as any)
      .returning();
    return reply.send({ community: inserted[0] });
  });

  /** GET /api/communities */
  app.get("/communities", async (req, reply) => {
    const rows = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        leaderId: communities.leaderId,
        region: communities.region,
        category: communities.category,
        referralCode: communities.referralCode,
        createdAt: communities.createdAt,
        memberCount: sql<number>`(SELECT COUNT(*)::int FROM ${communityMembers} WHERE ${communityMembers.communityId} = ${communities.id})`,
      })
      .from(communities)
      .orderBy(desc(communities.createdAt))
      .limit(100);
    return reply.send({ communities: rows });
  });

  /** GET /api/communities/:id */
  app.get<{ Params: { id: string } }>("/communities/:id", async (req, reply) => {
    const rows = await db.select().from(communities).where(eq(communities.id, req.params.id)).limit(1);
    if (rows.length === 0) return reply.code(404).send({ error: "Not found" });
    return reply.send({ community: rows[0] });
  });

  /** POST /api/communities/join */
  app.post("/communities/join", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const c = await db
      .select()
      .from(communities)
      .where(eq(communities.referralCode, parsed.data.referralCode))
      .limit(1);
    if (c.length === 0) return reply.code(404).send({ error: "Invalid referral code" });

    try {
      const inserted = await db
        .insert(communityMembers)
        .values({ communityId: c[0].id, founderId: sub } as any)
        .returning();
      return reply.send({ membership: inserted[0], community: c[0] });
    } catch {
      return reply.code(409).send({ error: "Already a member" });
    }
  });

  /** GET /api/communities/:id/members */
  app.get<{ Params: { id: string } }>("/communities/:id/members", async (req, reply) => {
    const rows = await db
      .select({
        membershipId: communityMembers.id,
        joinedAt: communityMembers.joinedAt,
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
}
// @ts-nocheck