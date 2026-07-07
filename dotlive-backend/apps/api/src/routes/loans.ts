/**
 * Loans (Loan Panel) routes.
 *
 * Tier 3 / Commitment 4 — loan marketplace for capital partners and ventures.
 *
 * GET  /api/loans/requests              — list all loan requests (for capital partners)
 * GET  /api/loans/requests/:id          — get a single loan request with votes
 * POST /api/loans/requests              — create a loan request (for founders)
 * POST /api/loans/requests/:id/vote     — vote on a loan request (capital partners only)
 * GET  /api/loans/my                    — get my loans (as borrower or lender)
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, isNull, isNotNull } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { loanRequests, loanVotes, loans, users, ventures, founderProfiles } from "../db/schema.js";

const createRequestSchema = z.object({
  ventureId: z.string().uuid(),
  amountNaira: z.number().int().min(10000),
  termMonths: z.number().int().min(3).max(12),
  purpose: z.string().optional(),
});

const voteSchema = z.object({
  vote: z.boolean(),
  amountNaira: z.number().int().min(0).optional(),
});

export async function loansRoutes(app: FastifyInstance) {
  /** GET /api/loans/requests — list all loan requests, optional status filter */
  app.get("/loans/requests", { preHandler: app.authenticate }, async (req, reply) => {
    const query = (req.query as any) || {};
    const status = query.status as string | undefined;

    const rows = await db
      .select({
        id: loanRequests.id,
        ventureId: loanRequests.ventureId,
        requestedBy: loanRequests.requestedBy,
        founderName: users.name,
        founderDotId: users.dotId,
        ventureName: ventures.name,
        amountNaira: loanRequests.amountNaira,
        termMonths: loanRequests.termMonths,
        purpose: loanRequests.purpose,
        status: loanRequests.status,
        createdAt: loanRequests.createdAt,
        votingEndsAt: loanRequests.votingEndsAt,
      })
      .from(loanRequests)
      .leftJoin(users, eq(users.id, loanRequests.requestedBy))
      .leftJoin(ventures, eq(ventures.id, loanRequests.ventureId))
      .where(status ? eq(loanRequests.status, status) : undefined)
      .orderBy(desc(loanRequests.createdAt));

    return reply.send({ requests: rows });
  });

  /** GET /api/loans/requests/:id — get a single loan request with all votes */
  app.get("/loans/requests/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const [requestRow] = await db
      .select({
        id: loanRequests.id,
        ventureId: loanRequests.ventureId,
        requestedBy: loanRequests.requestedBy,
        founderName: users.name,
        founderDotId: users.dotId,
        ventureName: ventures.name,
        amountNaira: loanRequests.amountNaira,
        termMonths: loanRequests.termMonths,
        purpose: loanRequests.purpose,
        status: loanRequests.status,
        createdAt: loanRequests.createdAt,
        votingEndsAt: loanRequests.votingEndsAt,
      })
      .from(loanRequests)
      .leftJoin(users, eq(users.id, loanRequests.requestedBy))
      .leftJoin(ventures, eq(ventures.id, loanRequests.ventureId))
      .where(eq(loanRequests.id, id));

    if (!requestRow) {
      return reply.code(404).send({ error: "Loan request not found" });
    }

    const voteRows = await db
      .select({
        id: loanVotes.id,
        loanRequestId: loanVotes.loanRequestId,
        voterId: loanVotes.voterId,
        voterName: users.name,
        vote: loanVotes.vote,
        amountNaira: loanVotes.amountNaira,
        votedAt: loanVotes.votedAt,
      })
      .from(loanVotes)
      .leftJoin(users, eq(users.id, loanVotes.voterId))
      .where(eq(loanVotes.loanRequestId, id))
      .orderBy(desc(loanVotes.votedAt));

    const approvals = voteRows.filter(v => v.vote).length;
    const rejections = voteRows.filter(v => !v.vote).length;
    const totalVotes = voteRows.length;

    return reply.send({
      request: requestRow,
      votes: voteRows,
      approvals,
      rejections,
      totalVotes,
    });
  });

  /** POST /api/loans/requests — create a new loan request (founders only) */
  app.post("/loans/requests", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { ventureId, amountNaira, termMonths, purpose } = parsed.data;

    // Verify the venture belongs to this founder
    const [venture] = await db.select().from(ventures).where(eq(ventures.id, ventureId));
    if (!venture) {
      return reply.code(404).send({ error: "Venture not found" });
    }
    if (venture.userId !== sub) {
      return reply.code(403).send({ error: "You don't own this venture" });
    }

    const votingEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const result = await db.insert(loanRequests).values({
      ventureId,
      requestedBy: sub,
      amountNaira,
      termMonths,
      ...(purpose ? { purpose } : {}),
      votingEndsAt,
    }).returning({ id: loanRequests.id });

    const insertedId = result[0]?.id || "";
    return reply.status(201).send({ ok: true, requestId: insertedId });
  });

  /** POST /api/loans/requests/:id/vote — vote on a loan request (capital partners) */
  app.post("/loans/requests/:id/vote", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = voteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { vote, amountNaira } = parsed.data;

    // Check loan request exists and is in voting status
    const [request] = await db.select().from(loanRequests).where(eq(loanRequests.id, id));
    if (!request) {
      return reply.code(404).send({ error: "Loan request not found" });
    }
    if (request.status !== "voting") {
      return reply.code(400).send({ error: "Loan request is not open for voting" });
    }

    // Check user is not self-voting
    if (request.requestedBy === sub) {
      return reply.code(400).send({ error: "You can't vote on your own loan request" });
    }

    // Upsert vote (update if already voted, insert if new)
    await db
      .insert(loanVotes)
      .values({
        loanRequestId: id,
        voterId: sub,
        vote,
        ...(amountNaira !== undefined && amountNaira > 0 ? { amountNaira } : {}),
      })
      .onConflictDoUpdate({
        target: [loanVotes.loanRequestId, loanVotes.voterId],
        set: { 
          vote, 
          ...(amountNaira !== undefined && amountNaira > 0 ? { amountNaira } : {}),
        },
      });

    return reply.send({ ok: true });
  });

  /** GET /api/loans/my — get loans where I'm the borrower or lender */
  app.get("/loans/my", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    // Get loans where I'm borrower (via venture) or lender (fundedBy)
    const rows = await db
      .select({
        id: loans.id,
        loanRequestId: loans.loanRequestId,
        ventureId: loans.ventureId,
        ventureName: ventures.name,
        amountNaira: loans.amountNaira,
        termMonths: loans.termMonths,
        interestRate: loans.interestRate,
        status: loans.status,
        fundedBy: loans.fundedBy,
        fundedByName: users.name,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .leftJoin(ventures, eq(ventures.id, loans.ventureId))
      .leftJoin(users, eq(users.id, loans.fundedBy))
      .where(or(eq(loans.fundedBy, sub), eq(ventures.userId, sub)));

    // Also get loan requests where I'm the requester
    const myRequests = await db
      .select({
        id: loanRequests.id,
        ventureId: loanRequests.ventureId,
        ventureName: ventures.name,
        amountNaira: loanRequests.amountNaira,
        termMonths: loanRequests.termMonths,
        purpose: loanRequests.purpose,
        status: loanRequests.status,
        createdAt: loanRequests.createdAt,
      })
      .from(loanRequests)
      .leftJoin(ventures, eq(ventures.id, loanRequests.ventureId))
      .where(eq(loanRequests.requestedBy, sub))
      .orderBy(desc(loanRequests.createdAt));

    return reply.send({ loans: rows, requests: myRequests });
  });
}

// Helper for OR conditions
function or(...conditions: (any | undefined)[]) {
  return conditions.filter(Boolean).reduce((acc, cond) => acc ? acc.or(cond) : cond, undefined);
}
