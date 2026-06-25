/**
 * User routes: profile, role management, lookup, founder + builder profiles.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { users, userRoles, roleRequirements, wallets } from "../db/schema.js";
import { loadUserWithRoles, userHasRole } from "../lib/auth.js";
import { debitWallet } from "../lib/dot.js";
import type { AppRole } from "../sharedTypes.js";

const profilePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const roleRequestSchema = z.object({
  role: z.enum(["founder", "investor", "community_leader", "vendor", "capital_partner"]),
});

export async function userRoutes(app: FastifyInstance) {
  /** GET /api/users/me */
  app.get("/users/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const user = await loadUserWithRoles(sub);
    if (!user) return reply.code(404).send({ error: "User not found" });
    return reply.send({ user });
  });

  /** PATCH /api/users/me */
  app.patch("/users/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = profilePatchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
    await db.update(users).set(updates as any).where(eq(users.id, sub));
    const user = await loadUserWithRoles(sub);
    return reply.send({ user });
  });

  /** GET /api/users/roles/requirements — public list of upgrade options */
  app.get("/users/roles/requirements", async (_req, reply) => {
    const rows = await db.select().from(roleRequirements).where(eq(roleRequirements.isActive, true));
    return reply.send({
      requirements: rows.map((r) => ({
        role: r.role,
        dotCost: r.dotCost,
        requiredFields: r.requiredFields as string[],
        description: r.description,
      })),
    });
  });

  /** POST /api/users/roles — request a role upgrade */
  app.post("/users/roles", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = roleRequestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const role = parsed.data.role as AppRole;
    if (await userHasRole(sub, role)) {
      return reply.code(409).send({ error: `You already have the ${role} role` });
    }

    // Load role requirements + cost.
    const reqs = await db.select().from(roleRequirements).where(eq(roleRequirements.role, role)).limit(1);
    const r = reqs[0];
    if (!r || !r.isActive) {
      return reply.code(404).send({ error: `Role ${role} is not available` });
    }

    // Check wallet balance.
    const wallet = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
    const balance = Number(wallet[0]?.balance ?? 0);
    if (balance < r.dotCost) {
      return reply.code(402).send({
        error: "Insufficient DOT",
        need: r.dotCost,
        have: balance,
      });
    }

    // Debit + grant role.
    await debitWallet({
      userId: sub,
      amount: r.dotCost,
      type: "Role Upgrade",
      description: `Upgraded to ${role}`,
    });
    await db.insert(userRoles).values({ userId: sub, role } as any).onConflictDoNothing();

    const user = await loadUserWithRoles(sub);
    return reply.send({ user });
  });

  /** GET /api/users/:dotId — public profile lookup */
  app.get<{ Params: { dotId: string } }>("/users/:dotId", async (req, reply) => {
    const { dotId } = req.params;
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        dotId: users.dotId,
      })
      .from(users)
      .where(eq(users.dotId, dotId))
      .limit(1);
    const u = rows[0];
    if (!u) return reply.code(404).send({ error: "Not found" });

    const roles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, u.id));
    return reply.send({
      user: { ...u, roles: roles.map((r) => r.role) },
    });
  });

  /* ── Founder profile (founder_profiles table) ─────────────── */
  /** GET /api/users/me/founder-profile */
  app.get("/users/me/founder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db.execute(sql`
      SELECT * FROM founder_profiles WHERE user_id = ${sub} LIMIT 1
    `);
    const profile = (rows as any).rows?.[0] ?? null;
    return reply.send({ profile });
  });

  /** POST /api/users/me/founder-profile */
  app.post("/users/me/founder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = (req.body ?? {}) as Record<string, unknown>;

    await db.execute(sql`
      INSERT INTO founder_profiles (id, user_id, bio, skills, current_stage, venture_name, venture_description, website_url, linkedin_url, twitter_url, country, city, created_at, updated_at)
      VALUES (${sub}, ${sub}, ${(body.bio as string) ?? null}, ${(body.skills as string[]) ?? []}, ${(body.currentStage as string) ?? null}, ${(body.ventureName as string) ?? null}, ${(body.ventureDescription as string) ?? null}, ${(body.websiteUrl as string) ?? null}, ${(body.linkedinUrl as string) ?? null}, ${(body.twitterUrl as string) ?? null}, ${(body.country as string) ?? null}, ${(body.city as string) ?? null}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        current_stage = EXCLUDED.current_stage,
        venture_name = EXCLUDED.venture_name,
        venture_description = EXCLUDED.venture_description,
        website_url = EXCLUDED.website_url,
        linkedin_url = EXCLUDED.linkedin_url,
        twitter_url = EXCLUDED.twitter_url,
        country = EXCLUDED.country,
        city = EXCLUDED.city,
        updated_at = NOW()
    `);
    return reply.send({ ok: true });
  });

  /* ── Builder profile (builder_profiles table) ──────────────── */
  /** GET /api/users/me/builder-profile */
  app.get("/users/me/builder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db.execute(sql`
      SELECT * FROM builder_profiles WHERE user_id = ${sub} LIMIT 1
    `);
    const profile = (rows as any).rows?.[0] ?? null;
    return reply.send({ profile });
  });

  /** POST /api/users/me/builder-profile */
  app.post("/users/me/builder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = (req.body ?? {}) as Record<string, unknown>;

    await db.execute(sql`
      INSERT INTO builder_profiles (id, user_id, bio, skills, hourly_rate_dot, portfolio_url, is_available, created_at, updated_at)
      VALUES (${sub}, ${sub}, ${(body.bio as string) ?? null}, ${(body.skills as string[]) ?? []}, ${Number(body.hourlyRateDot ?? 0)}, ${(body.portfolioUrl as string) ?? null}, ${body.isAvailable !== false}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        hourly_rate_dot = EXCLUDED.hourly_rate_dot,
        portfolio_url = EXCLUDED.portfolio_url,
        is_available = EXCLUDED.is_available,
        updated_at = NOW()
    `);
    return reply.send({ ok: true });
  });
}
// @ts-nocheck