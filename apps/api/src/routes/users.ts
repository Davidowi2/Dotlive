// @ts-nocheck
/**
 * User routes: profile, role management, lookup.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { users, userRoles, roleRequirements, wallets } from "../db/schema.js";
import { loadUserWithRoles, userHasRole } from "../lib/auth.js";
import { debitWallet } from "../lib/dot.js";
import type { AppRole } from "../../../packages/shared/types.js";

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
    await db.insert(userRoles).values({ userId: sub, role }).onConflictDoNothing();

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
}
// @ts-nocheck