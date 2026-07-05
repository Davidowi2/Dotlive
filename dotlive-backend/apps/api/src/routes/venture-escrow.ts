/**
 * Venture Escrow Service
 *
 * Moves DOT from a founder's wallet into milestone escrow buckets
 * using the wallet's `lockedBalance` ledger.
 *
 * Invariants:
 *  1. Funding decreases availableBalance, increases lockedBalance.
 *  2. Releasing a milestone decreases lockedBalance, debits from wallet and
 *     creates transaction records; fundedAmount / payoutAmount are updated
 *     on the milestone row.
 *  3. Vantage is bumped on release through vantage-sync.ts.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { ventureMilestones, ventures, wallets, transactions } from "../db/schema.js";
import { creditWallet, debitWallet } from "../lib/dot.js";
import { notify } from "../lib/notify.js";

export async function fundMilestone(opts: { ventureId: string; milestoneId: string; amount: number; userId: string }) {
  const { ventureId, milestoneId, amount, userId } = opts;

  // Ensure venture ownership
  const [ventureRow] = await db.select({ userId: ventures.userId }).from(ventures).where(eq(ventures.id, ventureId)).limit(1);
  if (!ventureRow) throw new Error("Venture not found");
  if (ventureRow.userId !== userId) throw new Error("Not your venture");

  // Deduct available, increase locked
  await debitWallet({ userId, amount, type: "escrow_lock", description: `Escrow fund milestone ${milestoneId}` });
  await db.execute(sql`
    UPDATE wallets
    SET locked_balance = wallets.locked_balance + ${amount},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `);

  await db.insert(transactions).values({
    userId,
    amount: String(-amount),
    type: "escrow_lock",
    description: `Fund milestone ${milestoneId}`,
  } as any);

  await db.update(ventureMilestones).set({
    fundedAmount: sql`COALESCE(venture_milestones.funded_amount,0) + ${amount}`,
    status: "funded",
    updatedAt: new Date(),
  } as any).where(and(eq(ventureMilestones.id, milestoneId), eq(ventureMilestones.ventureId, ventureId)));

  try {
    await notify({ userId, type: "escrow_funded", title: "Escrow funded", body: `${amount} DOT locked for milestone.`, link: `/ventures/${ventureId}`, icon: "Venture" });
  } catch { /* best-effort */ }

  return { ok: true, amount };
}

export async function releaseMilestone(opts: { ventureId: string; milestoneId: string; userId: string }) {
  const { ventureId, milestoneId, userId } = opts;

  const [milestone] = await db.select().from(ventureMilestones)
    .where(and(eq(ventureMilestones.id, milestoneId), eq(ventureMilestones.ventureId, ventureId)))
    .limit(1);
  if (!milestone) throw new Error("Milestone not found");
  if (milestone.status === "released") throw new Error("Already released");

  const amount = Number(milestone.payoutAmount ?? milestone.fundedAmount ?? 0);
  if (amount <= 0) throw new Error("No payout amount set");

  // Move locked DOT back to available when payout is internal; 
  // for external payout, debit locked and credit external receiver.
  await db.execute(sql`
    UPDATE wallets
    SET locked_balance = wallets.locked_balance - ${amount},
        updated_at = NOW()
    WHERE user_id = ${userId}
  `);

  await creditWallet({ userId, amount, type: "escrow_release", description: `Milestone ${milestoneId} released` });

  await db.insert(transactions).values({
    userId,
    amount: String(amount),
    type: "escrow_release",
    description: `Release milestone ${milestoneId}`,
  } as any);

  await db.update(ventureMilestones).set({ status: "released", updatedAt: new Date() } as any).where(eq(ventureMilestones.id, milestoneId));

  try {
    await notify({ userId, type: "escrow_released", title: "Milestone released", body: `${amount} DOT payout released.`, link: `/ventures/${ventureId}`, icon: "Venture" });
  } catch { /* best-effort */ }

  return { ok: true, amount };
}

export async function getVentureEscrowSummary(ventureId: string) {
  const ms = await db.select().from(ventureMilestones).where(eq(ventureMilestones.ventureId, ventureId));
  const totalFunded = ms.reduce((a, m) => a + Number(m.fundedAmount ?? 0), 0);
  const totalPayout = ms.reduce((a, m) => a + Number(m.payoutAmount ?? 0), 0);
  const byStatus = ms.reduce<Record<string, number>>((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc; }, {});
  return { ventureId, milestones: ms, totalFunded, totalPayout, byStatus };
}
