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
    const body = (req.body ?? {}) as {
      amountDot?: number;
      bankInfo?: {
        accountName: string;
        accountNumber: string;
        bankCode: string;
        bankName?: string;
      };
    };

    const amount = Number(body.amountDot ?? 0);
    if (!Number.isFinite(amount) || amount < 1000) {
      return reply.code(400).send({ error: "Minimum withdrawal is 1,000 DOT" });
    }

    if (!body.bankInfo?.accountNumber || !body.bankInfo?.bankCode || !body.bankInfo?.accountName) {
      return reply.code(400).send({ error: "Bank details required (accountName, accountNumber, bankCode)" });
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
        description: `Withdrawal request ${amount.toLocaleString()} DOT to ${body.bankInfo.bankName ?? body.bankInfo.bankCode}`,
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
        bankInfo: body.bankInfo,
        kycTier: tier,
        status: "pending",
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
}