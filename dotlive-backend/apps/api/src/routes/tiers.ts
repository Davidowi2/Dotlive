/**
 * Tier upgrade routes — paid, time-limited user tiers.
 *
 * Endpoints:
 *   GET    /api/tiers/pricing  — public price list + (if authed) the caller's current tier.
 *   GET    /api/tiers/me       — authed: current tier + days remaining.
 *   POST   /api/tiers/upgrade  — authed: purchase a 365-day upgrade (debits wallet).
 *   POST   /api/tiers/renew    — authed: extend an existing active upgrade by 365 days.
 *   GET    /api/tiers/history  — authed: full purchase history for the caller.
 *
 * The Neon HTTP driver used by this project does NOT support
 * `db.transaction(...)` (no SQL-level tx), so the upgrade flow uses
 * the same atomic-conditional-debit pattern as `transferDot`:
 *   1. UPDATE wallet SET balance = balance - $cost WHERE balance >= $cost
 *      — if 0 rows updated, abort.
 *   2. Insert tier_upgrades + (optionally) user_roles.
 *   3. Update users.tier_expires_at.
 *   4. Ledger row.
 * If step 2-3 fails after step 1, refund the wallet (best effort).
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, eq, sql as drizzleSql, desc, gt, gte, lte, isNull } from "drizzle-orm";

import { db } from "../db/client.js";
import { tierUpgrades, users, userRoles, wallets, transactions } from "../db/schema.js";
import {
  TIER_PRICING,
  isPurchasableTier,
  tierCost,
  tierDurationDays,
  daysBetween,
  type PurchasableTier,
} from "../lib/tiers.js";

const TIER_UPGRADE_TX_TYPE = "tier_upgrade";

/** Return the caller's currently active paid tier (if any). */
async function getActivePaidTier(userId: string): Promise<{
  tier: PurchasableTier;
  expiresAt: Date;
  upgradeId: string;
} | null> {
  const rows = await db
    .select()
    .from(tierUpgrades)
    .where(
      and(
        eq(tierUpgrades.userId, userId),
        eq(tierUpgrades.status, "active"),
        gt(tierUpgrades.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(tierUpgrades.expiresAt))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (!isPurchasableTier(row.tier)) return null;
  return {
    tier: row.tier,
    expiresAt: row.expiresAt,
    upgradeId: row.id,
  };
}

/** Atomic conditional debit — same pattern as transferDot. */
async function atomicDebit(
  userId: string,
  amount: number,
  description: string,
): Promise<{ ok: true; newBalance: number } | { ok: false }> {
  const r = await db
    .update(wallets)
    .set({
      balance: drizzleSql`${wallets.balance} - ${amount}`,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(wallets.userId, userId),
        drizzleSql`${wallets.balance} >= ${amount}`,
      ) as any,
    )
    .returning({ balance: wallets.balance });

  if (r.length === 0) return { ok: false };
  await db.insert(transactions).values({
    userId,
    amount: String(-amount),
    type: TIER_UPGRADE_TX_TYPE,
    description,
  } as any);
  return { ok: true, newBalance: Number(r[0].balance) };
}

async function refund(userId: string, amount: number, reason: string): Promise<void> {
  try {
    await db
      .update(wallets)
      .set({
        balance: drizzleSql`${wallets.balance} + ${amount}`,
        updatedAt: new Date(),
      } as any)
      .where(eq(wallets.userId, userId));
    await db.insert(transactions).values({
      userId,
      amount: String(amount),
      type: "tier_upgrade_refund",
      description: reason,
    } as any);
  } catch (err) {
    console.error(`[tiers] refund failed for ${userId} (${amount} DOT):`, err);
  }
}

const upgradeSchema = z.object({
  tier: z.enum(["founder", "capital_partner"]),
});

const renewSchema = z.object({
  upgradeId: z.string().uuid(),
});

export async function tiersRoutes(app: FastifyInstance) {
  /* ── GET /api/tiers/pricing ─────────────────────────────── */
  app.get("/tiers/pricing", async (req, reply) => {
    let active: PurchasableTier | null = null;
    let expiresAt: string | null = null;

    try {
      // Optional auth — return the caller's active tier if present.
      await (app as any).authenticate?.(req, reply);
      const sub = (req as any).user?.sub as string | undefined;
      if (sub) {
        const a = await getActivePaidTier(sub);
        if (a) {
          active = a.tier;
          expiresAt = a.expiresAt.toISOString();
        }
      }
    } catch {
      // unauthenticated callers still get the price list
    }

    return reply.send({
      tiers: Object.entries(TIER_PRICING).map(([key, v]) => ({
        key,
        dot: v.dot,
        label: v.label,
        durationDays: v.durationDays,
        description: v.description,
        features: v.features,
      })),
      currentTier: active,
      currentTierExpiresAt: expiresAt,
    });
  });

  /* ── GET /api/tiers/me ──────────────────────────────────── */
  app.get("/tiers/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    const active = await getActivePaidTier(sub);
    if (!active) {
      return reply.send({
        tier: "builder",
        expiresAt: null,
        daysRemaining: null,
        canRenew: false,
      });
    }

    const now = new Date();
    const days = daysBetween(now, active.expiresAt);
    // Allow renew within the last 30 days (or after expiry).
    const canRenew =
      daysBetween(now, active.expiresAt) <= 30 ||
      active.expiresAt.getTime() < now.getTime();

    return reply.send({
      tier: active.tier,
      expiresAt: active.expiresAt.toISOString(),
      daysRemaining: days,
      canRenew,
    });
  });

  /* ── POST /api/tiers/upgrade ────────────────────────────── */
  app.post("/tiers/upgrade", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = upgradeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input" });
    }
    const { tier } = parsed.data;
    if (!isPurchasableTier(tier)) {
      return reply.code(400).send({ error: "Unknown tier" });
    }
    const cost = tierCost(tier);

    // Block duplicate active upgrades for the same tier.
    const existing = await getActivePaidTier(sub);
    if (existing && existing.tier === tier) {
      return reply.code(409).send({
        error: `You already have an active ${tier} tier. Use renew instead.`,
        expiresAt: existing.expiresAt.toISOString(),
      });
    }

    // Ensure wallet row exists (so the conditional UPDATE has something to match).
    await db
      .insert(wallets)
      .values({ userId: sub, balance: "0" } as any)
      .onConflictDoNothing();

    // 1) Atomic conditional debit.
    const debit = await atomicDebit(sub, cost, `Tier upgrade → ${tier}`);
    if (!debit.ok) {
      return reply.code(402).send({ error: "Insufficient DOT", need: cost });
    }

    // 2) Insert tier_upgrades row + grant role + bump user.tier_expires_at.
    const days = tierDurationDays(tier);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    let upgradeId: string;
    try {
      const inserted = await db
        .insert(tierUpgrades)
        .values({
          userId: sub,
          tier,
          costDot: String(cost),
          expiresAt,
          status: "active",
        } as any)
        .returning({ id: tierUpgrades.id });
      upgradeId = inserted[0].id;

      await db
        .insert(userRoles)
        .values({ userId: sub, role: tier } as any)
        .onConflictDoNothing();

      await db
        .update(users)
        .set({ tierExpiresAt: expiresAt, updatedAt: new Date() } as any)
        .where(eq(users.id, sub));
    } catch (err) {
      // Refund the wallet since we already debited it.
      await refund(sub, cost, `Tier upgrade failed → ${tier}: ${(err as Error).message}`);
      throw err;
    }

    return reply.send({
      upgrade: {
        id: upgradeId,
        tier,
        costDot: cost,
        expiresAt: expiresAt.toISOString(),
        purchasedAt: new Date().toISOString(),
        status: "active",
        renewedFrom: null,
      },
      newBalance: debit.newBalance,
    });
  });

  /* ── POST /api/tiers/renew ──────────────────────────────── */
  app.post("/tiers/renew", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = renewSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    // Load the existing upgrade — must be owned by the caller and active.
    const rows = await db
      .select()
      .from(tierUpgrades)
      .where(and(eq(tierUpgrades.id, parsed.data.upgradeId), eq(tierUpgrades.userId, sub)))
      .limit(1);
    const existing = rows[0];
    if (!existing) return reply.code(404).send({ error: "Upgrade not found" });
    if (existing.status !== "active") {
      return reply.code(409).send({ error: "Upgrade is not active" });
    }
    if (!isPurchasableTier(existing.tier)) {
      return reply.code(400).send({ error: "Unknown tier" });
    }

    // Stacking window: allow renew within 30 days of expiry.
    const now = new Date();
    const within30 = daysBetween(now, existing.expiresAt) <= 30;
    const alreadyExpired = existing.expiresAt.getTime() < now.getTime();
    if (!within30 && !alreadyExpired) {
      return reply.code(409).send({
        error: "Renewal window not open yet. Come back within 30 days of expiry.",
        expiresAt: existing.expiresAt.toISOString(),
      });
    }

    // No duplicate active upgrade for the same tier (other than this one).
    const otherActive = await db
      .select()
      .from(tierUpgrades)
      .where(
        and(
          eq(tierUpgrades.userId, sub),
          eq(tierUpgrades.tier, existing.tier),
          eq(tierUpgrades.status, "active"),
          gt(tierUpgrades.expiresAt, now),
        ),
      );
    if (otherActive.length > 1) {
      return reply.code(409).send({ error: "Another active upgrade exists for this tier" });
    }

    const cost = tierCost(existing.tier);

    // Ensure wallet row exists.
    await db
      .insert(wallets)
      .values({ userId: sub, balance: "0" } as any)
      .onConflictDoNothing();

    // 1) Atomic conditional debit.
    const debit = await atomicDebit(
      sub,
      cost,
      `Tier renew → ${existing.tier} (was ${existing.id})`,
    );
    if (!debit.ok) {
      return reply.code(402).send({ error: "Insufficient DOT", need: cost });
    }

    // 2) Stack from the existing expiry (not from now).
    const newExpiresAt = new Date(
      existing.expiresAt.getTime() + tierDurationDays(existing.tier) * 24 * 60 * 60 * 1000,
    );

    let renewalId: string;
    try {
      const inserted = await db
        .insert(tierUpgrades)
        .values({
          userId: sub,
          tier: existing.tier,
          costDot: String(cost),
          expiresAt: newExpiresAt,
          renewedFrom: existing.id,
          status: "active",
        } as any)
        .returning({ id: tierUpgrades.id });
      renewalId = inserted[0].id;

      // Mark the old row as superseded (we keep it for history).
      await db
        .update(tierUpgrades)
        .set({ status: "renewed", updatedAt: new Date() } as any)
        .where(eq(tierUpgrades.id, existing.id));

      await db
        .update(users)
        .set({ tierExpiresAt: newExpiresAt, updatedAt: new Date() } as any)
        .where(eq(users.id, sub));
    } catch (err) {
      await refund(sub, cost, `Tier renew failed: ${(err as Error).message}`);
      throw err;
    }

    return reply.send({
      upgrade: {
        id: renewalId,
        tier: existing.tier,
        costDot: cost,
        expiresAt: newExpiresAt.toISOString(),
        purchasedAt: new Date().toISOString(),
        status: "active",
        renewedFrom: existing.id,
      },
      newBalance: debit.newBalance,
    });
  });

  /* ── GET /api/tiers/history ─────────────────────────────── */
  app.get("/tiers/history", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(tierUpgrades)
      .where(eq(tierUpgrades.userId, sub))
      .orderBy(desc(tierUpgrades.createdAt))
      .limit(200);

    return reply.send({
      upgrades: rows.map((r) => ({
        id: r.id,
        tier: r.tier,
        costDot: Number(r.costDot),
        purchasedAt: r.purchasedAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
        renewedFrom: r.renewedFrom,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}

/**
 * Auto-revert expired tier upgrades. Called by `server.ts` on boot
 * and every 1 hour. Sets `status='expired'`, clears
 * `users.tier_expires_at`, and revokes the matching role.
 *
 * Only reverts when the upgrade is the user's LATEST active one for
 * that tier — never touch renewals that have already been stacked on
 * top.
 */
export async function tierExpirySweep(): Promise<number> {
  try {
    const now = new Date();
    // 1) Find expired-but-still-active rows.
    const expired = await db
      .select()
      .from(tierUpgrades)
      .where(
        and(
          eq(tierUpgrades.status, "active"),
          lte(tierUpgrades.expiresAt, now),
        ),
      );

    if (expired.length === 0) return 0;

    let reverted = 0;
    for (const row of expired) {
      // Skip if there's another active row for the same (user, tier).
      const newer = await db
        .select({ id: tierUpgrades.id })
        .from(tierUpgrades)
        .where(
          and(
            eq(tierUpgrades.userId, row.userId),
            eq(tierUpgrades.tier, row.tier),
            eq(tierUpgrades.status, "active"),
            gt(tierUpgrades.expiresAt, now),
          ),
        )
        .limit(1);
      if (newer.length > 0) {
        // Someone has a newer active upgrade — just mark this one expired.
        await db
          .update(tierUpgrades)
          .set({ status: "expired" } as any)
          .where(eq(tierUpgrades.id, row.id));
        continue;
      }

      // No newer upgrade — actually revert.
      await db
        .update(tierUpgrades)
        .set({ status: "expired" } as any)
        .where(eq(tierUpgrades.id, row.id));

      // Revoke the role.
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, row.userId), eq(userRoles.role, row.tier)));

      // Clear users.tier_expires_at (only if it still points at this row's expiry).
      await db
        .update(users)
        .set({ tierExpiresAt: null, updatedAt: new Date() } as any)
        .where(and(eq(users.id, row.userId), eq(users.tierExpiresAt, row.expiresAt)));

      reverted += 1;
    }

    return reverted;
  } catch (err) {
    console.error("[tiers] sweep failed:", err);
    return 0;
  }
}
