/**
 * Payments routes — wallet deposits via Paystack.
 *
 *   POST /api/payments/deposit     Initiate a Paystack checkout; returns { authorization_url, reference }.
 *   GET  /api/payments/deposit/callback  Public callback that Paystack redirects to after payment.
 *   GET  /api/payments/:id          Check status of a payment row.
 *   POST /api/payments/:id/replay   Re-query Paystack and update status (admin / self only).
 *
 * The actual crediting of the wallet happens via /api/webhooks/paystack on
 * charge.success. The callback here just shows the user a "thank you" page
 * and tells them to wait for the webhook.
 *
 * If PAYSTACK_SECRET_KEY is not set, returns 503 — the frontend should show
 * "deposits temporarily disabled" (which it already does).
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { payments, wallets } from "../db/schema.js";

const DEPOSIT_DOT_TO_NAIRA = 15; // 1 DOT = ₦15 (matches dotToNaira in frontend)

export async function paymentsRoutes(app: FastifyInstance) {
  /* ─── DEPOSIT INITIATE ─── */

  const depositSchema = z.object({
    amountDot: z.number().positive().max(1_000_000),
    callbackUrl: z.string().url().optional(),
  });

  app.post("/payments/deposit", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "amountDot (1-1M) required" });
    const { amountDot, callbackUrl } = parsed.data;

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return reply.code(503).send({
        error: "Deposits are temporarily disabled. Set PAYSTACK_SECRET_KEY in env to enable.",
        code: "paystack_disabled",
      });
    }

    const amountNaira = Math.round(amountDot * DEPOSIT_DOT_TO_NAIRA * 100); // Paystack uses kobo
    const reference = `dot_${Date.now()}_${randomBytes(8).toString("hex")}`;

    // Persist a pending payment row BEFORE calling Paystack so we can match the webhook.
    await db.insert(payments).values({
      userId: id,
      dotAmount: String(amountDot),
      nairaAmount: String(amountNaira / 100),
      status: "pending",
      reference,
    } as any);

    // Call Paystack's initialize endpoint
    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: (req.user as any).email ?? "",
        amount: amountNaira,
          reference,
        callback_url: callbackUrl ?? `${process.env.FRONTEND_URL ?? "https://dotlive.cv"}/wallet?deposit=success&ref=${reference}`,
        metadata: { user_id: id, amount_dot: amountDot, purpose: "wallet_deposit" },
      }),
    });

    if (!initRes.ok) {
      const text = await initRes.text();
      req.log.error({ text }, "Paystack init failed");
      return reply.code(502).send({ error: "Payment provider unreachable. Try again." });
    }

    const data = (await initRes.json()) as { status: boolean; data: { authorization_url: string; reference: string } };
    return reply.send({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      amountDot,
      amountNaira: amountNaira / 100,
    });
  });

  /* ─── DEPOSIT CALLBACK (user lands here after Paystack redirects them) ─── */

  app.get<{ Querystring: { reference?: string; trxref?: string } }>(
    "/payments/deposit/callback",
    async (req, reply) => {
      const ref = req.query.reference ?? req.query.trxref;
      if (!ref) return reply.code(400).send({ error: "Missing reference" });
      // Redirect to the wallet page; the actual crediting happens via webhook.
      const frontend = process.env.FRONTEND_URL ?? "https://dotlive.cv";
      return reply.redirect(`${frontend}/wallet?deposit=processing&ref=${ref}`);
    }
  );

  /* ─── STATUS CHECK ─── */

  app.get<{ Params: { id: string } }>("/payments/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { id } = req.params;
    const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: "Payment not found" });
    if (row.userId !== (req.user as { sub: string }).sub) {
      return reply.code(403).send({ error: "Not your payment" });
    }
    return reply.send({ payment: row });
  });

  /* ─── REPLAY (force re-query Paystack) ─── */

  app.post<{ Params: { id: string } }>("/payments/:id/replay", { preHandler: app.authenticate }, async (req, reply) => {
    const { id } = req.params;
    const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: "Payment not found" });
    if (row.userId !== (req.user as { sub: string }).sub) {
      return reply.code(403).send({ error: "Not your payment" });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) return reply.code(503).send({ error: "Paystack not configured" });

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${row.reference}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    const vData = (await verifyRes.json()) as { status: boolean; data: { status: string; amount: number } };
    const paystackStatus = vData.data?.status;

    if (paystackStatus === "success" && row.status === "pending") {
      // Credit the wallet
      await db.execute(sql`
        UPDATE wallets SET balance = balance + ${Number(row.dotAmount)}, updated_at = NOW()
        WHERE user_id = ${row.userId}
      `);
      await db.execute(sql`
        UPDATE payments SET status = 'completed' WHERE id = ${id}
      `);
      await db.execute(sql`
        INSERT INTO transactions (user_id, amount, type, description)
        VALUES (${row.userId}, ${row.dotAmount}, 'credit', ${'Paystack deposit ref=' + row.reference})
      `);
    }
    return reply.send({ payment: { ...row, status: paystackStatus } });
  });

  /* ─── HISTORY (recent deposits) ─── */

  app.get("/payments", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, id))
      .orderBy(sql`created_at DESC`)
      .limit(50);
    return reply.send({ payments: rows });
  });
}
