/**
 * Venture routes: CRUD, filtered list, owner-scoped updates.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  eq,
  and,
  desc,
  ilike,
  sql,
  or,
  asc,
} from "drizzle-orm";

import { db } from "../db/client.js";
import {
  ventures,
  ventureDetails,
  ventureTeamMembers,
  ventureMilestones,
  ventureAdvisors,
} from "../db/schema.js";
import { userHasRole } from "../lib/auth.js";

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
      } as any)
      .returning();
    return reply.send({ venture: serialize(inserted[0]) });
  });

  /** GET /api/ventures — list with optional filters (Sprint B discover) */
  app.get("/ventures", async (req, reply) => {
    const q = z
      .object({
        stage: z.enum(STAGES).optional(),
        industry: z.string().optional(),
        country: z.string().optional(),
        search: z.string().optional(),
        minVantage: z.coerce.number().int().min(0).max(1000).optional(),
        maxVantage: z.coerce.number().int().min(0).max(1000).optional(),
        minFundability: z.coerce.number().int().min(0).max(100).optional(),
        sort: z.enum(["newest", "vantage_desc", "fundability_desc", "alpha"]).default("newest"),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
      .safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: "Invalid query" });
    const { stage, industry, country, search, minVantage, maxVantage, minFundability, sort, limit, cursor } = q.data;

    const conds: any[] = [];
    if (stage) conds.push(eq(ventures.stage, stage));
    if (industry) conds.push(ilike(ventures.industry, `%${industry}%`));
    if (country) conds.push(ilike(ventures.country, `%${country}%`));
    if (search) conds.push(ilike(ventures.name, `%${search}%`));
    if (minVantage != null) conds.push(sql`${ventures.vantagePoint} >= ${minVantage}`);
    if (maxVantage != null) conds.push(sql`${ventures.vantagePoint} <= ${maxVantage}`);
    if (minFundability != null) conds.push(sql`${ventures.fundability} >= ${minFundability}`);
    if (cursor) conds.push(sql`${ventures.createdAt} < ${new Date(cursor)}`);

    let qb = db.select().from(ventures).$dynamic();
    if (conds.length > 0) qb = qb.where(and(...conds) as any);

    // Sorting
    if (sort === "vantage_desc") qb = qb.orderBy(desc(ventures.vantagePoint));
    else if (sort === "fundability_desc") qb = qb.orderBy(desc(ventures.fundability));
    else if (sort === "alpha") qb = qb.orderBy(ventures.name);
    else qb = qb.orderBy(desc(ventures.createdAt));

    const rows = await qb.limit(limit + 1);
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    return reply.send({
      ventures: slice.map(serialize),
      nextCursor: hasMore ? slice[slice.length - 1].createdAt.toISOString() : null,
    });
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
  /** GET /api/ventures/:id/valuation — DOT Venture Valuation (₦ + confidence + fundability). */
  app.get<{ Params: { id: string } }>("/ventures/:id/valuation", async (req, reply) => {
    const v = await db.select().from(ventures).where(eq(ventures.id, req.params.id)).limit(1);
    if (v.length === 0) return reply.code(404).send({ error: "Not found" });
    const { computeVentureValuation } = await import("../lib/os-engine.js");
    const out = computeVentureValuation({
      stage: v[0].stage ?? "Idea",
      vantage: Number(v[0].vantagePoint ?? 50),
      fundability: Number(v[0].fundability ?? 50),
    });
    return reply.send({
      ventureId: v[0].id,
      ...out,
      stage: v[0].stage,
      vantage: Number(v[0].vantagePoint ?? 50),
      fundability: Number(v[0].fundability ?? 50),
    });
  });

  /* ---------------- Venture enrichment (founder profile 11 fields) -------- */

  const enrichmentDetailsSchema = z.object({
    oneLiner: z.string().max(300).optional(),
    problem: z.string().max(2000).optional(),
    solution: z.string().max(2000).optional(),
    tractionMr: z.number().nonnegative().default(0),
    tractionPayingUsers: z.number().int().nonnegative().default(0),
    tractionGrowthPct: z.number().int().min(-100).max(10000).default(0),
    tractionRetentionPct: z.number().int().min(0).max(100).default(0),
    useOfFunds: z.string().max(1000).optional(),
    capTableTotalRaised: z.number().nonnegative().default(0),
    capTableLastRound: z.string().max(80).optional(),
    capTableStructure: z.string().max(80).optional(),
    pitchDeckUrl: z.string().url().optional(),
    foundingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    stageRationale: z.string().max(500).optional(),
  });

  const teamMemberSchema = z.object({
    name: z.string().min(1).max(120),
    role: z.string().min(1).max(120),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    isFounder: z.boolean().default(false),
    orderIndex: z.number().int().default(0),
  });

  const milestoneSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    achievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    isUpcoming: z.boolean().default(false),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    orderIndex: z.number().int().default(0),
  });

  const advisorSchema = z.object({
    name: z.string().min(1).max(120),
    credentials: z.string().max(300).optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
  });

  async function requireOwner(ventureId: string, userId: string) {
    const v = await db
      .select({ id: ventures.id, userId: ventures.userId })
      .from(ventures)
      .where(eq(ventures.id, ventureId))
      .limit(1);
    if (v.length === 0) return { ok: false as const, status: 404, error: "Not found" };
    if (v[0].userId !== userId) return { ok: false as const, status: 403, error: "Forbidden" };
    return { ok: true as const };
  }

  /** GET /api/ventures/:id/enrichment */
  app.get<{ Params: { id: string } }>(
    "/ventures/:id/enrichment",
    async (req, reply) => {
      const ventureId = req.params.id;
      const [details] = await db
        .select()
        .from(ventureDetails)
        .where(eq(ventureDetails.ventureId, ventureId))
        .limit(1);
      const team = await db
        .select()
        .from(ventureTeamMembers)
        .where(eq(ventureTeamMembers.ventureId, ventureId))
        .orderBy(asc(ventureTeamMembers.orderIndex));
      const milestones = await db
        .select()
        .from(ventureMilestones)
        .where(eq(ventureMilestones.ventureId, ventureId))
        .orderBy(asc(ventureMilestones.orderIndex));
      const advisors = await db
        .select()
        .from(ventureAdvisors)
        .where(eq(ventureAdvisors.ventureId, ventureId));
      return reply.send({
        details: details ?? null,
        team,
        milestones,
        advisors,
      });
    },
  );

  /** PUT /api/ventures/:id/details — owner only */
  app.put<{ Params: { id: string }; Body: z.infer<typeof enrichmentDetailsSchema> }>(
    "/ventures/:id/details",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      const parsed = enrichmentDetailsSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      const data = parsed.data;
      const values: any = {
        ventureId: req.params.id,
        oneLiner: data.oneLiner ?? null,
        problem: data.problem ?? null,
        solution: data.solution ?? null,
        tractionMr: String(data.tractionMr),
        tractionPayingUsers: data.tractionPayingUsers,
        tractionGrowthPct: data.tractionGrowthPct,
        tractionRetentionPct: data.tractionRetentionPct,
        useOfFunds: data.useOfFunds ?? null,
        capTableTotalRaised: String(data.capTableTotalRaised),
        capTableLastRound: data.capTableLastRound ?? null,
        capTableStructure: data.capTableStructure ?? null,
        pitchDeckUrl: data.pitchDeckUrl ?? null,
        foundingDate: data.foundingDate ?? null,
        stageRationale: data.stageRationale ?? null,
        updatedAt: new Date(),
      };
      await db.insert(ventureDetails).values(values).onConflictDoUpdate({
        target: ventureDetails.ventureId,
        set: values,
      });
      return reply.send({ ok: true });
    },
  );

  /** POST /api/ventures/:id/team */
  app.post<{ Params: { id: string }; Body: z.infer<typeof teamMemberSchema> }>(
    "/ventures/:id/team",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      const parsed = teamMemberSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      const inserted = await db
        .insert(ventureTeamMembers)
        .values({ ventureId: req.params.id, ...parsed.data } as any)
        .returning();
      return reply.send({ teamMember: inserted[0] });
    },
  );

  /** POST /api/ventures/:id/milestones */
  app.post<{ Params: { id: string }; Body: z.infer<typeof milestoneSchema> }>(
    "/ventures/:id/milestones",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      const parsed = milestoneSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      const inserted = await db
        .insert(ventureMilestones)
        .values({ ventureId: req.params.id, ...parsed.data } as any)
        .returning();
      return reply.send({ milestone: inserted[0] });
    },
  );

  /** POST /api/ventures/:id/advisors */
  app.post<{ Params: { id: string }; Body: z.infer<typeof advisorSchema> }>(
    "/ventures/:id/advisors",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      const parsed = advisorSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      const inserted = await db
        .insert(ventureAdvisors)
        .values({ ventureId: req.params.id, ...parsed.data } as any)
        .returning();
      return reply.send({ advisor: inserted[0] });
    },
  );

  /* DELETE — team member */
  app.delete<{ Params: { id: string; memberId: string } }>(
    "/ventures/:id/team/:memberId",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      await db
        .delete(ventureTeamMembers)
        .where(
          and(
            eq(ventureTeamMembers.ventureId, req.params.id),
            eq(ventureTeamMembers.id, req.params.memberId),
          ),
        );
      return reply.send({ ok: true });
    },
  );

  /* DELETE — milestone */
  app.delete<{ Params: { id: string; milestoneId: string } }>(
    "/ventures/:id/milestones/:milestoneId",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      await db
        .delete(ventureMilestones)
        .where(
          and(
            eq(ventureMilestones.ventureId, req.params.id),
            eq(ventureMilestones.id, req.params.milestoneId),
          ),
        );
      return reply.send({ ok: true });
    },
  );

  /* DELETE — advisor */
  app.delete<{ Params: { id: string; advisorId: string } }>(
    "/ventures/:id/advisors/:advisorId",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const owner = await requireOwner(req.params.id, sub);
      if (!owner.ok) return reply.code(owner.status).send({ error: owner.error });
      await db
        .delete(ventureAdvisors)
        .where(
          and(
            eq(ventureAdvisors.ventureId, req.params.id),
            eq(ventureAdvisors.id, req.params.advisorId),
          ),
        );
      return reply.send({ ok: true });
    },
  );

  /* ---------------- Escrow + Milestone Payout ------------------- */
  const { fundMilestone, releaseMilestone, getVentureEscrowSummary } = await import("./venture-escrow.js");

  /** POST /api/ventures/:id/escrow/fund — milestoneId, amount */
  app.post<{ Params: { id: string } }>(
    "/ventures/:id/escrow/fund",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const existing = await db.select({ userId: ventures.userId }).from(ventures).where(eq(ventures.id, req.params.id)).limit(1);
      if (existing.length === 0) return reply.code(404).send({ error: "Not found" });
      if (existing[0].userId !== sub) return reply.code(403).send({ error: "Forbidden" });
      const parsed = z.object({ milestoneId: z.string().uuid(), amount: z.number().positive() }).safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      try {
        const out = await fundMilestone({ ventureId: req.params.id, milestoneId: parsed.data.milestoneId, amount: parsed.data.amount, userId: sub });
        return reply.send(out);
      } catch (e: any) {
        return reply.code(400).send({ error: e.message || "Failed" });
      }
    },
  );

  /** POST /api/ventures/:id/escrow/release — milestoneId */
  app.post<{ Params: { id: string } }>(
    "/ventures/:id/escrow/release",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = (req as any).user as { sub: string };
      const existing = await db.select({ userId: ventures.userId }).from(ventures).where(eq(ventures.id, req.params.id)).limit(1);
      if (existing.length === 0) return reply.code(404).send({ error: "Not found" });
      if (existing[0].userId !== sub) return reply.code(403).send({ error: "Forbidden" });
      const parsed = z.object({ milestoneId: z.string().uuid() }).safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
      try {
        const out = await releaseMilestone({ ventureId: req.params.id, milestoneId: parsed.data.milestoneId, userId: sub });
        return reply.send(out);
      } catch (e: any) {
        return reply.code(400).send({ error: e.message || "Failed" });
      }
    },
  );

  /** GET /api/ventures/:id/escrow */
  app.get<{ Params: { id: string } }>("/ventures/:id/escrow", async (req, reply) => {
    try {
      const out = await getVentureEscrowSummary(req.params.id);
      return reply.send(out);
    } catch (e: any) {
      return reply.code(404).send({ error: e.message || "Not found" });
    }
  });
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
