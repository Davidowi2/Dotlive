/**
 * Staking Engine — moves DOT between wallet ledgers and tracks per-user stakes.
 *
 * V1 rules (minimal):
 *   - Fixed APY: 12% per year, pro-rated per second
 *   - Cooldown: 14 days before unstaking
 *   - Rewards: manual claim only (no auto-compound)
 *   - No slashing in V1
 *
 * Money flow invariants:
 *   1. All wallet balance mutations go through creditWallet/debitWallet by ledger.
 *   2. Stakes are the source of truth for active positions.
 *   3. Rewards must be claimed explicitly via claimRewards().
 */

import { eq, gte, and, sql as drizzleSql } from "drizzle-orm";
import { db } from "../db/client.js";
import { wallets, transactions, stakes } from "../db/schema.js";
import { creditWallet, debitWallet } from "./dot.js";
import { notify } from "./notify.js";

type TxRunner = Parameters<Parameters<typeof db.transaction>[0]>[0];

const COOLDOWN_DAYS = 14;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
const APY = 0.12; // 12% per year
const REWARDS_PER_SECOND = APY / 365 / 24 / 60 / 60; // ~3.8e-7 DOT per DOT staked

function computePendingRewards(stakedAmount: number, createdAt: Date): number {
  const elapsed = Date.now() - createdAt.getTime();
  return Math.floor(stakedAmount * REWARDS_PER_SECOND * elapsed * 100) / 100;
}

/**
 * Create a new stake: move DOT from `balance` to `stakedBalance`.
 */
export async function createStake(opts: {
  userId: string;
  targetType: "venture" | "gig";
  targetId: string;
  amount: number;
  metadata?: Record<string, any>;
}) {
  const { userId, targetType, targetId, amount, metadata = {} } = opts;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("createStake: amount must be > 0");
  }

  const row = await db.insert(stakes).values({
    userId,
    targetType,
    targetId,
    amount: String(amount),
    status: "active",
    metadata: JSON.stringify(metadata),
  } as any).returning();
  const stake = row[0];

  // Debit available balance, credit staked balance
  await debitWallet({
    userId,
    amount,
    type: "stake",
    description: `Staked ${amount} DOT on ${targetType} ${targetId}`,
  });

  await db.update(wallets).set({
    stakedBalance: drizzleSql`${wallets.stakedBalance} + ${amount}`,
    stakedLifetime: drizzleSql`${wallets.stakedLifetime} + ${amount}`,
    updatedAt: new Date(),
  } as any).where(eq(wallets.userId, userId));

  await db.insert(transactions).values({
    userId,
    amount: String(-amount),
    type: "stake",
    description: `Staked ${amount} DOT on ${targetType} ${targetId}`,
  } as any);

  return stake;
}

/**
 * Unstake: move DOT from `stakedBalance` back to `balance` after cooldown.
 */
export async function unstake(opts: { userId: string; stakeId: string }) {
  const { userId, stakeId } = opts;

  const [stake] = await db
    .select()
    .from(stakes)
    .where(and(eq(stakes.id, stakeId), eq(stakes.userId, userId), eq(stakes.status, "active")))
    .limit(1);

  if (!stake) throw new Error("Stake not found or not active");

  const cooldownEnds = new Date(stake.createdAt.getTime() + COOLDOWN_MS);
  if (Date.now() < cooldownEnds.getTime()) {
    throw new Error(`Cooldown active until ${cooldownEnds.toISOString()}`);
  }

  const amount = Number(stake.amount);

  await creditWallet({
    userId,
    amount,
    type: "unstake",
    description: `Unstaked ${amount} DOT (stake ${stake.id})`,
  });

  await db.update(wallets).set({
    stakedBalance: drizzleSql`${wallets.stakedBalance} - ${amount}`,
    updatedAt: new Date(),
  } as any).where(eq(wallets.userId, userId));

  await db.update(stakes).set({ status: "unstaked", updatedAt: new Date() } as any).where(eq(stakes.id, stakeId));

  await db.insert(transactions).values({
    userId,
    amount: String(amount),
    type: "unstake",
    description: `Unstaked ${amount} DOT (stake ${stake.id})`,
  } as any);

  try {
    notify({
      userId,
      type: "unstaked",
      title: `Unstaked ${amount} DOT`,
      body: `${amount} DOT returned to your available balance.`,
      link: "/wallet",
      icon: "Wallet",
    }).catch(() => {});
  } catch { /* best-effort */ }

  return { stakeId, amount };
}

/**
 * Claim pending rewards for a stake.
 */
export async function claimRewards(opts: { userId: string; stakeId: string }) {
  const { userId, stakeId } = opts;

  const [stake] = await db
    .select()
    .from(stakes)
    .where(and(eq(stakes.id, stakeId), eq(stakes.userId, userId), eq(stakes.status, "active")))
    .limit(1);

  if (!stake) throw new Error("Stake not found or not active");

  const pending = computePendingRewards(Number(stake.amount), stake.createdAt);
  if (pending <= 0) throw new Error("No rewards to claim yet");

  await creditWallet({
    userId,
    amount: pending,
    type: "reward",
    description: `Reward on stake ${stakeId}`,
  });

  await db.update(wallets).set({
    earnedLifetime: drizzleSql`${wallets.earnedLifetime} + ${pending}`,
    updatedAt: new Date(),
  } as any).where(eq(wallets.userId, userId));

  await db.update(stakes).set({
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any).where(eq(stakes.id, stakeId));

  await db.insert(transactions).values({
    userId,
    amount: String(pending),
    type: "reward",
    description: `Reward on stake ${stakeId}`,
  } as any);

  try {
    notify({
      userId,
      type: "reward_claimed",
      title: `Claimed ${pending} DOT`,
      body: `Reward from your stake on ${stake.targetType} ${stake.targetId}`,
      link: "/wallet",
      icon: "Zap",
    }).catch(() => {});
  } catch { /* best-effort */ }

  return { claimed: pending };
}

/**
 * Get all stakes for a user (optionally filter by targetType).
 */
export async function listStakes(userId: string, targetType?: string) {
  const where = targetType
    ? and(eq(stakes.userId, userId), eq(stakes.targetType, targetType))
    : eq(stakes.userId, userId);

  const rows = await db.select().from(stakes).where(where).orderBy(stakes.createdAt);
  return rows.map((s) => ({
    ...s,
    amount: Number(s.amount),
    pendingReward: s.status === "active" ? computePendingRewards(Number(s.amount), s.createdAt) : 0,
  }));
}
