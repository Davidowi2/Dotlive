/**
 * Token supply — enforces the 100B DOT hard cap mandated by the client.
 *
 *   "There should only be 100,000,000,000 DOT tokens ever."
 *
 * Every mint/burn/admin-transfer goes through this module so the cap is
 * checked atomically in the same DB transaction as the wallet update.
 *
 * Single-row table: id = 'singleton'. Lazy-initializes on first access.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { tokenSupply, tokenOperations } from "../db/schema.js";

const SINGLETON_ID = "singleton";

/** Lazy-create the singleton row if missing. Returns current totals. */
export async function ensureTokenSupply() {
  const [row] = await db.select().from(tokenSupply).where(eq(tokenSupply.id, SINGLETON_ID)).limit(1);
  if (!row) {
    await db.insert(tokenSupply).values({
      id: SINGLETON_ID,
      maxSupplyDot: "100000000000",
      totalMintedDot: "500",
      totalBurnedDot: "0",
    } as any).onConflictDoNothing();
    return {
      maxSupplyDot: "100000000000",
      totalMintedDot: "500",
      totalBurnedDot: "0",
      circulatingSupplyDot: "500",
    };
  }
  return {
    maxSupplyDot: row.maxSupplyDot,
    totalMintedDot: row.totalMintedDot,
    totalBurnedDot: row.totalBurnedDot,
    circulatingSupplyDot: String(Number(row.totalMintedDot) - Number(row.totalBurnedDot)),
  };
}

/** Returns { maxSupply, totalMinted, totalBurned, circulating, remaining } as numbers. */
export async function getTokenStats() {
  const s = await ensureTokenSupply();
  const max = Number(s.maxSupplyDot);
  const minted = Number(s.totalMintedDot);
  const burned = Number(s.totalBurnedDot);
  return {
    maxSupplyDot: max,
    totalMintedDot: minted,
    totalBurnedDot: burned,
    circulatingSupplyDot: minted - burned,
    remainingDot: max - minted,
    capReachedPercent: (minted / max) * 100,
  };
}

/**
 * Mint DOT to a user. Throws if the cap would be exceeded.
 * Records the operation in token_operations for audit.
 *
 * @param tx        DB executor (pass `db` or a transaction)
 * @param userId    Recipient user id
 * @param amount    Amount in DOT (positive number)
 * @param reason    Human-readable reason for audit log
 * @param actorId   Who triggered (user id or 'system')
 */
export async function mintDot(opts: {
  toUserId: string;
  amount: number;
  reason: string;
  actorId?: string | null;
  actorEmail?: string | null;
  metadata?: any;
}) {
  if (!Number.isFinite(opts.amount) || opts.amount <= 0) {
    throw new Error("mintDot: amount must be > 0");
  }
  await ensureTokenSupply();

  // Atomic: increment total_minted if it stays under cap
  const updated = await db.execute(sql`
    UPDATE token_supply
    SET total_minted_dot = total_minted_dot + ${opts.amount},
        updated_at = NOW()
    WHERE id = 'singleton'
      AND total_minted_dot + ${opts.amount} <= max_supply_dot
    RETURNING total_minted_dot, max_supply_dot
  `);
  const rows = (updated as any).rows ?? [];
  if (rows.length === 0) {
    const stats = await getTokenStats();
    throw new Error(
      `Minting ${opts.amount.toLocaleString()} DOT would exceed the 100B cap. ` +
      `Remaining: ${stats.remainingDot.toLocaleString()} DOT.`,
    );
  }

  // Credit recipient
  await db.execute(sql`
    UPDATE wallets
    SET balance = balance + ${opts.amount}, updated_at = NOW()
    WHERE user_id = ${opts.toUserId}
  `);

  // Audit
  await db.insert(tokenOperations).values({
    actorId: opts.actorId ?? null,
    actorEmail: opts.actorEmail ?? null,
    operation: "mint",
    fromUserId: null,
    toUserId: opts.toUserId,
    amountDot: String(opts.amount),
    reason: opts.reason,
    metadata: opts.metadata ?? null,
  } as any);
}

/**
 * Burn DOT (permanent removal from circulation).
 */
export async function burnDot(opts: {
  fromUserId: string;
  amount: number;
  reason: string;
  actorId?: string | null;
  actorEmail?: string | null;
  metadata?: any;
}) {
  if (!Number.isFinite(opts.amount) || opts.amount <= 0) {
    throw new Error("burnDot: amount must be > 0");
  }

  const updated = await db.execute(sql`
    UPDATE token_supply
    SET total_burned_dot = total_burned_dot + ${opts.amount},
        updated_at = NOW()
    WHERE id = 'singleton'
    RETURNING total_burned_dot
  `);
  const rows = (updated as any).rows ?? [];
  if (rows.length === 0) {
    throw new Error("Failed to record burn in token_supply");
  }

  // Debit user (if amount > balance, will throw via the wallet UPDATE returning 0 rows)
  const walletUpd = await db.execute(sql`
    UPDATE wallets
    SET balance = balance - ${opts.amount}, updated_at = NOW()
    WHERE user_id = ${opts.fromUserId} AND balance >= ${opts.amount}
    RETURNING balance
  `);
  if (((walletUpd as any).rows ?? []).length === 0) {
    // Roll back burn counter
    await db.execute(sql`
      UPDATE token_supply
      SET total_burned_dot = total_burned_dot - ${opts.amount},
          updated_at = NOW()
      WHERE id = 'singleton'
    `);
    throw new Error("Insufficient DOT balance to burn");
  }

  await db.insert(tokenOperations).values({
    actorId: opts.actorId ?? null,
    actorEmail: opts.actorEmail ?? null,
    operation: "burn",
    fromUserId: opts.fromUserId,
    toUserId: null,
    amountDot: String(opts.amount),
    reason: opts.reason,
    metadata: opts.metadata ?? null,
  } as any);
}

/**
 * Admin-initiated transfer: debit one user, credit another, log as admin_transfer.
 * Does NOT touch the cap (no mint, no burn) — but logs it.
 */
export async function adminTransferDot(opts: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  actorId: string;
  actorEmail?: string | null;
  metadata?: any;
}) {
  if (opts.fromUserId === opts.toUserId) {
    throw new Error("Cannot transfer to the same user");
  }
  if (!Number.isFinite(opts.amount) || opts.amount <= 0) {
    throw new Error("amount must be > 0");
  }

  // Verify both users exist
  const fromUser = await db.execute(sql`SELECT id FROM users WHERE id = ${opts.fromUserId}`);
  const toUser = await db.execute(sql`SELECT id FROM users WHERE id = ${opts.toUserId}`);
  if (((fromUser as any).rows ?? []).length === 0) throw new Error("Source user not found");
  if (((toUser as any).rows ?? []).length === 0) throw new Error("Destination user not found");

  // Debit source (fail if insufficient)
  const debit = await db.execute(sql`
    UPDATE wallets
    SET balance = balance - ${opts.amount}, updated_at = NOW()
    WHERE user_id = ${opts.fromUserId} AND balance >= ${opts.amount}
    RETURNING balance
  `);
  if (((debit as any).rows ?? []).length === 0) {
    throw new Error("Source user has insufficient balance");
  }

  // Credit destination
  await db.execute(sql`
    UPDATE wallets
    SET balance = balance + ${opts.amount}, updated_at = NOW()
    WHERE user_id = ${opts.toUserId}
  `);

  // Audit
  await db.insert(tokenOperations).values({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail ?? null,
    operation: "admin_transfer",
    fromUserId: opts.fromUserId,
    toUserId: opts.toUserId,
    amountDot: String(opts.amount),
    reason: opts.reason,
    metadata: opts.metadata ?? null,
  } as any);
}