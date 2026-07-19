/**
 * Retroactive 500 DOT starter grant migration.
 *
 * Credits 500 DOT to users who don't already have a welcome-bonus transaction.
 * Idempotent: safe to run multiple times.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx src/db/migrations/credit-500-dot.ts
 */

import { db } from "../db/client.js";
import { users, wallets, transactions, tokenSupply } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";

const WELCOME_DESCRIPTIONS = [
  "Welcome bonus — 500 DOT starter grant",
  "Welcome bonus - retroactive",
  "Welcome bonus for ",
];

function hasWelcomeTransaction(email?: string | null): boolean {
  if (!email) return false;
  const emailPrefix = `Welcome bonus for ${email}`;
  return WELCOME_DESCRIPTIONS.some((d) =>
    d.endsWith(" ") ? emailPrefix.startsWith(d) : true,
  );
}

async function main() {
  // Get all users
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  console.log(`[migration] Total users: ${allUsers.length}`);

  // Find users without a welcome-bonus transaction
  const usersWithoutBonus: { id: string; email: string | null }[] = [];
  for (const user of allUsers) {
    const existing = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(200);

    const hasBonus = existing.some((t) => {
      const desc = t.description ?? "";
      return (
        desc === "Welcome bonus — 500 DOT starter grant" ||
        desc === "Welcome bonus - retroactive" ||
        desc.startsWith("Welcome bonus for ") ||
        desc.startsWith("Welcome bonus - referred by ")
      );
    });

    if (!hasBonus) {
      usersWithoutBonus.push(user);
    }
  }

  console.log(`[migration] Users missing welcome bonus: ${usersWithoutBonus.length}`);

  if (usersWithoutBonus.length === 0) {
    console.log("[migration] Nothing to do. Exiting.");
    return;
  }

  // Credit each user
  for (const user of usersWithoutBonus) {
    // Ensure wallet exists
    await db
      .insert(wallets)
      .values({ userId: user.id, balance: "0", stakedBalance: "0", lockedBalance: "0", earnedLifetime: "0", burnedLifetime: "0", stakedLifetime: "0", redeemedLifetime: "0" } as any)
      .onConflictDoNothing();

    // Credit 500 DOT
    await db.execute(sql`
      UPDATE wallets
      SET balance = balance + 500, updated_at = NOW()
      WHERE user_id = ${user.id}
    `);

    // Log transaction
    await db.insert(transactions).values({
      userId: user.id,
      amount: "500",
      type: "Starter Grant",
      description: "Welcome bonus - retroactive",
    } as any);

    console.log(`[migration] Credited 500 DOT to ${user.id}${user.email ? ` (${user.email})` : ""}`);
  }

  // Update token supply total_minted_dot
  const totalCredited = usersWithoutBonus.length * 500;
  const updated = await db.execute(sql`
    UPDATE token_supply
    SET total_minted_dot = total_minted_dot + ${totalCredited}, updated_at = NOW()
    WHERE id = 'singleton'
    RETURNING total_minted_dot
  `);
  const rows = (updated as any).rows ?? [];
  const newTotal = rows[0]?.total_minted_dot ?? "unknown";
  console.log(`[migration] Updated token_supply.total_minted_dot to ${newTotal} (+${totalCredited})`);
  console.log("[migration] Done.");
}

main().catch((err) => {
  console.error("[migration] Failed:", err);
  process.exit(1);
});
