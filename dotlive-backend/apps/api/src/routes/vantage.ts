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
import { sql } from "drizzle-orm";

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

    // Also keep the founder_profiles snapshot in sync so the dashboard,
    // /profile, and /vantage all read the same vantagePoint / fundability
    // value. Without this sync, the dashboard's "founder.vantagePoint"
    // can drift behind the latest assessment and contradict the Vantage
    // page's headline score.
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
      // Non-fatal — the assessment was saved, the profile sync is best-effort.
      app.log?.warn?.({ err }, "founder profile sync after vantage submit failed");
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