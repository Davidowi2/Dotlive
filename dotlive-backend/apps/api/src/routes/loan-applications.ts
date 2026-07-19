/**
 * Loan Applications routes.
 *
 * /api/loans/eligibility
 * /api/loans/applications
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  users,
  ventures,
  founderProfiles,
  loanApplications,
  loanRepayments,
  loanRequests,
  loans,
  adminAuditLog,
  transactions,
  wallets,
} from "../db/schema.js";
import { getUserRoles, userHasRole } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import {
  creditWallet,
  debitWallet,
  dotToNaira,
  nairaToDot,
} from "../lib/dot.js";

const createApplicationSchema = z.object({
  legalName: z.string().min(1),
  countryOfResidence: z.string().min(1),
  phoneNumber: z.string().min(1),
  nationalId: z.string().min(1),
  dateOfBirth: z.string().min(1),
  sourceOfIncome: z.string().min(1),
  ventureName: z.string().min(1),
  businessRegNumber: z.string().min(1),
  countryOfRegistration: z.string().min(1),
  monthlyRevenue: z.coerce.number().min(0),
  monthlyExpenses: z.coerce.number().min(0),
  outstandingDebts: z.string().min(1),
  amountRequested: z.coerce.number().positive(),
  purpose: z.string().min(100).max(1000),
  repaymentPeriodMonths: z.coerce.number().int().min(3).max(12),
  collateral: z.string().optional(),
  revenueProofUrl: z.string().optional(),
  expenseProofUrl: z.string().optional(),
  termsAccepted: z.boolean().refine((v) => v === true),
  fraudAcknowledged: z.boolean().refine((v) => v === true),
  verificationAuthorized: z.boolean().refine((v) => v === true),
});

async function requireAdmin(req: any, reply: any) {
  const userId = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(userId);
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  if (!isAdmin) {
    return reply.code(403).send({ error: "Admin only" });
  }
}

async function checkLoanEligibility(userId: string) {
  const activeLoan = await db
    .select()
    .from(loans)
    .where(and(eq(loans.fundedBy, userId), eq(loans.status, "active")))
    .then((rows) => rows[0]);

  if (activeLoan) {
    return { eligible: false as const, reason: "You already have an active loan." };
  }

  const defaulted = await db
    .select()
    .from(loans)
    .where(and(eq(loans.fundedBy, userId), eq(loans.status, "default")))
    .then((rows) => rows[0]);

  if (defaulted) {
    return { eligible: false as const, reason: "You have a defaulted loan history." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return { eligible: false as const, reason: "User not found." };
  }

  if (user.loanApplicationBlocked) {
    return { eligible: false as const, reason: "Applications are currently blocked for your account." };
  }

  const [vantageRow] = await db.execute(sql`
    SELECT vantage_point FROM founder_profiles WHERE user_id = ${userId} LIMIT 1
  `) as any;
  const vantage = Number(vantageRow?.vantage_point ?? 0);
  if (vantage < 400) {
    return { eligible: false as const, reason: `Vantage score must be 400+. Current: ${vantage}` };
  }

  const activeVentures = await db
    .select({ count: sql<number>`count(*)` })
    .from(ventures)
    .where(
      and(
        eq(ventures.userId, userId),
        sql`${ventures.createdAt} <= now() - interval '90 days'`,
      ),
    );

  const ventureCount = Number(activeVentures[0]?.count ?? 0);
  if (ventureCount < 1) {
    return { eligible: false as const, reason: "You need at least 1 venture active for 3+ months on the platform." };
  }

  return { eligible: true as const };
}

export async function loanApplicationsRoutes(app: FastifyInstance) {
  app.get(
    "/loans/eligibility",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = (req.user as { sub: string }).sub;
      const result = await checkLoanEligibility(userId);
      return reply.send(result);
    },
  );

  app.post(
    "/loans/applications",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = (req.user as { sub: string }).sub;
      const parsed = createApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const eligibility = await checkLoanEligibility(userId);
      if (!eligibility.eligible) {
        return reply.code(403).send({ error: eligibility.reason });
      }

      const data = parsed.data;
      const termMonths = data.repaymentPeriodMonths;
      const monthlyRate = 0.02;
      const monthlyInterest = Number(data.amountRequested) * monthlyRate;
      const monthlyPayment = Number(data.amountRequested) / termMonths + monthlyInterest;

      const [application] = await db
        .insert(loanApplications)
        .values({
          userId,
          amountRequested: data.amountRequested,
          legalName: data.legalName,
          countryOfResidence: data.countryOfResidence,
          phoneNumber: data.phoneNumber,
          nationalId: data.nationalId,
          dateOfBirth: data.dateOfBirth,
          sourceOfIncome: data.sourceOfIncome,
          ventureName: data.ventureName,
          businessRegNumber: data.businessRegNumber,
          countryOfRegistration: data.countryOfRegistration,
          monthlyRevenue: data.monthlyRevenue,
          monthlyExpenses: data.monthlyExpenses,
          outstandingDebts: data.outstandingDebts,
          purpose: data.purpose,
          repaymentPeriodMonths: data.repaymentPeriodMonths,
          collateral: data.collateral,
          revenueProofUrl: data.revenueProofUrl,
          expenseProofUrl: data.expenseProofUrl,
        } as any)
        .returning();

      const repaymentRows: any[] = [];
      for (let idx = 0; idx < termMonths; idx++) {
        repaymentRows.push({
          loanApplicationId: application.id,
          dueDate: new Date(Date.now() + (idx + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
          amountDot: monthlyPayment,
          status: "pending" as const,
        });
      }

      await db.insert(loanRepayments).values(repaymentRows);

      await db.update(users).set({ loanApplicationBlocked: true }).where(eq(users.id, userId));

      return reply.status(201).send({ application });
    },
  );
}

export async function adminLoanRoutes(app: FastifyInstance) {
  app.get(
    "/admin/loans",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const status = (req.query as any)?.status as string | undefined;
      const rows = await db
        .select()
        .from(loanApplications)
        .where(status && status !== "all" ? eq(loanApplications.status, status) : undefined)
        .orderBy(desc(loanApplications.createdAt));

      return reply.send({ applications: rows });
    },
  );

  app.post(
    "/admin/loans/:id/approve",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { terms } = req.body as any;
      const actorId = (req.user as { sub: string }).sub;

      const [application] = await db
        .select()
        .from(loanApplications)
        .where(eq(loanApplications.id, id));

      if (!application) {
        return reply.code(404).send({ error: "Application not found" });
      }

      const updated = await db
        .update(loanApplications)
        .set({
          status: "approved",
          reviewedBy: actorId,
          reviewedAt: new Date(),
          adminNotes: terms ?? application.adminNotes,
        })
        .where(eq(loanApplications.id, id))
        .returning();

      await notify({
        userId: application.userId,
        type: "system",
        title: "Loan application approved",
        body: `Your loan application for ${application.amountRequested} DOT has been approved.`,
        link: "/loans",
      });

      return reply.send({ application: updated[0] });
    },
  );

  app.post(
    "/admin/loans/:id/decline",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const actorId = (req.user as { sub: string }).sub;

      const [application] = await db
        .select()
        .from(loanApplications)
        .where(eq(loanApplications.id, id));

      if (!application) {
        return reply.code(404).send({ error: "Application not found" });
      }

      await db
        .update(loanApplications)
        .set({
          status: "declined",
          reviewedBy: actorId,
          reviewedAt: new Date(),
        })
        .where(eq(loanApplications.id, id));

      await db.update(users).set({ loanApplicationBlocked: false }).where(eq(users.id, application.userId));

      await notify({
        userId: application.userId,
        type: "system",
        title: "Loan application declined",
        body: `Your loan application was reviewed and declined.`,
        link: "/loans",
      });

      return reply.send({ ok: true });
    },
  );

  app.post(
    "/admin/loans/:id/request-info",
    { preHandler: [app.authenticate, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const actorId = (req.user as { sub: string }).sub;

      const [application] = await db
        .select()
        .from(loanApplications)
        .where(eq(loanApplications.id, id));

      if (!application) {
        return reply.code(404).send({ error: "Application not found" });
      }

      await db
        .update(loanApplications)
        .set({
          status: "more_info_needed",
          reviewedBy: actorId,
          reviewedAt: new Date(),
        })
        .where(eq(loanApplications.id, id));

      await db.update(users).set({ loanApplicationBlocked: false }).where(eq(users.id, application.userId));

      await notify({
        userId: application.userId,
        type: "system",
        title: "More info needed for loan application",
        body: "Please update your loan application with the requested details.",
        link: "/loans",
      });

      return reply.send({ ok: true });
    },
  );
}
