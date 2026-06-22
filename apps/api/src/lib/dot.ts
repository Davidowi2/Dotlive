// @ts-nocheck
/**
 * DOT token logic.
 *
 * DOT is an internal accounting unit: 1 DOT = ₦10 (configurable).
 * The wallet balance is stored as a numeric(20,2) in Postgres.
 *
 * Money flow invariants:
 *   1. Every DOT movement goes through `creditWallet` or `debitWallet`.
 *   2. Each call writes a transaction row in the same statement.
 *   3. The wallet row's `updated_at` is refreshed.
 *   4. Debits check balance inside the same transaction.
 */

import { sql } from "../db/client.js";

/** Convert DOT to Naira (display only; actual settlement is in NGN). */
export function dotToNaira(dot: number | string): number {
  const n = typeof dot === "string" ? Number(dot) : dot;
  return Math.round(n * 10);
}

/** Convert Naira to DOT. */
export function nairaToDot(naira: number | string): number {
  const n = typeof naira === "string" ? Number(naira) : naira;
  return Math.round(n / 10);
}

/**
 * Credit a user's wallet by `amount` DOT, writing a transaction.
 * Idempotent via the optional `reference` — pass a unique
 * external ref (e.g. payment reference) to make retries safe.
 */
export async function creditWallet(opts: {
  userId: string;
  amount: number;
  type: string;
  description?: string;
  reference?: string;
}): Promise<{ balance: number }> {
  const { userId, amount, type, description, reference } = opts;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("creditWallet: amount must be > 0");
  }

  // Ensure wallet row exists.
  await sql`
    INSERT INTO wallets (user_id, balance) VALUES (${userId}, 0)
    ON CONFLICT (user_id) DO NOTHING
  `;

  // Idempotency check by reference.
  if (reference) {
    const dup = await sql`
      SELECT id FROM transactions
      WHERE user_id = ${userId} AND description = ${reference}
      LIMIT 1
    `;
    if (dup.length > 0) {
      const bal = await sql`SELECT balance FROM wallets WHERE user_id = ${userId}`;
      return { balance: Number(bal[0]?.balance ?? 0) };
    }
  }

  // Credit.
  await sql`
    UPDATE wallets
    SET balance = balance + ${amount}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  await sql`
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES (${userId}, ${amount}, ${type}, ${description ?? reference ?? null})
  `;
  const bal = await sql`SELECT balance FROM wallets WHERE user_id = ${userId}`;
  return { balance: Number(bal[0]?.balance ?? 0) };
}

/**
 * Debit a user's wallet by `amount` DOT. Throws if balance
 * is insufficient. Writes a transaction row.
 */
export async function debitWallet(opts: {
  userId: string;
  amount: number;
  type: string;
  description?: string;
}): Promise<{ balance: number }> {
  const { userId, amount, type, description } = opts;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("debitWallet: amount must be > 0");
  }

  const result = await sql`
    UPDATE wallets
    SET balance = balance - ${amount}, updated_at = NOW()
    WHERE user_id = ${userId} AND balance >= ${amount}
    RETURNING balance
  `;
  if (result.length === 0) {
    throw new Error("Insufficient balance");
  }
  await sql`
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES (${userId}, ${-amount}, ${type}, ${description ?? null})
  `;
  return { balance: Number(result[0].balance) };
}

/**
 * Transfer DOT from one user to another, atomically.
 * Throws on insufficient funds.
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

  // Ensure both wallets exist.
  await sql`INSERT INTO wallets (user_id, balance) VALUES (${toUserId}, 0) ON CONFLICT DO NOTHING`;

  // Debit first (fail-fast on insufficient funds).
  const debited = await sql`
    UPDATE wallets SET balance = balance - ${amount}, updated_at = NOW()
    WHERE user_id = ${fromUserId} AND balance >= ${amount}
    RETURNING balance
  `;
  if (debited.length === 0) throw new Error("Insufficient balance");

  // Credit receiver.
  await sql`
    UPDATE wallets SET balance = balance + ${amount}, updated_at = NOW()
    WHERE user_id = ${toUserId}
  `;

  const desc = description ?? `Transfer ${amount} DOT`;
  await sql`
    INSERT INTO transactions (user_id, amount, type, description)
    VALUES
      (${fromUserId}, ${-amount}, 'Transfer Out', ${desc}),
      (${toUserId},    ${amount},  'Transfer In',  ${desc})
  `;

  const fromBal = await sql`SELECT balance FROM wallets WHERE user_id = ${fromUserId}`;
  const toBal = await sql`SELECT balance FROM wallets WHERE user_id = ${toUserId}`;
  return {
    fromBalance: Number(fromBal[0].balance),
    toBalance: Number(toBal[0].balance),
  };
}
// @ts-nocheck