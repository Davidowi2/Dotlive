import { db } from "../db/client.js";
import { serviceOrders, wallets, transactions } from "../db/schema.js";
import { eq, and, lte, sql } from "drizzle-orm";

export async function autoReleaseOrders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stale = await db
    .select()
    .from(serviceOrders)
    .where(
      and(
        eq(serviceOrders.status, "delivered"),
        lte(serviceOrders.updatedAt, sevenDaysAgo),
        eq(serviceOrders.status, "delivered"),
      ),
    );

  for (const order of stale) {
    await db.transaction(async (tx) => {
      await tx
        .update(wallets)
        .set({ lockedBalance: sql`lockedBalance - ${order.amountDot}` })
        .where(eq(wallets.userId, order.clientId));

      await tx
        .update(wallets)
        .set({
          balance: sql`balance + ${order.amountDot}`,
          earnedLifetime: sql`earnedLifetime + ${order.amountDot}`,
        })
        .where(eq(wallets.userId, order.builderId));

      await tx
        .update(serviceOrders)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(serviceOrders.id, order.id));

      await tx.insert(transactions).values({
        userId: order.builderId,
        amount: order.amountDot,
        type: "auto_release",
        description: `Auto-released for order ${order.id}`,
      });
    });
  }

  return stale.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  autoReleaseOrders().then((n) => console.log(`Released ${n} orders`));
}
