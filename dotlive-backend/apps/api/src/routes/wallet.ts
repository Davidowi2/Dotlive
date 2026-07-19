/**
 * Wallet routes: balance, transaction history, DOT transfers.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import { db } from "../db/client.js";
import { wallets, transactions, userRoles, roleRequirements } from "../db/schema.js";
import { transferDot, debitWallet, creditWallet } from "../lib/dot.js";

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
      await db.insert(wallets).values({ userId: sub, balance: "0", stakedBalance: "0", lockedBalance: "0", earnedLifetime: "0", burnedLifetime: "0", stakedLifetime: "0", redeemedLifetime: "0" } as any);
      w = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
    }
    return reply.send({
      balance: Number(w[0].balance),
      stakedBalance: Number(w[0].stakedBalance),
      lockedBalance: Number(w[0].lockedBalance),
      earnedLifetime: Number(w[0].earnedLifetime),
      burnedLifetime: Number(w[0].burnedLifetime),
      stakedLifetime: Number(w[0].stakedLifetime),
      redeemedLifetime: Number(w[0].redeemedLifetime),
    });
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
  app.post("/wallet/transfer", {
    preHandler: app.authenticate,
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (req, reply) => {
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

      // Fire notifications for both parties (email goes to recipient only).
      try {
        const { notify } = await import("../lib/notify.js");
        const amountStr = `${parsed.data.amount} DOT`;
        // Sender: in-app only
        notify({
          userId: sub,
          type: "transfer_sent",
          title: `You sent ${amountStr}`,
          body: parsed.data.description ?? `Transfer to ${parsed.data.toDotId} complete.`,
          link: "/wallet",
          icon: "Send",
        }).catch(() => {});
        // Recipient: in-app + email
        notify({
          userId: recipient[0].id,
          type: "transfer_received",
          title: `You received ${amountStr}`,
          body: `From another DOT user${parsed.data.description ? ` — "${parsed.data.description}"` : ""}. Your wallet has been credited.`,
          link: "/wallet",
          icon: "Wallet",
          sendEmail: true,
        }).catch(() => {});
      } catch {
        // Notifications are best-effort
      }

      return reply.send(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transfer failed";
      if (msg === "Insufficient balance") return reply.code(402).send({ error: msg });
      return reply.code(500).send({ error: msg });
    }
  });

  /** POST /api/wallet/spend — generic DOT debit */
  app.post("/wallet/spend", { preHandler: app.authenticate, config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const schema = z.object({
      amount: z.number().int().positive().max(1_000_000),
      description: z.string().min(1).max(200),
      type: z.string().min(1).max(50).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    try {
      const result = await debitWallet({
        userId: sub,
        amount: parsed.data.amount,
        type: parsed.data.type ?? "Spend",
        description: parsed.data.description,
      });
      return reply.send(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Spend failed";
      if (msg === "Insufficient balance") return reply.code(402).send({ error: msg });
      return reply.code(500).send({ error: msg });
    }
  });

  /** GET /api/wallet/role-upgrade-options */
  app.get("/wallet/role-upgrade-options", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    const [walletRow] = await db.select().from(wallets).where(eq(wallets.userId, sub)).limit(1);
    const balance = Number(walletRow?.balance ?? 0);

    const requirements = await db.select().from(roleRequirements).where(eq(roleRequirements.isActive, true));
    const owned = await db.select().from(userRoles).where(eq(userRoles.userId, sub));

    const ownedRoles = new Set(owned.map((r) => r.role));
    const options = requirements.map((req) => ({
      role: req.role,
      title: req.title,
      cost: Number(req.dotCost ?? 0),
      canAfford: balance >= Number(req.dotCost ?? 0),
      hasRole: ownedRoles.has(req.role),
    }));

    return reply.send({ options });
  });

  /** GET /api/wallet/role-renewal-status */
  app.get("/wallet/role-renewal-status", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    const owned = await db.select().from(userRoles).where(eq(userRoles.userId, sub));
    const statuses = owned.map((r) => ({
      role: r.role,
      hasRenewalTracking: false,
    }));

    return reply.send({ statuses });
  });

}

// @ts-nocheck
