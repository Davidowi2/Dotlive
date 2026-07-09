/**
 * DOT OS — Withdrawal + KYC routes (Sprint A.1)
 *
 *   POST /api/wallet/withdraw         Builder submits a withdrawal request
 *   GET  /api/wallet/withdrawals      List user's withdrawal requests
 *   GET  /api/wallet/withdrawals/all  Admin: list all (with filters)
 *   POST /api/wallet/withdrawals/:id/review  Admin: approve / reject / mark paid
 *
 *   GET  /api/kyc/me                  Get current KYC status
 *   POST /api/kyc/submit              Submit BVN/NIN/gov ID
 *   POST /api/kyc/review              Admin: approve/reject KYC
 *
 * KYC tiers:
 *   tier1 = email verified (signup)        → withdrawals up to 5,000 DOT
 *   tier2 = BVN verified                   → withdrawals up to 100,000 DOT
 *   tier3 = NIN + gov ID verified          → unlimited withdrawals
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import {
  withdrawalRequests,
  kycSubmissions,
  users,
  transactions,
  wallets,
} from "../db/schema.js";
import { dotToNaira, debitWallet } from "../lib/dot.js";
import { getUserRoles, userHasRole } from "../lib/auth.js";

const requireAdmin = async (req: any, reply: any) => {
  const id = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(id);
  if (!roles.includes("admin") && !roles.includes("super_admin")) {
    return reply.code(403).send({ error: "Admin only" });
  }
};


const WITHDRAWAL_LIMITS: Record<string, number> = {
  tier1: 5000,    // 5,000 DOT
  tier2: 100_000, // 100,000 DOT
  tier3: Infinity, // unlimited
};

export async function withdrawalRoutes(app: FastifyInstance) {
  /* ============================== WITHDRAW ============================== */

  app.post("/wallet/withdraw", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const raw = (req.body ?? {}) as Record<string, any>;

    // Accept BOTH shapes:
    //   1) Flat:   { amountDot, bankCode, bankName, accountNumber, accountName }
    //   2) Nested: { amountDot, bankInfo: { accountName, accountNumber, bankCode, bankName? } }
    const amount = Number(raw.amountDot ?? raw.amount ?? 0);
    const bankInfo =
      raw.bankInfo ?? {
        accountName: raw.accountName,
        accountNumber: raw.accountNumber,
        bankCode: raw.bankCode,
        bankName: raw.bankName,
      };

    if (!Number.isFinite(amount) || amount < 1000) {
      return reply.code(400).send({ error: "Minimum withdrawal is 1,000 DOT" });
    }

    if (!bankInfo?.accountNumber || !bankInfo?.bankCode || !bankInfo?.accountName) {
      return reply.code(400).send({
        error: "Bank details required (accountName, accountNumber, bankCode)",
        received: Object.keys(raw),
      });
    }

    // Check KYC tier + limits
    const [kyc] = await db
      .select()
      .from(kycSubmissions)
      .where(eq(kycSubmissions.userId, sub))
      .limit(1);

    const tier = kyc?.status === "approved" ? kyc.tier : "tier1";
    const limit = WITHDRAWAL_LIMITS[tier] ?? 0;

    if (amount > limit) {
      return reply.code(403).send({
        error: `Withdrawal limit for your KYC tier (${tier}) is ${limit.toLocaleString()} DOT. Complete higher KYC to increase.`,
        limit,
        currentTier: tier,
      });
    }

    // Check balance
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, sub))
      .limit(1);

    const balance = Number(wallet?.balance ?? 0);
    if (amount > balance) {
      return reply.code(400).send({ error: "Insufficient balance", balance });
    }

    // Debit wallet immediately (held in escrow until paid out)
    try {
      await debitWallet({
        userId: sub,
        amount,
        type: "withdrawal_hold",
        description: `Withdrawal request ${amount.toLocaleString()} DOT to ${bankInfo.bankName ?? bankInfo.bankCode}`,
      });
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }

    const amountNgn = dotToNaira(amount);

    const [created] = await db
      .insert(withdrawalRequests)
      .values({
        userId: sub,
        amountDot: amount.toFixed(2),
        amountNgn: amountNgn.toFixed(2),
        bankInfo,
        kycTier: tier,
        status: "pending",
        updatedAt: new Date(),
      } as any)
      .returning();

    return reply.send({ withdrawal: created });
  });

  /* ============================== LIST MINE ============================== */

  app.get("/wallet/withdrawals", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, sub))
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(50);
    return reply.send({ withdrawals: rows });
  });

  /* ============================== ADMIN: ALL ============================== */

  app.get(
    "/wallet/withdrawals/all",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const q = (req.query ?? {}) as { status?: string; limit?: string };
      const filters: any[] = [];
      if (q.status) filters.push(eq(withdrawalRequests.status, q.status));

      const rows = await db
        .select({
          withdrawal: withdrawalRequests,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
          },
        })
        .from(withdrawalRequests)
        .leftJoin(users, eq(users.id, withdrawalRequests.userId))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(withdrawalRequests.createdAt))
        .limit(Math.min(Number(q.limit ?? 100), 200));

      return reply.send({ withdrawals: rows });
    },
  );

  /* ============================== ADMIN: REVIEW ============================== */

  app.post<{ Params: { id: string } }>(
    "/wallet/withdrawals/:id/review",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const adminId = (req.user as { sub: string }).sub;
      const { id } = req.params;
      const body = (req.body ?? {}) as {
        action?: "approve" | "reject" | "mark_paid" | "mark_failed";
        note?: string;
      };

      if (!body.action) {
        return reply.code(400).send({ error: "action required: approve | reject | mark_paid | mark_failed" });
      }

      const [w] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
      if (!w) return reply.code(404).send({ error: "Withdrawal not found" });

      const updates: any = {
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNote: body.note ?? null,
      };

      if (body.action === "approve") {
        if (w.status !== "pending") return reply.code(400).send({ error: "Already reviewed" });
        updates.status = "approved";
      } else if (body.action === "reject") {
        if (w.status === "paid") return reply.code(400).send({ error: "Already paid" });
        updates.status = "rejected";
        // Refund wallet
        await db.execute(sql`
          UPDATE wallets SET balance = balance + ${Number(w.amountDot)}, updated_at = NOW()
          WHERE user_id = ${w.userId}
        `);
        await db.insert(transactions).values({
          userId: w.userId,
          amount: Number(w.amountDot),
          type: "Refund",
          description: `Withdrawal rejected: ${body.note ?? "no reason"}`,
        } as any);
      } else if (body.action === "mark_paid") {
        updates.status = "paid";
        updates.paidAt = new Date();
      } else if (body.action === "mark_failed") {
        updates.status = "failed";
        updates.failureReason = body.note ?? "Payout failed";
        // Refund
        await db.execute(sql`
          UPDATE wallets SET balance = balance + ${Number(w.amountDot)}, updated_at = NOW()
          WHERE user_id = ${w.userId}
        `);
        await db.insert(transactions).values({
          userId: w.userId,
          amount: Number(w.amountDot),
          type: "Refund",
          description: `Withdrawal payout failed: ${body.note ?? "unknown"}`,
        } as any);
      }

      await db.update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id));
      const [updated] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
      return reply.send({ withdrawal: updated });
    },
  );

  /* ============================== KYC: GET ============================== */

  app.get("/kyc/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const [kyc] = await db
      .select()
      .from(kycSubmissions)
      .where(eq(kycSubmissions.userId, sub))
      .limit(1);

    if (!kyc) {
      return reply.send({
        kyc: {
          userId: sub,
          tier: "tier1",
          status: "not_submitted",
          withdrawalLimit: WITHDRAWAL_LIMITS.tier1,
        },
      });
    }

    return reply.send({
      kyc: {
        ...kyc,
        withdrawalLimit: WITHDRAWAL_LIMITS[kyc.tier] ?? 0,
      },
    });
  });

  /* ============================== KYC: SUBMIT ============================== */

  app.post("/kyc/submit", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const body = (req.body ?? {}) as {
      bvn?: string;
      nin?: string;
      govIdUrl?: string;
      govIdType?: string;
      fullName?: string;
      dateOfBirth?: string;
      address?: string;
      country?: string;
    };

    // Compute target tier
    let tier = "tier1";
    if (body.bvn && body.bvn.length === 11) tier = "tier2";
    if (body.nin && body.nin.length === 11 && body.govIdUrl && body.govIdType) tier = "tier3";

    if (tier === "tier1") {
      return reply.code(400).send({ error: "Provide BVN for tier2, or BVN+NIN+gov_id for tier3" });
    }

    // Upsert
    await db
      .insert(kycSubmissions)
      .values({
        userId: sub,
        tier,
        bvn: body.bvn ?? null,
        nin: body.nin ?? null,
        govIdUrl: body.govIdUrl ?? null,
        govIdType: body.govIdType ?? null,
        fullName: body.fullName ?? null,
        dateOfBirth: body.dateOfBirth ?? null,
        address: body.address ?? null,
        country: body.country ?? "NG",
        status: "pending",
      } as any)
      .onConflictDoUpdate({
        target: kycSubmissions.userId,
        set: {
          tier,
          bvn: body.bvn ?? null,
          nin: body.nin ?? null,
          govIdUrl: body.govIdUrl ?? null,
          govIdType: body.govIdType ?? null,
          fullName: body.fullName ?? null,
          dateOfBirth: body.dateOfBirth ?? null,
          address: body.address ?? null,
          country: body.country ?? "NG",
          status: "pending",
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null,
          updatedAt: new Date(),
        } as any,
      });

    const [kyc] = await db
      .select()
      .from(kycSubmissions)
      .where(eq(kycSubmissions.userId, sub))
      .limit(1);

    return reply.send({ kyc, targetTier: tier, withdrawalLimit: WITHDRAWAL_LIMITS[tier] });
  });

  /* ============================== KYC: ADMIN REVIEW ============================== */

  app.post<{ Params: { userId: string } }>(
    "/kyc/:userId/review",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const adminId = (req.user as { sub: string }).sub;
      const { userId } = req.params;
      const body = (req.body ?? {}) as { approve?: boolean; reason?: string };

      const approve = body.approve !== false;

      await db
        .update(kycSubmissions)
        .set({
          status: approve ? "approved" : "rejected",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: approve ? null : body.reason ?? "rejected",
          updatedAt: new Date(),
        } as any)
        .where(eq(kycSubmissions.userId, userId));

      const [updated] = await db.select().from(kycSubmissions).where(eq(kycSubmissions.userId, userId)).limit(1);
      return reply.send({ kyc: updated });
    },
  );

  /* ============================== BANKS (static list) ============================== */

  /**
   * GET /api/wallet/banks
   * Returns the list of Nigerian banks we support for withdrawals.
   * Static list (Paystack's bank list endpoint is rate-limited + sometimes
   * slow, so we ship our own curated subset of the major banks).
   */
  app.get("/wallet/banks", { preHandler: app.authenticate }, async (_req, reply) => {
    return reply.send({ banks: NIGERIAN_BANKS });
  });

  /* ============================== VERIFY BANK ACCOUNT ============================== */

  /**
   * POST /api/wallet/verify-bank-account
   * Body: { bankCode: string, accountNumber: string }
   * Returns: { accountName: string }
   *
   * Calls Paystack's Resolve API to verify the account name. If Paystack
   * is not configured or unreachable, returns a 503 with a clear message —
   * the frontend can still let the user submit and the admin verifies
   * manually during review.
   */
  app.post<{ Body: { bankCode?: string; accountNumber?: string } }>(
    "/wallet/verify-bank-account",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { bankCode, accountNumber } = req.body ?? {};
      if (!bankCode || !accountNumber) {
        return reply.code(400).send({ error: "bankCode + accountNumber required" });
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        return reply.code(400).send({ error: "Account number must be 10 digits" });
      }

      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackKey) {
        return reply.code(503).send({
          error: "Bank verification unavailable — Paystack not configured. Submit anyway and admin will verify.",
          code: "paystack_disabled",
        });
      }

      try {
        const res = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${paystackKey}` },
          },
        );

        if (!res.ok) {
          const text = await res.text();
          req.log.error({ status: res.status, text }, "Paystack resolve failed");
          return reply.code(502).send({
            error: "Bank verification failed. Submit anyway and admin will verify.",
          });
        }

        const data = (await res.json()) as {
          status: boolean;
          data?: { account_name?: string; account_number?: string };
          message?: string;
        };

        if (!data.status || !data.data?.account_name) {
          return reply.code(404).send({
            error: data.message ?? "Could not resolve account",
          });
        }

        return reply.send({
          accountName: data.data.account_name,
          accountNumber: data.data.account_number ?? accountNumber,
        });
      } catch (err) {
        req.log.error({ err: (err as Error).message }, "Paystack resolve error");
        return reply.code(502).send({
          error: "Bank verification unavailable. Submit anyway and admin will verify.",
        });
      }
    },
  );
}

/* ────────────────────────── Nigerian banks ────────────────────────── */

const NIGERIAN_BANKS: Array<{ code: string; name: string }> = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "063", name: "Diamond Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Kuda Bank" },
  { code: "100", name: "Lotus Bank" },
  { code: "221", name: "Mainstreet Bank" },
  { code: "999992", name: "Moniepoint MFB" },
  { code: "999991", name: "OPay Digital Services" },
  { code: "999993", name: "Palmpay" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "125", name: "Rubies MFB" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "032", name: "Union Bank" },
  { code: "033", name: "United Bank for Africa" },
  { code: "232", name: "Sterling Bank" },
  { code: "035A", name: "ALAT by Wema" },
];