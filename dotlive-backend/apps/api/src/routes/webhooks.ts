/**
 * Webhook routes for payment providers.
 *
 * Currently wires Paystack (Naira deposits → DOT credit) and
 * Whop (USD deposits → DOT credit). Both verify signatures
 * server-side, are idempotent on the provider's reference, and
 * write to `transactions` exactly once per event.
 */

import type { FastifyInstance } from "fastify";
import crypto from "node:crypto";

import { db, sql } from "../db/client.js";
import { payments } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { creditWallet } from "../lib/dot.js";

const STARTER_GRANT_DOT = 500; // unused here, mirrored from auth.ts for ref

export async function webhookRoutes(app: FastifyInstance) {
  /** POST /api/webhooks/paystack */
  app.post("/webhooks/paystack", async (req, reply) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return reply.code(503).send({ error: "Paystack not configured" });

    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) return reply.code(400).send({ error: "Missing raw body" });

    const sig = req.headers["x-paystack-signature"];
    if (typeof sig !== "string") return reply.code(401).send({ error: "Missing signature" });
    const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return reply.code(401).send({ error: "Bad signature" });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return reply.code(400).send({ error: "Bad payload" });
    }

    if (payload.event !== "charge.success" || !payload.data?.reference) {
      return reply.send({ ok: true });
    }

    const ref = payload.data.reference as string;
    const payment = await db.select().from(payments).where(eq(payments.reference, ref)).limit(1);
    if (payment.length === 0) return reply.send({ ok: true });
    if (payment[0].creditedAt) return reply.send({ ok: true });

    const expectedKobo = Number(payment[0].nairaAmount) * 100;
    if (payload.data.amount !== expectedKobo || payload.data.status !== "success") {
      await db.update(payments).set({ status: "amount_mismatch" } as any).where(eq(payments.reference, ref));
      return reply.send({ ok: true });
    }

    await db
      .update(payments)
      .set({ status: "success", paidAt: new Date(payload.data.paid_at ?? Date.now()) } as any)
      .where(eq(payments.reference, ref));

    await creditWallet({
      userId: payment[0].userId,
      amount: Number(payment[0].dotAmount),
      type: "Paystack Deposit",
      description: `Paystack deposit · ${ref}`,
      reference: ref,
    });
    await db.update(payments).set({ creditedAt: new Date() } as any).where(eq(payments.reference, ref));

    // Notify user of deposit confirmed.
    try {
      const { notify } = await import("../lib/notify.js");
      await notify({
        userId: payment[0].userId,
        type: "deposit_confirmed",
        title: `+${payment[0].dotAmount} DOT deposited`,
        body: `₦${payment[0].nairaAmount} cleared via Paystack. Funds are now in your wallet.`,
        link: "/wallet",
        icon: "Wallet",
        sendEmail: true,
      });
    } catch {
      // best-effort
    }
    return reply.send({ ok: true });
  });

  /** POST /api/webhooks/whop */
  app.post("/webhooks/whop", async (req, reply) => {
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) return reply.code(503).send({ error: "Whop not configured" });

    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) return reply.code(400).send({ error: "Missing raw body" });

    const sig = req.headers["whop-signature"];
    if (typeof sig !== "string") return reply.code(401).send({ error: "Missing signature" });
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return reply.code(401).send({ error: "Bad signature" });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return reply.code(400).send({ error: "Bad payload" });
    }

    if (payload.type !== "checkout.completed" || payload.data?.status !== "completed") {
      return reply.send({ ok: true });
    }

    const userId = payload.data?.metadata?.user_id as string | undefined;
    const centsStr = payload.data?.metadata?.amount_usd_cents as string | undefined;
    if (!userId || !centsStr) return reply.code(400).send({ error: "Missing metadata" });

    // 1 DOT = $0.10 placeholder rate.
    const dot = Math.floor(Number(centsStr) / 10);
    if (!Number.isFinite(dot) || dot <= 0) return reply.code(400).send({ error: "Invalid amount" });

    await creditWallet({
      userId,
      amount: dot,
      type: "Whop Deposit",
      description: `Whop deposit · ${payload.data.id}`,
      reference: `whop:${payload.data.id}`,
    });
    return reply.send({ ok: true });
  });
}
// @ts-nocheck