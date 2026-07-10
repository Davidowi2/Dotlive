/**
 * Stakes routes — staking system with 12% APY and 14-day cooldown.
 *
 * GET  /api/stakes              — user's DOT staking positions
 * POST /api/stakes              — create a new DOT stake
 * POST /api/stakes/:id/unbond   — start 14-day cooldown
 * POST /api/stakes/:id/claim    — claim pending rewards
 * POST /api/stakes/:id/complete — complete unbond after cooldown (withdraw)
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { dotStakePositions, dotStakeHistory, wallets } from "../db/schema.js";

const APY_PERCENT = 0.12; // 12% APY
const COOLDOWN_DAYS = 14;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const stakeSchema = z.object({
  amount: z.number().int().min(1).max(1000000), // 1 DOT to 1M DOT
});

export async function stakesRoutes(app: FastifyInstance) {
  /** GET /api/stakes — user's DOT stake positions */
  app.get("/stakes", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    const rows = await db
      .select()
      .from(dotStakePositions)
      .where(eq(dotStakePositions.userId, sub))
      .orderBy(desc(dotStakePositions.stakedAt));

    // Compute accrued rewards on-the-fly based on stake age
    const enriched = rows.map((s) => {
      const daysStaked = (Date.now() - s.stakedAt.getTime()) / (1000 * 60 * 60 * 24);
      const rewardAccrued = computeAccruedReward(s.amount, daysStaked, s.status);
      return { ...s, rewardAccrued };
    });

    return reply.send(enriched);
  });

  /** POST /api/stakes — create a new DOT stake */
  app.post("/stakes", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = stakeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { amount } = parsed.data;

    // Check user has sufficient balance
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, sub));
    if (!wallet || Number(wallet.balance) < amount) {
      return reply.code(400).send({ error: "Insufficient balance" });
    }

    // Create stake position
    const stakeId = crypto.randomUUID();
    const [insertedStake] = await db
      .insert(dotStakePositions)
      .values({
        id: stakeId,
        userId: sub,
        amount,
        status: "active",
      } as any)
      .returning();

    // Deduct from wallet balance, add to stakedBalance
    const newBalance = Number(wallet.balance) - amount;
    const newStakedBalance = Number(wallet.stakedBalance) + amount;
    await db
      .update(wallets)
      .set({
        balance: newBalance.toString(),
        stakedBalance: newStakedBalance.toString(),
      } as any)
      .where(eq(wallets.userId, sub));

    return reply.status(201).send(insertedStake);
  });

  /** POST /api/stakes/:id/unbond — start 14-day cooldown */
  app.post("/stakes/:id/unbond", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    const [stake] = await db.select().from(dotStakePositions).where(eq(dotStakePositions.id, id));
    if (!stake) {
      return reply.code(404).send({ error: "Stake not found" });
    }
    if (stake.userId !== sub) {
      return reply.code(403).send({ error: "Not your stake" });
    }
    if (stake.status !== "active") {
      return reply.code(400).send({ error: "Stake is not active" });
    }

    const unbondedAt = new Date();

    // Update stake
    const [updated] = await db
      .update(dotStakePositions)
      .set({ 
        status: "unstaking", 
        unbondedAt 
      } as any)
      .where(eq(dotStakePositions.id, id))
      .returning();

    return reply.send(updated);
  });

  /** POST /api/stakes/:id/claim — claim pending rewards */
  app.post("/stakes/:id/claim", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    const [stake] = await db.select().from(dotStakePositions).where(eq(dotStakePositions.id, id));
    if (!stake) {
      return reply.code(404).send({ error: "Stake not found" });
    }
    if (stake.userId !== sub) {
      return reply.code(403).send({ error: "Not your stake" });
    }

    // Calculate accrued rewards
    const daysStaked = (Date.now() - stake.stakedAt.getTime()) / (1000 * 60 * 60 * 24);
    const accrued = computeAccruedReward(stake.amount, daysStaked, stake.status);
    if (accrued <= 0) {
      return reply.code(400).send({ error: "No rewards to claim" });
    }

    const claimed = Math.floor(accrued);
    const newTotalClaimed = stake.rewardClaimed + claimed;

    // Update stake
    const [updated] = await db
      .update(dotStakePositions)
      .set({
        rewardClaimed: newTotalClaimed,
        rewardAccrued: 0,
        claimedAt: new Date(),
      } as any)
      .where(eq(dotStakePositions.id, id))
      .returning();

    // Credit wallet
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, sub));
    if (wallet) {
      const newBalance = Number(wallet.balance) + claimed;
      const newEarnedLifetime = Number(wallet.earnedLifetime) + claimed;
      await db
        .update(wallets)
        .set({
          balance: newBalance.toString(),
          earnedLifetime: newEarnedLifetime.toString(),
        } as any)
        .where(eq(wallets.userId, sub));
    }

    return reply.send({ claimed, stake: updated });
  });

  /** POST /api/stakes/:id/complete — complete unbond after 14-day cooldown */
  app.post("/stakes/:id/complete", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    const [stake] = await db.select().from(dotStakePositions).where(eq(dotStakePositions.id, id));
    if (!stake) {
      return reply.code(404).send({ error: "Stake not found" });
    }
    if (stake.userId !== sub) {
      return reply.code(403).send({ error: "Not your stake" });
    }
    if (stake.status !== "unstaking") {
      return reply.code(400).send({ error: "Stake is not unstaking" });
    }
    if (!stake.unbondedAt) {
      return reply.code(400).send({ error: "No unbond date found" });
    }

    // Check if cooldown has elapsed
    const now = Date.now();
    const cooldownEnd = stake.unbondedAt.getTime() + COOLDOWN_MS;
    if (now < cooldownEnd) {
      const daysLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60 * 24));
      return reply
        .code(400)
        .send({ error: `Cooldown still active. ${daysLeft} days remaining.` });
    }

    // Return staked amount to wallet
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, sub));
    if (!wallet) {
      return reply.code(500).send({ error: "Wallet not found" });
    }

    // Update stake
    const [updated] = await db
      .update(dotStakePositions)
      .set({ status: "withdrawn" } as any)
      .where(eq(dotStakePositions.id, id))
      .returning();

    const newBalance = Number(wallet.balance) + stake.amount;
    const newStakedBalance = Math.max(0, Number(wallet.stakedBalance) - stake.amount);
    await db
      .update(wallets)
      .set({
        balance: newBalance.toString(),
        stakedBalance: newStakedBalance.toString(),
      } as any)
      .where(eq(wallets.userId, sub));

    return reply.send(updated);
  });
}

/**
 * Compute accrued rewards based on stake amount, days staked, and status.
 * 12% APY compounded daily.
 *
 * If unstaking, stop accruing from unbondedAt date.
 */
function computeAccruedReward(
  amount: number,
  daysStaked: number,
  status: string
): number {
  if (amount <= 0 || daysStaked <= 0) return 0;
  if (status === "withdrawn") return 0;

  // Daily compound: (1 + r/365)^days - 1
  // r = 0.12 (12% APY)
  const dailyRate = APY_PERCENT / 365;
  const multiplier = Math.pow(1 + dailyRate, daysStaked);
  const earned = amount * (multiplier - 1);

  return Math.max(0, earned);
}
