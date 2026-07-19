/**
 * Discover People routes — /api/people/discover
 *
 * GET /api/people/discover
 *
 * Query params:
 * - role: string — filter by role
 * - skill: string — filter by builder skill
 * - industry: string — filter by founder industry
 * - country: string — filter by country
 * - minVantage: number — minimum Vantage score
 * - sort: "newest" | "vantage_desc" | "vouches_desc"
 * - limit: number (default 20)
 * - cursor: string — pagination cursor
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  users,
  userRoles,
  builderProfiles,
  founderProfiles,
  investorProfiles,
  userVouches,
} from "../db/schema.js";
import { eq, and, desc, asc, sql, ilike, or, gte, inArray } from "drizzle-orm";

const discoverSchema = z.object({
  role: z.enum(["builder", "founder", "investor", "capital_partner", "community_leader", "vendor", "admin"]).optional(),
  skill: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  minVantage: z.coerce.number().int().min(0).max(1000).optional(),
  sort: z.enum(["newest", "vantage_desc", "vouches_desc"]).default("newest"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function peopleRoutes(app: FastifyInstance) {
  app.get("/people/discover", async (req, reply) => {
    const parsed = discoverSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid query", details: parsed.error.flatten() });
    }

    const { role, skill, industry, country, minVantage, sort, limit, cursor } = parsed.data;

    // Build base user query with LEFT JOINs to profiles
    const conditions: any[] = [];

    // Only return active users (exclude deleted/banned if such a flag exists)
    // For now just filter out test users
    conditions.push(sql`${users.email} NOT LIKE '%@local.test'`);
    conditions.push(sql`${users.email} NOT LIKE '%@test.com'`);

    if (role) {
      conditions.push(eq(userRoles.role, role));
    }

    if (country) {
      conditions.push(
        or(
          ilike(builderProfiles.location, `%${country}%`),
          ilike(founderProfiles.country, `%${country}%`),
        ) as any
      );
    }

    if (industry) {
      conditions.push(ilike(founderProfiles.industry, `%${industry}%`));
    }

    if (skill) {
      conditions.push(sql`${skill} = ANY(${builderProfiles.skills})`);
    }

    if (minVantage != null) {
      conditions.push(gte(founderProfiles.vantagePoint, minVantage));
    }

    // Pagination cursor
    if (cursor) {
      conditions.push(sql`${users.createdAt} < ${new Date(cursor)}`);
    }

    // Build query - get users with their roles and profile data
    // Use DISTINCT to avoid duplicates from multiple roles
    const query = db
      .select({
        id: users.id,
        name: users.name,
        dotId: users.dotId,
        avatarUrl: users.avatarUrl,
        email: users.email,
        createdAt: users.createdAt,
        roles: sql<string[]>`ARRAY_AGG(DISTINCT ${userRoles.role})`,
        builderSkills: builderProfiles.skills,
        builderHeadline: builderProfiles.headline,
        builderHourlyDot: builderProfiles.hourlyDot,
        builderLocation: builderProfiles.location,
        founderVentureName: founderProfiles.ventureName,
        founderStage: founderProfiles.stage,
        founderIndustry: founderProfiles.industry,
        founderVantagePoint: founderProfiles.vantagePoint,
        founderFundability: founderProfiles.fundability,
        investorCapitalType: investorProfiles.capitalType,
        investorCheckSize: investorProfiles.checkSize,
        investorFocusAreas: investorProfiles.focusAreas,
        vouchesCount: sql<number>`COALESCE(COUNT(DISTINCT ${userVouches.id}), 0)`,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(builderProfiles, eq(users.id, builderProfiles.id))
      .leftJoin(founderProfiles, eq(users.id, founderProfiles.userId))
      .leftJoin(investorProfiles, eq(users.id, investorProfiles.userId))
      .leftJoin(userVouches, eq(users.id, userVouches.voucheeId))
      .where(and(...conditions))
      .groupBy(
        users.id,
        builderProfiles.id,
        founderProfiles.userId,
        investorProfiles.userId
      );

    // Sorting
    if (sort === "vantage_desc") {
      query.orderBy(desc(founderProfiles.vantagePoint), desc(users.createdAt));
    } else if (sort === "vouches_desc") {
      query.orderBy(desc(sql`COALESCE(COUNT(DISTINCT ${userVouches.id}), 0)`), desc(users.createdAt));
    } else {
      query.orderBy(desc(users.createdAt));
    }

    const rows = await query.limit(limit + 1);

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? slice[slice.length - 1]?.createdAt?.toISOString() ?? null : null;

    // Transform to expected shape
    const people = slice.map((r) => {
      const allRoles = (r.roles as string[]) ?? [];
      const primaryRole = allRoles[0] ?? "builder";

      // Calculate Vantage score (prefer founder, fallback to 0)
      const vantageScore = r.founderVantagePoint ?? 0;

      return {
        id: r.id,
        name: r.name,
        dotId: r.dotId,
        avatarUrl: r.avatarUrl,
        headline: r.builderHeadline ?? null,
        location: r.builderLocation ?? null,
        roles: allRoles,
        primaryRole,
        builderSkills: r.builderSkills ?? [],
        ventureName: r.founderVentureName ?? null,
        ventureStage: r.founderStage ?? null,
        capitalType: r.investorCapitalType ?? null,
        vantageScore,
        vouchesCount: Number(r.vouchesCount ?? 0),
      };
    });

    return reply.send({
      people,
      hasMore,
      nextCursor,
    });
  });
}
