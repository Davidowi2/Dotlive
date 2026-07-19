/**
 * Vantage assessment routes.
 *
 * POST /api/vantage/submit     Submit answers + computed score.
 * GET  /api/vantage/history    Past assessments for the user.
 * GET  /api/vantage/can-retake Re-take eligibility.
 * GET  /api/vantage/status     7-day prompt status.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { assessments, users } from "../db/schema.js";

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  categoryScores: z.record(z.string(), z.number()),
  vantagePoint: z.number().int().min(0),
  fundability: z.number().int().min(0),
  investmentReadiness: z.number().int().min(0),
  stage: z.string().max(40).optional(),
  report: z.record(z.string(), z.unknown()).optional(),
});

export async function vantageRoutes(app: FastifyInstance) {
  app.post("/vantage/submit", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const inserted = await db
      .insert(assessments)
      .values({
        userId: sub,
        answers: parsed.data.answers,
        categoryScores: parsed.data.categoryScores,
        vantagePoint: parsed.data.vantagePoint,
        fundability: parsed.data.fundability,
        investmentReadiness: parsed.data.investmentReadiness,
        stage: parsed.data.stage,
        report: parsed.data.report ?? null,
      } as any)
      .returning();

    try {
      await db.execute(sql`
        INSERT INTO founder_profiles
          (user_id, vantage_point, fundability, investment_readiness, stage, updated_at)
        VALUES
          (${sub}, ${parsed.data.vantagePoint}, ${parsed.data.fundability}, ${parsed.data.investmentReadiness}, ${parsed.data.stage}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          vantage_point = EXCLUDED.vantage_point,
          fundability = EXCLUDED.fundability,
          investment_readiness = EXCLUDED.investment_readiness,
          stage = EXCLUDED.stage,
          updated_at = NOW()
      `);
    } catch (err) {
      app.log?.warn?.({ err }, "founder profile sync after vantage submit failed");
    }

    try {
      await db
        .update(users)
        .set({ lastVantageTakenAt: new Date() } as any)
        .where(eq(users.id, sub));
    } catch (err) {
      app.log?.warn?.({ err }, "failed to update lastVantageTakenAt");
    }

    return reply.send({ assessment: inserted[0] });
  });

  app.get("/vantage/history", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, sub))
      .orderBy(desc(assessments.createdAt))
      .limit(20);
    return reply.send({ assessments: rows });
  });

  app.get("/vantage/can-retake", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select({ lastVantageTakenAt: users.lastVantageTakenAt })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);
    const last = rows[0]?.lastVantageTakenAt ? new Date(rows[0].lastVantageTakenAt).getTime() : null;
    const now = Date.now();
    const canRetake = !last || now - last >= 30 * 24 * 60 * 60 * 1000;
    return reply.send({
      canRetake,
      nextRetakeAt: last ? new Date(last + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    });
  });

  app.get("/vantage/status", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const [userRow, assessmentRow] = await Promise.all([
      db.select({ createdAt: users.createdAt, lastVantageTakenAt: users.lastVantageTakenAt }).from(users).where(eq(users.id, sub)).limit(1),
      db.select().from(assessments).where(eq(assessments.userId, sub)).orderBy(desc(assessments.createdAt)).limit(1),
    ]);
    const user = userRow[0];
    if (!user) return reply.code(404).send({ error: "User not found" });
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : now();
    const daysSinceSignup = Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
    const hasTakenTest = !!assessmentRow.length;
    const isOverdue = !hasTakenTest && daysSinceSignup >= 7;
    return reply.send({ hasTakenTest, daysSinceSignup, isOverdue });
  });
}

function now() {
  return Date.now();
}

// @ts-nocheck
