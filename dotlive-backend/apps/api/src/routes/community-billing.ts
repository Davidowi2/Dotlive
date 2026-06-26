/**
 * DOT OS — Community subscription routes (Sprint A.2)
 *
 *   POST /api/communities/:id/upgrade        Leader upgrades tier (debits DOT)
 *   POST /api/communities/:id/renew          Leader renews annual subscription
 *   POST /api/communities/:id/set-tier       Admin: override tier + extend
 *   GET  /api/communities/:id/billing        Get billing status
 *
 * Tier pricing:
 *   free       0        DOT/year
 *   verified   200,000  DOT/year  (~ $2,000 at ₦15/DOT/$0.67)
 *   campus     200,000  DOT/year  (same as verified, but gated by university)
 *   enterprise 500,000  DOT/year  (~$5,000)
 */

import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { communities, wallets, transactions } from "../db/schema.js";
import { getUserRoles } from "../lib/auth.js";
import { debitWallet } from "../lib/dot.js";

const TIER_PRICING: Record<string, { dot: number; graceDays: number; label: string }> = {
  free: { dot: 0, graceDays: 0, label: "Free Community" },
  verified: { dot: 200_000, graceDays: 30, label: "Verified Community" },
  campus: { dot: 200_000, graceDays: 30, label: "Campus Community" },
  enterprise: { dot: 500_000, graceDays: 30, label: "Enterprise Community" },
};

const VALID_TIERS = Object.keys(TIER_PRICING);

const requireAdmin = async (req: any, reply: any) => {
  const id = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(id);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return reply.code(403).send({ error: "Admin only" });
  }
};

export async function communityBillingRoutes(app: FastifyInstance) {
  /* ============================== GET BILLING ============================== */

  app.get<{ Params: { id: string } }>(
    "/communities/:id/billing",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { id } = req.params;
      const [c] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
      if (!c) return reply.code(404).send({ error: "Community not found" });

      const tier = (c.tier ?? "free") as string;
      const price = TIER_PRICING[tier] ?? TIER_PRICING.free;
      const renewalAt = c.annualRenewalAt ? new Date(c.annualRenewalAt) : null;
      const daysUntilRenewal = renewalAt
        ? Math.ceil((renewalAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return reply.send({
        billing: {
          tier,
          label: price.label,
          annualDot: price.dot,
          annualNgn: price.dot * 15, // ₦15/DOT
          annualUsd: price.dot * 15 / 1500, // ~₦1500/USD
          graceDays: price.graceDays,
          paidThroughAt: c.paidThroughAt,
          annualRenewalAt: c.annualRenewalAt,
          daysUntilRenewal,
          subscriptionStatus: c.subscriptionStatus,
          isExpired: renewalAt ? renewalAt.getTime() < Date.now() : false,
          inGrace: renewalAt ? (renewalAt.getTime() < Date.now() && (renewalAt.getTime() + price.graceDays * 86400000) > Date.now()) : false,
        },
      });
    },
  );

  /* ============================== UPGRADE ============================== */

  app.post<{ Params: { id: string } }>(
    "/communities/:id/upgrade",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { id } = req.params;
      const body = (req.body ?? {}) as { tier?: string };

      if (!body.tier || !VALID_TIERS.includes(body.tier)) {
        return reply.code(400).send({ error: `Invalid tier. Must be: ${VALID_TIERS.join(", ")}` });
      }

      const [c] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
      if (!c) return reply.code(404).send({ error: "Community not found" });

      // Only the leader can upgrade
      if (c.leaderId !== sub) {
        return reply.code(403).send({ error: "Only the community leader can upgrade" });
      }

      const price = TIER_PRICING[body.tier];
      if (price.dot === 0) {
        // Downgrade to free
        await db
          .update(communities)
          .set({
            tier: "free",
            annualRenewalAt: null,
            paidThroughAt: null,
            subscriptionStatus: "active",
            updatedAt: new Date(),
          } as any)
          .where(eq(communities.id, id));
        return reply.send({ ok: true, tier: "free", message: "Downgraded to Free" });
      }

      // Check leader's wallet balance
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
      const balance = Number(wallet?.balance ?? 0);
      if (balance < price.dot) {
        return reply.code(400).send({
          error: `Insufficient DOT balance. Need ${price.dot.toLocaleString()} DOT, have ${balance.toLocaleString()} DOT.`,
          required: price.dot,
          balance,
        });
      }

      // Debit + record transaction
      try {
        await debitWallet({
          userId: sub,
          amount: price.dot,
          type: "community_subscription",
          description: `${price.label} annual subscription for community ${c.name}`,
        });
      } catch (e) {
        return reply.code(400).send({ error: (e as Error).message });
      }

      // Set tier + extend by 365 days from now (or from existing expiry if still active)
      const now = new Date();
      const existingRenewal = c.annualRenewalAt ? new Date(c.annualRenewalAt) : null;
      const base = existingRenewal && existingRenewal > now ? existingRenewal : now;
      const newRenewal = new Date(base.getTime() + 365 * 86400000);

      await db
        .update(communities)
        .set({
          tier: body.tier,
          annualRenewalAt: newRenewal,
          paidThroughAt: newRenewal,
          subscriptionStatus: "active",
          verifiedAt: body.tier !== "free" && !c.verifiedAt ? new Date() : c.verifiedAt,
          updatedAt: new Date(),
        } as any)
        .where(eq(communities.id, id));

      const [updated] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
      return reply.send({
        ok: true,
        community: updated,
        paid: price.dot,
        nextRenewalAt: newRenewal,
      });
    },
  );

  /* ============================== RENEW ============================== */

  app.post<{ Params: { id: string } }>(
    "/communities/:id/renew",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { id } = req.params;

      const [c] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
      if (!c) return reply.code(404).send({ error: "Community not found" });
      if (c.leaderId !== sub) return reply.code(403).send({ error: "Only the community leader can renew" });

      const tier = (c.tier ?? "free") as string;
      if (tier === "free") return reply.code(400).send({ error: "Free tier doesn't need renewal" });

      const price = TIER_PRICING[tier];
      if (!price || price.dot === 0) {
        return reply.code(400).send({ error: "Invalid tier for renewal" });
      }

      // Check balance
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
      const balance = Number(wallet?.balance ?? 0);
      if (balance < price.dot) {
        return reply.code(400).send({
          error: `Insufficient DOT balance. Need ${price.dot.toLocaleString()} DOT, have ${balance.toLocaleString()} DOT.`,
        });
      }

      await debitWallet({
        userId: sub,
        amount: price.dot,
        type: "community_renewal",
        description: `${price.label} annual renewal for community ${c.name}`,
      });

      const now = new Date();
      const existingRenewal = c.annualRenewalAt ? new Date(c.annualRenewalAt) : null;
      const base = existingRenewal && existingRenewal > now ? existingRenewal : now;
      const newRenewal = new Date(base.getTime() + 365 * 86400000);

      await db
        .update(communities)
        .set({
          annualRenewalAt: newRenewal,
          paidThroughAt: newRenewal,
          subscriptionStatus: "active",
          updatedAt: new Date(),
        } as any)
        .where(eq(communities.id, id));

      return reply.send({ ok: true, nextRenewalAt: newRenewal });
    },
  );

  /* ============================== ADMIN OVERRIDE ============================== */

  app.post<{ Params: { id: string } }>(
    "/communities/:id/set-tier",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params;
      const body = (req.body ?? {}) as {
        tier?: string;
        daysFromNow?: number;
        reason?: string;
      };

      if (!body.tier || !VALID_TIERS.includes(body.tier)) {
        return reply.code(400).send({ error: `Invalid tier. Must be: ${VALID_TIERS.join(", ")}` });
      }

      const days = Number(body.daysFromNow ?? 365);
      const newRenewal = new Date(Date.now() + days * 86400000);

      await db
        .update(communities)
        .set({
          tier: body.tier,
          annualRenewalAt: body.tier === "free" ? null : newRenewal,
          paidThroughAt: body.tier === "free" ? null : newRenewal,
          subscriptionStatus: "active",
          verifiedAt: body.tier !== "free" ? new Date() : null,
          updatedAt: new Date(),
        } as any)
        .where(eq(communities.id, id));

      const [updated] = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
      return reply.send({ community: updated, reason: body.reason ?? null });
    },
  );

  /* ============================== LIST PRICING (PUBLIC) ============================== */

  app.get("/communities/tiers", async (_req, reply) => {
    return reply.send({
      tiers: Object.entries(TIER_PRICING).map(([key, v]) => ({
        id: key,
        label: v.label,
        annualDot: v.dot,
        annualNgn: v.dot * 15,
        annualUsd: Math.round((v.dot * 15 / 1500) * 100) / 100,
        graceDays: v.graceDays,
      })),
    });
  });
}