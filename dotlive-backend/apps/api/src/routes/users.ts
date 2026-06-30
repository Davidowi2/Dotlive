/**
 * User routes: profile, role management, lookup, founder + builder profiles.
 */
// @ts-nocheck

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";

import { db } from "../db/client.js";
import { users, userRoles, roleRequirements, wallets, founderProfiles, builderProfiles, ventures } from "../db/schema.js";
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

        // Mark user as onboarded the first time they pick a non-default role.
        await db.execute(sql`
          UPDATE users
          SET onboarded_at = NOW()
          WHERE id = ${sub} AND onboarded_at IS NULL
        `);

        const user = await loadUserWithRoles(sub);
        return reply.send({ user });
      });

      /** POST /api/users/me/complete-onboarding — marks the user as onboarded
       *  without changing roles. Called after the user picks "Builder" (the default)
       *  so they skip role-upgrade flow but still mark the onboarding as done.
       *
       *  Body: { acceptPrivacy: true, acceptTerms: true, primaryRole?: string }
       *  Both accept flags must be true.
       */
      app.post("/users/me/complete-onboarding", { preHandler: app.authenticate }, async (req, reply) => {
        const { sub } = req.user as { sub: string };
        const parsed = z.object({
          acceptPrivacy: z.literal(true, { errorMap: () => ({ message: "You must accept the Privacy Policy to continue." }) }),
          acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service to continue." }) }),
          primaryRole: z.enum(["builder", "founder", "investor", "community_leader"]).optional(),
        }).safeParse(req.body);
        if (!parsed.success) return reply.code(400).send({ error: "Consent required", details: parsed.error.flatten() });

        const updates: string[] = ["onboarded_at = NOW()"];
        if (parsed.data.primaryRole) {
          updates.push(`onboarding_intent = '${parsed.data.primaryRole}'`);
        }
        // Always stamp consent (idempotent)
        updates.push("privacy_accepted_at = COALESCE(privacy_accepted_at, NOW())");
        updates.push("terms_accepted_at = COALESCE(terms_accepted_at, NOW())");

        await db.execute(sql`
          UPDATE users
          SET ${sql.raw(updates.join(", "))}
          WHERE id = ${sub}
        `);
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
        INSERT INTO founder_profiles (
          user_id, venture_name, industry, stage, country,
          bio, website, funding_goal, logo_url,
          vantage_point, fundability, investment_readiness,
          headcount, annual_revenue_dot, founded_year, total_raised_dot,
          share_price_kobo, shares_available,
          created_at, updated_at
        )
        VALUES (
          ${sub},
          ${(body.ventureName as string) ?? null},
          ${(body.industry as string) ?? null},
          ${(body.stage as string) ?? "Assess"},
          ${(body.country as string) ?? null},
          ${(body.bio as string) ?? null},
          ${(body.website as string) ?? null},
          ${(body.fundingGoal as string) ?? "0"},
          ${(body.logoUrl as string) ?? null},
          ${Number(body.vantagePoint ?? 0)},
          ${Number(body.fundability ?? 0)},
          ${Number(body.investmentReadiness ?? 0)},
          ${Number(body.headcount ?? 0)},
          ${(body.annualRevenueDot as string) ?? "0"},
          ${body.foundedYear == null ? null : Number(body.foundedYear)},
          ${(body.totalRaisedDot as string) ?? "0"},
          ${Number(body.sharePriceKobo ?? 0)},
          ${Number(body.sharesAvailable ?? 0)},
          NOW(), NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          venture_name = EXCLUDED.venture_name,
          industry = EXCLUDED.industry,
          stage = EXCLUDED.stage,
          country = EXCLUDED.country,
          bio = EXCLUDED.bio,
          website = EXCLUDED.website,
          funding_goal = EXCLUDED.funding_goal,
          logo_url = EXCLUDED.logo_url,
          vantage_point = EXCLUDED.vantage_point,
          fundability = EXCLUDED.fundability,
          investment_readiness = EXCLUDED.investment_readiness,
          headcount = EXCLUDED.headcount,
          annual_revenue_dot = EXCLUDED.annual_revenue_dot,
          founded_year = EXCLUDED.founded_year,
          total_raised_dot = EXCLUDED.total_raised_dot,
          share_price_kobo = EXCLUDED.share_price_kobo,
          shares_available = EXCLUDED.shares_available,
          updated_at = NOW()
      `);
      return reply.send({ ok: true });
    });

  /* ── Builder profile (builder_profiles table) ──────────────── */
  /** GET /api/users/me/builder-profile */
  app.get("/users/me/builder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db.execute(sql`
      SELECT * FROM builder_profiles WHERE id = ${sub} LIMIT 1
    `);
    const profile = (rows as any).rows?.[0] ?? null;
    return reply.send({ profile });
  });

  /** POST /api/users/me/builder-profile */
  app.post("/users/me/builder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = (req.body ?? {}) as Record<string, unknown>;
    const headline = (body.headline as string) ?? "";
    const bio = (body.bio as string) ?? null;
    const skills = Array.isArray(body.skills) ? (body.skills as string[]) : [];
    const available = body.available !== false;
    const hourlyDot =
      body.hourlyDot != null && body.hourlyDot !== "" ? Number(body.hourlyDot) : null;
    const portfolioUrl = (body.portfolioUrl as string) ?? null;
    const linkedinUrl = (body.linkedinUrl as string) ?? null;
    const twitterUrl = (body.twitterUrl as string) ?? null;
    const githubUrl = (body.githubUrl as string) ?? null;
    const location = (body.location as string) ?? null;

    await db
      .insert(builderProfiles)
      .values({
        id: sub,
        headline, bio, skills, available,
        hourlyDot: hourlyDot != null ? String(hourlyDot) : null,
        portfolioUrl, linkedinUrl, twitterUrl, githubUrl, location,
      } as any)
      .onConflictDoUpdate({
        target: builderProfiles.id,
        set: {
          headline, bio, skills, available,
          hourlyDot: hourlyDot != null ? String(hourlyDot) : null,
          portfolioUrl, linkedinUrl, twitterUrl, githubUrl, location,
          updatedAt: new Date(),
        } as any,
      });

    return reply.send({ ok: true });
  });

  // PUT alias — frontend prefers PUT semantics for "update builder profile"
  app.put("/users/me/builder-profile", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = (req.body ?? {}) as Record<string, unknown>;
    const headline = (body.headline as string) ?? "";
    const bio = (body.bio as string) ?? null;
    const skills = Array.isArray(body.skills) ? (body.skills as string[]) : [];
    const available = body.available !== false;
    const hourlyDot =
      body.hourlyDot != null && body.hourlyDot !== "" ? Number(body.hourlyDot) : null;
    const portfolioUrl = (body.portfolioUrl as string) ?? null;
    const linkedinUrl = (body.linkedinUrl as string) ?? null;
    const twitterUrl = (body.twitterUrl as string) ?? null;
    const githubUrl = (body.githubUrl as string) ?? null;
    const location = (body.location as string) ?? null;

    await db
      .insert(builderProfiles)
      .values({
        id: sub,
        headline, bio, skills, available,
        hourlyDot: hourlyDot != null ? String(hourlyDot) : null,
        portfolioUrl, linkedinUrl, twitterUrl, githubUrl, location,
      } as any)
      .onConflictDoUpdate({
        target: builderProfiles.id,
        set: {
          headline, bio, skills, available,
          hourlyDot: hourlyDot != null ? String(hourlyDot) : null,
          portfolioUrl, linkedinUrl, twitterUrl, githubUrl, location,
          updatedAt: new Date(),
        } as any,
      });

    return reply.send({ ok: true });
  });

  /* ── DOT-ID LOOKUP — public-ish (returns only name + dotId) ─────── */

  /** GET /api/users/lookup?dotId=... — public lookup so transfers work.
   * Returns just the public profile bits (name, dotId) — never email/id/etc. */
  app.get<{ Querystring: { dotId?: string } }>("/users/lookup", async (req, reply) => {
    const dotId = (req.query.dotId ?? "").trim().toUpperCase();
    if (!dotId) return reply.code(400).send({ error: "dotId required" });
    const row = await db
      .select({ id: users.id, name: users.name, dotId: users.dotId, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.dotId, dotId))
      .limit(1);
    if (!row[0]) return reply.code(404).send({ user: null });
    return reply.send({
      user: {
        id: row[0].id,
        name: row[0].name,
        dotId: row[0].dotId,
        avatarUrl: row[0].avatarUrl,
      },
    });
  });

  /** GET /api/founder-profiles — list all founder profiles (showcase).
   * Returns the snake_case fields the legacy frontend expects
   * (user_id, venture_name, vantage_point, fundability). */
  app.get("/founder-profiles", async (_req, reply) => {
    const rows = await db.execute(sql`
      SELECT
        fp.user_id, fp.venture_name, fp.industry, fp.stage, fp.country,
        fp.bio, fp.website, fp.funding_goal, fp.vantage_point,
        fp.fundability, fp.investment_readiness, fp.logo_url,
        u.name, u.avatar_url, u.dot_id
      FROM founder_profiles fp
      LEFT JOIN users u ON u.id = fp.user_id
      WHERE fp.venture_name IS NOT NULL
      ORDER BY fp.vantage_point DESC NULLS LAST
      LIMIT 100
    `);
    const out = ((rows as any).rows ?? []).map((r: any) => ({
      user_id: r.user_id,
      venture_name: r.venture_name,
      industry: r.industry,
      stage: r.stage,
      country: r.country,
      bio: r.bio,
      website: r.website,
      funding_goal: Number(r.funding_goal ?? 0),
      vantage_point: Number(r.vantage_point ?? 0),
      fundability: Number(r.fundability ?? 0),
      investment_readiness: Number(r.investment_readiness ?? 0),
      logo_url: r.logo_url,
      name: r.name,
      avatar_url: r.avatar_url,
      dot_id: r.dot_id,
    }));
    return reply.send({ ventures: out });
  });

  /** GET /api/founders/:idOrDotId — public founder profile (shareable URL).
   * Resolves by user ID OR DOT ID. Returns the full founder profile
   * + aggregate stats (votes, commitments, vantage, fundability).
   * No auth required — this is the "shareable venture resume" */
  app.get<{ Params: { idOrDotId: string } }>("/founders/:idOrDotId", async (req, reply) => {
    const { idOrDotId } = req.params;

    // Resolve user (by id OR dot_id)
    let userRow: any;
    if (idOrDotId.startsWith("dot-") || /^[a-z]+-[a-z]+-/.test(idOrDotId)) {
      // DOT ID format like "brave-works-26pc4x9l"
      const users1 = await db.select().from(users).where(sql`${users.dotId} = ${idOrDotId}`).limit(1);
      userRow = users1[0];
    } else {
      const users2 = await db.select().from(users).where(eq(users.id, idOrDotId)).limit(1);
      userRow = users2[0];
    }
    if (!userRow) return reply.code(404).send({ error: "Founder not found" });

    const id = userRow.id;

    // Founder profile
    const profile = await db.execute(sql`SELECT * FROM founder_profiles WHERE user_id = ${id} LIMIT 1`) as any;
    const profileRow = (profile as any)[0] ?? (profile as any).rows?.[0] ?? null;

    // User roles
    const userRolesList = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, id));

    // Aggregate votes across all ventures owned by this founder
    const voteStats = await db.execute(sql`
      SELECT
        COALESCE(SUM(weight), 0)::int AS total_votes,
        COUNT(*)::int AS vote_count
      FROM votes v
      JOIN ventures vt ON vt.id::text = v.target_id
      WHERE vt.user_id = ${id}
        AND v.target_type = 'venture'
    `) as any;
    const vsRow = (voteStats as any)[0] ?? (voteStats as any).rows?.[0] ?? {};

    // Aggregate capital commitments to ventures owned by this founder
    const capitalStats = await db.execute(sql`
      SELECT
        COALESCE(SUM(ABS(t.amount)), 0) AS total_raised_dot,
        COUNT(DISTINCT t.user_id)::int AS sponsor_count
      FROM transactions t
      JOIN ventures vt ON vt.id::text = SUBSTRING(t.description FROM 'venture=([^ ]+)')
      WHERE t.description LIKE '[CAPITAL_COMMIT]%'
        AND vt.user_id = ${id}
    `) as any;
    const csRow = (capitalStats as any)[0] ?? (capitalStats as any).rows?.[0] ?? {};

    // All ventures owned
    const venturesList = await db
      .select()
      .from(ventures)
      .where(eq(ventures.userId, id))
      .orderBy(desc(ventures.createdAt));

    return reply.send({
      founder: {
        id: userRow.id,
        name: userRow.name,
        dotId: userRow.dotId,
        avatarUrl: userRow.avatarUrl,
        createdAt: userRow.createdAt,
        roles: userRolesList.map((r) => r.role),
        isFounder: userRolesList.some((r) => r.role === "founder"),
        isBuilder: userRolesList.some((r) => r.role === "builder"),
        isCapitalPartner: userRolesList.some((r) => r.role === "capital_partner"),
      },
      profile: profileRow ? {
        ventureName: profileRow.venture_name,
        industry: profileRow.industry,
        stage: profileRow.stage,
        country: profileRow.country,
        bio: profileRow.bio,
        website: profileRow.website,
        fundingGoal: Number(profileRow.funding_goal ?? 0),
        logoUrl: profileRow.logo_url,
        vantagePoint: Number(profileRow.vantage_point ?? 0),
        fundability: Number(profileRow.fundability ?? 0),
        investmentReadiness: Number(profileRow.investment_readiness ?? 0),
      } : null,
      stats: {
        totalVotes: Number(vsRow?.total_votes ?? 0),
        voteCount: Number(vsRow?.vote_count ?? 0),
        totalRaisedDot: Number(csRow?.total_raised_dot ?? 0),
        sponsorCount: Number(csRow?.sponsor_count ?? 0),
        venturesOwned: venturesList.length,
      },
      ventures: venturesList.map((v) => ({
        id: v.id,
        name: v.name,
        industry: v.industry,
        stage: v.stage,
        country: v.country,
        fundingGoal: Number(v.fundingGoal ?? 0),
        vantagePoint: v.vantagePoint,
        fundability: v.fundability,
        createdAt: v.createdAt,
      })),
    });
  });

  /** GET /api/users/me/roles — short helper that returns just the user's roles
   * (frontend uses this for faster initial role hydration). */
  app.get("/users/me/roles", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, sub));
    return reply.send({ userId: sub, roles: rows.map((r) => r.role) });
  });

  /** GET /api/users/:id/public — minimal public profile (name, avatar, dotId) */
  app.get<{ Params: { id: string } }>("/users/:id/public", async (req, reply) => {
    const id = req.params.id;
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        dotId: users.dotId,
        headline: users.headline,
        location: users.location,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1) as any;
    const r = rows[0];
    if (!r) return reply.code(404).send({ error: "User not found" });
    return reply.send({
      user: {
        id: r.id,
        name: r.name ?? null,
        avatarUrl: r.avatarUrl ?? null,
        dotId: r.dotId ?? null,
        headline: r.headline ?? null,
        location: r.location ?? null,
        createdAt: r.createdAt,
      },
    });
  });
}
// @ts-nocheck
