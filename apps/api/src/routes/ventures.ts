// @ts-nocheck
/**
 * Venture routes: CRUD, filtered list, owner-scoped updates.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, ilike, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { ventures } from "../db/schema.js";

const STAGES = ["Assess", "Validate", "Build", "Fund", "Scale"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().max(100).optional(),
  stage: z.enum(STAGES).default("Assess"),
  country: z.string().max(80).optional(),
  description: z.string().max(5000).optional(),
  website: z.string().url().optional(),
  fundingGoal: z.number().nonnegative().default(0),
  logoUrl: z.string().url().optional(),
});

const patchSchema = createSchema.partial();

export async function ventureRoutes(app: FastifyInstance) {
  /** POST /api/ventures — create */
  app.post("/ventures", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const v = parsed.data;
    const inserted = await db
      .insert(ventures)
      .values({
        userId: sub,
        name: v.name,
        industry: v.industry,
        stage: v.stage,
        country: v.country,
        description: v.description,
        website: v.website,
        fundingGoal: String(v.fundingGoal),
        logoUrl: v.logoUrl,
      })
      .returning();
    return reply.send({ venture: serialize(inserted[0]) });
  });

  /** GET /api/ventures — list with optional filters */
  app.get("/ventures", async (req, reply) => {
    const q = z
      .object({
        stage: z.enum(STAGES).optional(),
        industry: z.string().optional(),
        search: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: "Invalid query" });
    const { stage, industry, search, limit } = q.data;

    const qb = db.select().from(ventures).$dynamic();
    const conds: any[] = [];
    if (stage) conds.push(eq(ventures.stage, stage));
    if (industry) conds.push(eq(ventures.industry, industry));
    if (search) conds.push(ilike(ventures.name, `%${search}%`));
    if (conds.length > 0) qb.where(and(...conds) as any);
    const rows = await qb.orderBy(desc(ventures.createdAt)).limit(limit);
    return reply.send({ ventures: rows.map(serialize) });
  });

  /** GET /api/ventures/:id */
  app.get<{ Params: { id: string } }>("/ventures/:id", async (req, reply) => {
    const rows = await db.select().from(ventures).where(eq(ventures.id, req.params.id)).limit(1);
    if (rows.length === 0) return reply.code(404).send({ error: "Not found" });
    return reply.send({ venture: serialize(rows[0]) });
  });

  /** PATCH /api/ventures/:id — owner only */
  app.patch<{ Params: { id: string } }>(
    "/ventures/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const existing = await db.select().from(ventures).where(eq(ventures.id, req.params.id)).limit(1);
      if (existing.length === 0) return reply.code(404).send({ error: "Not found" });
      if (existing[0].userId !== sub) return reply.code(403).send({ error: "Not your venture" });

      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      const v = parsed.data;
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (v.name !== undefined) updates.name = v.name;
      if (v.industry !== undefined) updates.industry = v.industry;
      if (v.stage !== undefined) updates.stage = v.stage;
      if (v.country !== undefined) updates.country = v.country;
      if (v.description !== undefined) updates.description = v.description;
      if (v.website !== undefined) updates.website = v.website;
      if (v.fundingGoal !== undefined) updates.fundingGoal = String(v.fundingGoal);
      if (v.logoUrl !== undefined) updates.logoUrl = v.logoUrl;

      const updated = await db
        .update(ventures)
        .set(updates as any)
        .where(eq(ventures.id, req.params.id))
        .returning();
      return reply.send({ venture: serialize(updated[0]) });
    }
  );
}

function serialize(v: any) {
  return {
    id: v.id,
    userId: v.userId,
    name: v.name,
    industry: v.industry,
    stage: v.stage,
    country: v.country,
    description: v.description,
    website: v.website,
    fundingGoal: Number(v.fundingGoal ?? 0),
    logoUrl: v.logoUrl,
    vantagePoint: v.vantagePoint,
    fundability: v.fundability,
    investmentReadiness: v.investmentReadiness,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}
// @ts-nocheck