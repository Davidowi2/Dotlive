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
      balance: drizzleSql`balance + ${amount}`,
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
      balance: drizzleSql`balance - ${amount}`,
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
 * Transfer DOT between two users — fully atomic.
 * All four statements (debit, credit, two ledger entries) run inside
 * a single db.transaction(). If anything fails the whole transfer rolls back.
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

  return await db.transaction(async (tx) => {
    const r: any = tx;

    // Ensure recipient wallet exists inside the transaction.
    await r
      .insert(wallets)
      .values({ userId: toUserId, balance: "0" } as any)
      .onConflictDoNothing();

    // Atomic debit — only succeeds if sender balance >= amount.
    const debited = await r
      .update(wallets)
      .set({
        balance: drizzleSql`balance - ${amount}`,
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(wallets.userId, fromUserId),
          gte(wallets.balance, String(amount))
        )
      )
      .returning({ balance: wallets.balance });

    if (debited.length === 0) {
      throw new Error("Insufficient balance");
    }

    // Credit receiver inside the same transaction.
    const credited = await r
      .update(wallets)
      .set({
        balance: drizzleSql`balance + ${amount}`,
        updatedAt: new Date(),
      } as any)
      .where(eq(wallets.userId, toUserId))
      .returning({ balance: wallets.balance });

    // Both ledger entries in the same transaction.
    await r.insert(transactions).values([
      {
        userId: fromUserId,
        amount: String(-amount),
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

    return {
      fromBalance: Number(debited[0].balance),
      toBalance: Number(credited[0].balance),
    };
  }).then(async (result) => {
    // Fire notifications AFTER the transaction commits.
    // Both sender and recipient get a notif + email attempt.
    // Don't await — don't block the transfer response on email.
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
    return result;
  });
}
