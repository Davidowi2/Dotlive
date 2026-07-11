/**
 * Payments routes — wallet deposits via Paystack.
 *
 *   POST /api/payments/deposit     Initiate a Paystack checkout; returns { authorization_url, reference }.
 *   GET  /api/payments/deposit/callback  Public callback that Paystack redirects to after payment.
 *   POST /api/payments/webhook     Paystack webhook endpoint for charge.success.
 *   GET  /api/payments/:id          Check status of a payment row.
 *   POST /api/payments/:id/replay   Re-query Paystack and update status (admin / self only).
 *   GET  /api/payments              List user's payment history.
 *
 * The actual crediting of the wallet happens via the webhook or replay endpoint.
 * The callback just shows the user a message and tells them to wait for the webhook.
 *
 * If PAYSTACK_SECRET_KEY is not set, returns 503 — the frontend should show
 * "deposits unavailable" (which it already does).
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { payments, wallets, users, transactions } from "../db/schema.js";

const DEPOSIT_DOT_TO_NAIRA = 15; // 1 DOT = ₦15 (matches dotToNaira in frontend)

// Helper function to credit wallet atomically
async function creditWalletAndUpdatePayment(
  paymentId: string,
  reference: string,
  userId: string,
  amountDot: number
) {
  await db.transaction(async (tx) => {
    // Credit wallet
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${String(amountDot)}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Update payment
    await tx
      .update(payments)
      .set({
        status: "completed",
        creditedAt: new Date(),
        paidAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    // Insert transaction record
    await tx.insert(transactions).values({
      userId: userId,
      amount: String(amountDot),
      type: "Deposit",
      description: `Paystack deposit ref=${reference}`,
    } as any);
  });
}

export async function paymentsRoutes(app: FastifyInstance) {
  /* ─── DEPOSIT CONFIG (public) ─── */

  /**
   * GET /api/payments/config
   * Returns the public Paystack key + conversion rate + min/max.
   * Used by the frontend to render the deposit dialog.
   */
  app.get("/payments/config", async (_req, reply) => {
    return reply.send({
      enabled: !!process.env.PAYSTACK_SECRET_KEY,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? null,
      dotToNaira: 15,
      minDepositDot: 2000,
      maxDepositDot: 1_000_000,
      feePercent: 1.5,
      webhookConfigured: !!process.env.PAYSTACK_SECRET_KEY,
      frontendUrl: process.env.FRONTEND_URL ?? "https://dotlive.cv",
    });
  });

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
        error: "Deposits aren't available right now. Set PAYSTACK_SECRET_KEY in env to enable.",
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

    // Look up the user's email from the DB — JWT only carries `sub` (userId).
    const [userRow] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const userEmail = userRow?.email ?? `${id}@dotlive.cv`;

    // Call Paystack's initialize endpoint
    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: amountNaira,
        reference,
        callback_url: callbackUrl ?? `${process.env.FRONTEND_URL ?? "https://dotlive.cv"}/wallet?deposit=success&ref=${reference}`,
        metadata: { user_id: id, amount_dot: amountDot, purpose: "wallet_deposit" },
      }),
    });

    if (!initRes.ok) {
      const text = await initRes.text();
      let paystackMessage = "";
      try {
        const parsed = JSON.parse(text);
        paystackMessage = parsed.message ?? parsed.error ?? "";
      } catch {
        paystackMessage = text.slice(0, 200);
      }
      req.log.error(
        {
          status: initRes.status,
          statusText: initRes.statusText,
          text: text.slice(0, 500),
          paystackMessage,
          paystackKeyConfigured: !!paystackKey,
          paystackKeyPrefix: paystackKey.slice(0, 7),
          amountNaira,
          reference,
          isLiveKey: paystackKey.startsWith("sk_live_"),
          userEmail: (req.user as any).email,
        },
        "Paystack init failed",
      );
      return reply.code(502).send({
        error: "Payment provider unreachable. Try again.",
        hint: initRes.status === 403
          ? "Paystack blocked the request — likely an IP whitelist issue. Check Paystack dashboard → Settings → API → IP Whitelist."
          : initRes.status === 401
            ? "Invalid Paystack secret key. Re-check Render env var PAYSTACK_SECRET_KEY."
            : paystackMessage
              ? `Paystack: ${paystackMessage}`
              : `Paystack returned ${initRes.status}`,
        upstreamStatus: initRes.status,
      });
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

  /* ─── PAYSTACK WEBHOOK (server-to-server) ─── */
  app.post("/payments/webhook", async (req, reply) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return reply.status(500).send("Not configured");

    // Verify Paystack signature
    const raw = await req.body;
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    if (!signature) return reply.status(401).send("Invalid signature");

    const expected = createHmac("sha512", secret)
      .update(JSON.stringify(raw))
      .digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return reply.status(401).send("Invalid signature");
    }

    // Parse event
    const event = raw as {
      event?: string;
      data?: { reference?: string; status?: string; amount?: number };
    };

    if (event.event !== "charge.success" || !event.data?.reference) {
      return reply.status(200).send("Ignored");
    }

    // Find payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.reference, event.data.reference));
    if (!payment || payment.status !== "pending") {
      return reply.status(200).send("OK");
    }

    // Verify amount
    const expectedKobo = Math.round(Number(payment.nairaAmount) * 100);
    if (event.data.amount !== expectedKobo) {
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.id, payment.id));
      return reply.status(200).send("OK");
    }

    // Credit wallet
    await creditWalletAndUpdatePayment(
      payment.id,
      event.data.reference,
      payment.userId,
      Number(payment.dotAmount)
    );

    return reply.status(200).send("OK");
  });

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
      await creditWalletAndUpdatePayment(
        row.id,
        row.reference,
        row.userId,
        Number(row.dotAmount)
      );
    }

    const [updatedPayment] = await db.select().from(payments).where(eq(payments.id, id));
    return reply.send({ payment: updatedPayment });
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
