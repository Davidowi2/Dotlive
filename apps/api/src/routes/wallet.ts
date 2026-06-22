// @ts-nocheck
/**
 * Wallet routes: balance, transaction history, DOT transfers.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import { db } from "../db/client.js";
import { wallets, transactions } from "../db/schema.js";
import { transferDot } from "../lib/dot.js";

const transferSchema = z.object({
  toDotId: z.string().min(3),
  amount: z.number().int().positive().max(1_000_000),
  description: z.string().max(200).optional(),
});

export async function walletRoutes(app: FastifyInstance) {
  /** GET /api/wallet — balance */
  app.get("/wallet", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    let w = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
    if (w.length === 0) {
      await db.insert(wallets).values({ userId: sub, balance: "0" });
      w = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
    }
    return reply.send({ balance: Number(w[0].balance) });
  });

  /** GET /api/wallet/transactions — history */
  app.get("/wallet/transactions", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, sub))
      .orderBy(desc(transactions.createdAt))
      .limit(100);
    return reply.send({
      transactions: rows.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  });

  /** POST /api/wallet/transfer */
  app.post("/wallet/transfer", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = transferSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    // Look up recipient by dotId.
    const { users } = await import("../db/schema.js");
    const recipient = await db.select({ id: users.id }).from(users).where(eq(users.dotId, parsed.data.toDotId)).limit(1);
    if (recipient.length === 0) return reply.code(404).send({ error: "Recipient not found" });
    if (recipient[0].id === sub) return reply.code(400).send({ error: "Cannot transfer to self" });

    try {
      const result = await transferDot({
        fromUserId: sub,
        toUserId: recipient[0].id,
        amount: parsed.data.amount,
        description: parsed.data.description,
      });
      return reply.send(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transfer failed";
      if (msg === "Insufficient balance") return reply.code(402).send({ error: msg });
      return reply.code(500).send({ error: msg });
    }
  });
}
// @ts-nocheck