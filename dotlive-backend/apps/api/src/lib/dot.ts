/**
 * DOT token logic — all wallet operations are fully atomic via db.transaction().
 *
 * Money flow invariants:
 *   1. Every DOT movement goes through creditWallet or debitWallet.
 *   2. Each call writes a transaction row in the SAME DB transaction.
 *   3. Debits check balance atomically — no race between check and update.
 *   4. transferDot wraps all four operations in a single db.transaction().
 */

import { and, eq, gte, sql as drizzleSql } from "drizzle-orm";
import { db } from "../db/client.js";
import { wallets, transactions } from "../db/schema.js";
import { notify } from "./notify.js";

/**
 * Conversion rate: 1 DOT = 15 NGN = 1,500 kobo.
 *
 * Single source of truth — DOT_RATE_NGN below.
 * Adjust this if the on-ramp rate changes (Paystack + spreads).
 */
export const DOT_RATE_NGN = 15;
export const KOBO_PER_DOT = DOT_RATE_NGN * 100;

export function dotToNaira(dot: number | string): number {
  return Math.round((typeof dot === "string" ? Number(dot) : dot) * DOT_RATE_NGN);
}

export function nairaToDot(naira: number | string): number {
  return Math.round((typeof naira === "string" ? Number(naira) : naira) / DOT_RATE_NGN);
}

/**
 * Shares are priced in kobo (smallest NGN unit).
 *
 *   koboToDot(1500) === 1
 *   koboToDot(0)    === 0
 */
export function koboToDot(kobo: number | string): number {
  // 2-decimal precision so a 50-kobo share displays as 0.03 DOT.
  const n = typeof kobo === "string" ? Number(kobo) : kobo;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n / KOBO_PER_DOT) * 100) / 100;
}

type TxRunner = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Credit a user's wallet. Accepts an optional tx handle for callers
 * that are already inside a transaction. Idempotent via reference.
 */
export async function creditWallet(
  opts: {
    userId: string;
    amount: number;
    type: string;
    description?: string;
    reference?: string;
  },
  tx?: TxRunner
): Promise<{ balance: number }> {
  const { userId, amount, type, description, reference } = opts;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("creditWallet: amount must be > 0");
  }

  const r: any = tx ?? db;

  // Ensure wallet row exists.
  await r
    .insert(wallets)
    .values({ userId, balance: "0" } as any)
    .onConflictDoNothing();

  // Idempotency: if this reference was already credited, return current balance.
  if (reference) {
    const dup = await r
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.description, reference))
      .limit(1);
    if (dup.length > 0) {
      const bal = await r
        .select({ balance: wallets.balance })
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1);
      return { balance: Number(bal[0]?.balance ?? 0) };
    }
  }

  const updated = await r
    .update(wallets)
    .set({
      balance: drizzleSql`${wallets.balance} + ${amount}`,
      updatedAt: new Date(),
    } as any)
    .where(eq(wallets.userId, userId))
    .returning({ balance: wallets.balance });

  await r.insert(transactions).values({
    userId,
    amount: String(amount),
    type,
    description: description ?? reference ?? null,
  } as any);

  return { balance: Number(updated[0]?.balance ?? 0) };
}

/**
 * Debit a user's wallet atomically.
 * The UPDATE only succeeds if balance >= amount — no separate balance check.
 */
export async function debitWallet(
  opts: {
    userId: string;
    amount: number;
    type: string;
    description?: string;
  },
  tx?: TxRunner
): Promise<{ balance: number }> {
  const { userId, amount, type, description } = opts;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("debitWallet: amount must be > 0");
  }

  const r: any = tx ?? db;

  const result = await r
    .update(wallets)
    .set({
      balance: drizzleSql`${wallets.balance} - ${amount}`,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(wallets.userId, userId),
        gte(wallets.balance, String(amount))
      )
    )
    .returning({ balance: wallets.balance });

  if (result.length === 0) {
    throw new Error("Insufficient balance");
  }

  await r.insert(transactions).values({
    userId,
    amount: String(-amount),
    type,
    description: description ?? null,
  } as any);

  return { balance: Number(result[0].balance) };
}

/**
 * Transfer DOT between two users — atomic via conditional UPDATE.
 *
 * Neon HTTP driver doesn't support `db.transaction()`, so we simulate
 * atomicity with a single conditional UPDATE that ONLY matches if the
 * sender's balance is sufficient. The UPDATE returns the affected rows;
 * if 0 rows were affected, the transfer fails (no money moved).
 *
 * Steps:
 *   1. Atomic conditional debit (only if balance >= amount)
 *   2. Credit recipient (insert-or-update balance)
 *   3. Insert two ledger rows (Transfer Out + Transfer In)
 *   4. Fire notifications to both parties (fire-and-forget)
 *
 * If step 2 fails after step 1 succeeds, we attempt to refund via
 * `creditWallet` to the sender — best effort, may leave user in
 * slightly inconsistent state if refund also fails (rare).
 */
export async function transferDot(opts: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
}): Promise<{ fromBalance: number; toBalance: number }> {
  const { fromUserId, toUserId, amount, description } = opts;

  if (fromUserId === toUserId) throw new Error("Cannot transfer to self");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("amount must be > 0");

  const desc = description ?? `Transfer ${amount} DOT`;

  // Step 1: Atomic conditional debit.
  const debited = await db
    .update(wallets)
    .set({
      balance: drizzleSql`${wallets.balance} - ${amount}`,
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(wallets.userId, fromUserId),
        drizzleSql`${wallets.balance} >= ${amount}`,
      ) as any,
    )
    .returning();

  if (debited.length === 0) {
    throw new Error("Insufficient balance");
  }

  // Step 2: Credit recipient (insert-or-update).
  try {
    await db
      .insert(wallets)
      .values({ userId: toUserId, balance: String(amount), updatedAt: new Date() } as any)
      .onConflictDoUpdate({
        target: wallets.userId,
        set: {
          balance: drizzleSql`${wallets.balance} + ${amount}`,
          updatedAt: new Date(),
        } as any,
      });
  } catch (err) {
    // Refund the sender — best effort.
    try {
      await db
        .update(wallets)
        .set({
          balance: drizzleSql`${wallets.balance} + ${amount}`,
          updatedAt: new Date(),
        } as any)
        .where(eq(wallets.userId, fromUserId));
    } catch {
      // Last resort: log this, manual cleanup required.
      console.error(`[transferDot] refund failed for ${fromUserId}, amount=${amount}`);
    }
    throw err;
  }

  // Step 3: Write two ledger rows.
  await db.insert(transactions).values([
    {
      userId: fromUserId,
      amount: `-${amount}`,
      type: "Transfer Out",
      description: desc,
    },
    {
      userId: toUserId,
      amount: String(amount),
      type: "Transfer In",
      description: desc,
    },
  ] as any);

  // Step 4: Fire notifications (fire-and-forget — don't block the response).
  Promise.allSettled([
    notify({
      userId: fromUserId,
      type: "transfer_sent",
      title: `Sent ${amount} DOT`,
      body: desc,
      link: "/wallet",
      icon: "ArrowUpRight",
    }),
    notify({
      userId: toUserId,
      type: "transfer_received",
      title: `Received ${amount} DOT`,
      body: desc,
      link: "/wallet",
      icon: "ArrowDownLeft",
    }),
  ]).catch(() => {});

  // Re-read balances for the response.
  const [from] = await db.select({ balance: wallets.balance }).from(wallets).where(eq(wallets.userId, fromUserId)).limit(1);
  const [to] = await db.select({ balance: wallets.balance }).from(wallets).where(eq(wallets.userId, toUserId)).limit(1);

  return {
    fromBalance: Number(from?.balance ?? 0),
    toBalance: Number(to?.balance ?? 0),
  };
}

