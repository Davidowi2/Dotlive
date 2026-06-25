/**
 * Vantage assessment routes.
 *
 * POST /api/vantage/submit     Submit answers + computed score.
 * GET  /api/vantage/history    Past assessments for the user.
 *
 * Scoring is a stub — the real algorithm lives in the frontend
 * for now and we trust the values sent in. Production would
 * recompute server-side for tamper resistance.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import { db } from "../db/client.js";
import { assessments } from "../db/schema.js";

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  categoryScores: z.record(z.string(), z.number()),
  score: z.number().int().min(0).max(100),
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
        score: parsed.data.score,
        vantagePoint: parsed.data.vantagePoint,
        fundability: parsed.data.fundability,
        investmentReadiness: parsed.data.investmentReadiness,
        stage: parsed.data.stage,
        report: parsed.data.report ?? null,
      } as any)
      .returning();

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
  /** GET /api/vantage/me — current user's vantage snapshot.
   * Returns latest assessment score + deltas. */
  app.get("/vantage/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, sub))
      .orderBy(desc(assessments.createdAt))
      .limit(1);
    if (rows.length === 0) return reply.send({ vantage: null });
    const a = rows[0];
    return reply.send({
      vantage: {
        score: Number(a.score ?? 0),
        vantagePoint: Number(a.vantagePoint ?? 0),
        fundability: Number(a.fundability ?? 0),
        investmentReadiness: Number(a.investmentReadiness ?? 0),
        stage: a.stage,
        createdAt: a.createdAt,
      },
    });
  });

}
// @ts-nocheck