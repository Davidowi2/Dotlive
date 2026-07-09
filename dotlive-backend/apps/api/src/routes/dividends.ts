/**
 * Dividends routes — dividend distribution system.
 *
 * GET  /api/dividends                  — list all dividends
 * GET  /api/dividends/venture/:id      — dividends for a venture
 * GET  /api/dividends/my               — dividends earned by current user
 * POST /api/dividends                  — declare dividend (venture owner only)
 * POST /api/dividends/:id/pay          — mark as paid (simulate payment)
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { dividends, dividendPayments, investments, users, ventures } from "../db/schema.js";
import { creditWallet, koboToDot } from "../lib/dot.js";
import { notify } from "../lib/notify.js";

const declareSchema = z.object({
  ventureId: z.string().uuid(),
  amountNaira: z.number().int().min(100000), // Minimum ₦1,000 (100,000 kobo)
  period: z.string().min(1), // e.g., "Q1 2026"
});

export async function dividendsRoutes(app: FastifyInstance) {
  /** GET /api/dividends — list all dividends */
  app.get("/dividends", { preHandler: app.authenticate }, async (req, reply) => {
    const rows = await db
      .select({
        id: dividends.id,
        ventureId: dividends.ventureId,
        ventureName: ventures.name,
        declaredBy: dividends.declaredBy,
        declaredByName: users.name,
        amountNaira: dividends.amountNaira,
        perShareAmount: dividends.perShareAmount,
        period: dividends.period,
        status: dividends.status,
        createdAt: dividends.createdAt,
        paidAt: dividends.paidAt,
      })
      .from(dividends)
      .leftJoin(ventures, eq(ventures.id, dividends.ventureId))
      .leftJoin(users, eq(users.id, dividends.declaredBy))
      .orderBy(desc(dividends.createdAt));

    return reply.send({ dividends: rows });
  });

  /** GET /api/dividends/venture/:id — dividends for a specific venture */
  app.get("/dividends/venture/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const rows = await db
      .select({
        id: dividends.id,
        ventureId: dividends.ventureId,
        ventureName: ventures.name,
        declaredBy: dividends.declaredBy,
        declaredByName: users.name,
        amountNaira: dividends.amountNaira,
        perShareAmount: dividends.perShareAmount,
        period: dividends.period,
        status: dividends.status,
        createdAt: dividends.createdAt,
        paidAt: dividends.paidAt,
      })
      .from(dividends)
      .leftJoin(ventures, eq(ventures.id, dividends.ventureId))
      .leftJoin(users, eq(users.id, dividends.declaredBy))
      .where(eq(dividends.ventureId, id))
      .orderBy(desc(dividends.createdAt));

    return reply.send({ dividends: rows });
  });

  /** GET /api/dividends/my — dividends earned by current user */
  app.get("/dividends/my", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    const payments = await db
      .select({
        id: dividendPayments.id,
        dividendId: dividendPayments.dividendId,
        investorId: dividendPayments.investorId,
        sharesOwned: dividendPayments.sharesOwned,
        amountNaira: dividendPayments.amountNaira,
        status: dividendPayments.status,
        createdAt: dividendPayments.createdAt,
        paidAt: dividendPayments.paidAt,
        // Dividend details
        period: dividends.period,
        ventureId: dividends.ventureId,
        ventureName: ventures.name,
      })
      .from(dividendPayments)
      .leftJoin(dividends, eq(dividends.id, dividendPayments.dividendId))
      .leftJoin(ventures, eq(ventures.id, dividends.ventureId))
      .where(eq(dividendPayments.investorId, sub))
      .orderBy(desc(dividendPayments.createdAt));

    const totalEarnedNaira = payments.reduce((sum, p) => sum + (p.status === "paid" ? Number(p.amountNaira) : 0), 0);
    const totalPendingNaira = payments.reduce((sum, p) => sum + (p.status === "pending" ? Number(p.amountNaira) : 0), 0);

    return reply.send({
      payments,
      totalEarnedNaira,
      totalPendingNaira,
    });
  });

  /** POST /api/dividends — declare a new dividend (venture owner only) */
  app.post("/dividends", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = declareSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { ventureId, amountNaira, period } = parsed.data;

    // Verify the venture belongs to this founder
    const [venture] = await db.select().from(ventures).where(eq(ventures.id, ventureId));
    if (!venture) {
      return reply.code(404).send({ error: "Venture not found" });
    }
    if (venture.userId !== sub) {
      return reply.code(403).send({ error: "You don't own this venture" });
    }

    // Get total shares outstanding for this venture
    const [totalSharesRow] = await db
      .select({ total: sql<number>`sum(shares)::int` })
      .from(investments)
      .where(and(eq(investments.founderId, sub), eq(investments.status, "confirmed")));

    const totalShares = Number(totalSharesRow?.total ?? 0);
    if (totalShares === 0) {
      return reply.code(400).send({ error: "No shares outstanding for this venture" });
    }

    // Calculate per-share amount (in kobo)
    const perShareAmount = Math.floor(amountNaira / totalShares);

    const id = crypto.randomUUID();
    await db.insert(dividends).values({
      ventureId,
      declaredBy: sub,
      amountNaira,
      perShareAmount,
      period,
      status: "declared",
      createdAt: new Date(),
    } as any);

    // Create dividend payments for each investor
    const investorRows = await db
      .select({
        investorId: investments.investorId,
        investmentId: investments.id,
        shares: investments.shares,
      })
      .from(investments)
      .where(and(eq(investments.founderId, sub), eq(investments.status, "confirmed")));

    const paymentValues = investorRows.map((inv) => ({
      dividendId: id,
      investorId: inv.investorId,
      investmentId: inv.investmentId,
      sharesOwned: inv.shares,
      amountNaira: inv.shares * perShareAmount,
      status: "pending" as const,
      createdAt: new Date(),
    }));

    if (paymentValues.length > 0) {
      await db.insert(dividendPayments).values(paymentValues as any);
    }

    // Notify investors
    Promise.allSettled(
      investorRows.map((inv) =>
        notify({
          userId: inv.investorId,
          type: "system",
          title: `Dividend declared for ${venture.name}`,
          body: `${period}: You'll receive ₦${Math.round((inv.shares * perShareAmount) / 100)} for your ${inv.shares} shares`,
          link: "/portfolio",
          icon: "Coins",
        })
      )
    ).catch(() => {});

    return reply.status(201).send({
      ok: true,
      dividend: {
        id,
        ventureId,
        amountNaira,
        perShareAmount,
        period,
        totalShares,
        investorCount: investorRows.length,
      },
    });
  });

  /** POST /api/dividends/:id/pay — mark dividend as paid (simulate payment) */
  app.post("/dividends/:id/pay", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    // Verify the dividend exists and user owns the venture
    const [dividend] = await db
      .select()
      .from(dividends)
      .leftJoin(ventures, eq(ventures.id, dividends.ventureId))
      .where(eq(dividends.id, id));

    if (!dividend) {
      return reply.code(404).send({ error: "Dividend not found" });
    }

    // Check if user owns the venture
    const ventureData = dividend as any;
    if (ventureData.ventures?.userId !== sub) {
      return reply.code(403).send({ error: "Only the venture owner can mark dividends as paid" });
    }

    if (dividend.dividends.status !== "declared") {
      return reply.code(400).send({ error: "Dividend is not in declared status" });
    }

    // Get all pending payments for this dividend
    const payments = await db
      .select()
      .from(dividendPayments)
      .where(and(eq(dividendPayments.dividendId, id), eq(dividendPayments.status, "pending")));

    // Credit each investor's wallet
    let paidCount = 0;
    let failedCount = 0;

    for (const payment of payments) {
      try {
        const amountDot = koboToDot(Number(payment.amountNaira));
        await creditWallet({
          userId: payment.investorId,
          amount: amountDot,
          type: "dividend_received",
          description: `Dividend payment: ${dividend.dividends.period}`,
        });

        // Mark payment as paid
        await db.execute(
          sql`UPDATE dividend_payments SET status = 'paid', paid_at = NOW() WHERE id = ${payment.id}`
        );

        paidCount++;
      } catch (err) {
        // Mark payment as failed
        await db.execute(
          sql`UPDATE dividend_payments SET status = 'failed' WHERE id = ${payment.id}`
        );

        failedCount++;
      }
    }

    // Mark dividend as paid
    await db.execute(
      sql`UPDATE dividends SET status = 'paid', paid_at = NOW() WHERE id = ${id}`
    );

    return reply.send({
      ok: true,
      paid: paidCount,
      failed: failedCount,
      total: payments.length,
    });
  });
}
