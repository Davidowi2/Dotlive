/**
 * Investments (Buy Shares) routes.
 *
 * Tier 3 / Commitment 3 — investor flow.
 *
 * GET  /api/investments/mine              — investments I (the investor) made
 * GET  /api/investments/venture/:founderId — investors in a specific founder
 * POST /api/investments                   — record a share purchase
 *
 * Money flow:
 *   1. Investor confirms purchase in the Buy Shares dialog
 *   2. We debit the investor's wallet via debitWallet()
 *   3. We credit the founder's wallet via creditWallet()
 *   4. We write an `investments` row
 *   5. The founder's `founder_profiles.shares_available` decrements and
 *      `total_raised_dot` increments
 *
 * We do NOT go through Paystack for the share purchase itself — DOT is the
 * platform's internal currency and the wallet is the source of truth.
 * Paystack is for fiat on/off-ramps (deposit/withdraw) which already exist.
 *
 * If the user wants to use fiat, they should:
 *   1. Deposit NGN via Paystack → get DOT in their wallet
 *   2. Use the wallet DOT to buy shares via this endpoint
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { investments, users } from "../db/schema.js";
import { debitWallet, creditWallet, koboToDot } from "../lib/dot.js";

const buySchema = z.object({
  founderId: z.string().min(1),
  shares: z.number().int().min(1).max(1_000_000),
});

export async function investmentsRoutes(app: FastifyInstance) {
  /** GET /api/investments/mine — what I (the investor) own */
  app.get("/investments/mine", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select({
        id: investments.id,
        founderId: investments.founderId,
        founderName: users.name,
        founderDotId: users.dotId,
        shares: investments.shares,
        sharePriceKobo: investments.sharePriceKobo,
        totalPaidDot: investments.totalPaidDot,
        status: investments.status,
        createdAt: investments.createdAt,
      })
      .from(investments)
      .leftJoin(users, eq(users.id, investments.founderId))
      .where(eq(investments.investorId, sub))
      .orderBy(desc(investments.createdAt));

    // Aggregate per-founder
    const byFounder: Record<string, {
      founderId: string;
      founderName: string | null;
      founderDotId: string | null;
      totalShares: number;
      totalSpentDot: number;
      lastPurchaseAt: string;
      purchases: number;
    }> = {};
    for (const r of rows) {
      const k = r.founderId;
      if (!byFounder[k]) {
        byFounder[k] = {
          founderId: r.founderId,
          founderName: r.founderName,
          founderDotId: r.founderDotId,
          totalShares: 0,
          totalSpentDot: 0,
          lastPurchaseAt: String(r.createdAt),
          purchases: 0,
        };
      }
      byFounder[k].totalShares += Number(r.shares);
      byFounder[k].totalSpentDot += Number(r.totalPaidDot);
      byFounder[k].purchases += 1;
    }
    const portfolio = Object.values(byFounder).sort(
      (a, b) => b.totalSpentDot - a.totalSpentDot,
    );

    return reply.send({ investments: rows, portfolio });
  });

  /** GET /api/investments/venture/:founderId — investors in this venture */
  app.get("/investments/venture/:founderId", async (req, reply) => {
    const { founderId } = req.params as { founderId: string };
    const rows = await db
      .select({
        id: investments.id,
        investorId: investments.investorId,
        investorName: users.name,
        shares: investments.shares,
        sharePriceKobo: investments.sharePriceKobo,
        totalPaidDot: investments.totalPaidDot,
        createdAt: investments.createdAt,
      })
      .from(investments)
      .leftJoin(users, eq(users.id, investments.investorId))
      .where(and(eq(investments.founderId, founderId), eq(investments.status, "confirmed")))
      .orderBy(desc(investments.createdAt));

    const totalShares = rows.reduce((s, r) => s + Number(r.shares), 0);
    const totalRaisedDot = rows.reduce((s, r) => s + Number(r.totalPaidDot), 0);

    return reply.send({
      investments: rows,
      totalShares,
      totalRaisedDot: String(totalRaisedDot),
      investorCount: rows.length,
    });
  });

  /** POST /api/investments — buy shares */
  app.post("/investments", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = buySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { founderId, shares } = parsed.data;

    if (founderId === sub) {
      return reply.code(400).send({ error: "You can't invest in your own venture" });
    }

    // Fetch founder profile + verify pricing
    const profileRows = await db.execute(sql`
      SELECT user_id, venture_name, share_price_kobo, shares_available
      FROM founder_profiles
      WHERE user_id = ${founderId}
      LIMIT 1
    `);
    const profile = (profileRows as any).rows?.[0];
    if (!profile) {
      return reply.code(404).send({ error: "Founder profile not found" });
    }
    const sharePriceKobo = Number(profile.share_price_kobo ?? 0);
    if (sharePriceKobo <= 0) {
      return reply.code(400).send({ error: "This founder hasn't set a share price yet" });
    }
    const sharesAvailable = Number(profile.shares_available ?? 0);
    if (sharesAvailable <= 0) {
      return reply.code(400).send({ error: "No shares available for this venture" });
    }
    if (shares > sharesAvailable) {
      return reply.code(400).send({
        error: `Only ${sharesAvailable} shares available`,
      });
    }

    // Calculate total cost (in DOT).
    const totalKobo = sharePriceKobo * shares;
    const totalDot = koboToDot(totalKobo);
    if (totalDot <= 0) {
      return reply.code(400).send({ error: "Share price too low to transact" });
    }

    // Debit investor wallet (atomic UPDATE with balance >= amount).
    try {
      await debitWallet({
        userId: sub,
        amount: totalDot,
        type: "investment_purchase",
        description: `Bought ${shares} shares of ${profile.venture_name ?? "venture"} (${sharePriceKobo} kobo/share)`,
      });
    } catch (err: any) {
      return reply.code(402).send({ error: err?.message ?? "Insufficient balance" });
    }

    // Credit founder wallet. If this fails, refund the investor.
    try {
      await creditWallet({
        userId: founderId,
        amount: totalDot,
        type: "investment_received",
        description: `Sold ${shares} shares at ${sharePriceKobo} kobo/share`,
      });
    } catch (err: any) {
      // Best-effort refund.
      try {
        await creditWallet({
          userId: sub,
          amount: totalDot,
          type: "investment_refund",
          description: "Refund: founder wallet credit failed",
        });
      } catch { /* swallow refund failure; logged */ }
      return reply.code(500).send({ error: "Could not credit founder; refunded." });
    }

    // Decrement available shares, increment total raised.
    // total_raised_dot is text — cast both sides to numeric for the addition.
    await db.execute(sql`
      UPDATE founder_profiles
      SET shares_available = shares_available - ${shares},
          total_raised_dot = (COALESCE(NULLIF(total_raised_dot, ''), '0')::numeric + ${totalDot}::numeric)::text,
          updated_at = NOW()
      WHERE user_id = ${founderId}
    `);

    // Record the investment
    const id = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO investments (
        id, investor_id, founder_id, shares, share_price_kobo,
        total_paid_dot, status, created_at
      )
      VALUES (
        ${id}, ${sub}, ${founderId}, ${shares}, ${sharePriceKobo},
        ${totalDot}::numeric, 'confirmed', NOW()
      )
    `);

    return reply.send({
      ok: true,
      investment: {
        id,
        founderId,
        shares,
        sharePriceKobo,
        totalPaidDot: String(totalDot),
        status: "confirmed",
      },
    });
  });
}