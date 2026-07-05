/**
 * Vantage Sync Service
 * 
 * Single source of truth for updating a user's Vantage score and related metrics.
 * Called from: Academy (cert completion), DOT Work (gig completion), 
 * Pitchathon (placement), Wallet (stake), Community (challenge win).
 * 
 * Writes to: founder_profiles (snapshot), emits event for real-time updates.
 */

import { db } from "../db/client.js";
import { founderProfiles } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

export interface VantageUpdateInput {
  userId: string;
  source: "academy" | "work" | "pitchathon" | "stake" | "challenge" | "assessment";
  delta?: {
    vantagePoint?: number;
    fundability?: number;
    investmentReadiness?: number;
    stage?: string;
  };
  // For assessment source - absolute values
  absolute?: {
    vantagePoint?: number;
    fundability?: number;
    investmentReadiness?: number;
    stage?: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Centralized Vantage update function.
 * Call this from ANY service that should affect a user's Vantage score.
 * 
 * @param app - Fastify instance (for logging/events)
 * @param input - Update parameters
 * @returns Updated profile snapshot
 */
export async function updateVantage(
  app: FastifyInstance,
  input: VantageUpdateInput
): Promise<{
  userId: string;
  vantagePoint: number;
  fundability: number;
  investmentReadiness: number;
  stage: string | null;
  updatedAt: Date;
} | null> {
  const { userId, source, delta, absolute, metadata } = input;

  try {
    // Fetch current profile
    const [current] = await db
      .select()
      .from(founderProfiles)
      .where(eq(founderProfiles.userId, userId))
      .limit(1);

    const now = new Date();

    if (absolute && (absolute.vantagePoint !== undefined || absolute.fundability !== undefined || absolute.investmentReadiness !== undefined)) {
          // Assessment source: use absolute values (recompute)
          await db.execute(sql`
            INSERT INTO founder_profiles
              (user_id, vantage_point, fundability, investment_readiness, stage, updated_at)
            VALUES
              (${userId}, ${absolute.vantagePoint ?? 0}, ${absolute.fundability ?? 0}, ${absolute.investmentReadiness ?? 0}, ${absolute.stage ?? current?.stage ?? "Assess"}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              vantage_point = EXCLUDED.vantage_point,
              fundability = EXCLUDED.fundability,
              investment_readiness = EXCLUDED.investment_readiness,
              stage = EXCLUDED.stage,
              updated_at = NOW()
          `);

          const [updated] = await db
            .select()
            .from(founderProfiles)
            .where(eq(founderProfiles.userId, userId))
            .limit(1);

          // Emit event for real-time UI updates (if event emitter is available)
          try {
            (app as any).eventEmitter?.emit?.("vantage:updated", {
              userId,
              source,
              previous: current,
              current: updated,
              metadata,
              timestamp: now,
            });
          } catch {
            // Event emitter not available - ignore
          }

          return updated;
        }

        if (delta && (delta.vantagePoint !== undefined || delta.fundability !== undefined || delta.investmentReadiness !== undefined)) {
          // Incremental source: apply deltas
          await db.execute(sql`
            INSERT INTO founder_profiles
              (user_id, vantage_point, fundability, investment_readiness, stage, updated_at)
            VALUES
              (${userId}, ${(current?.vantagePoint ?? 0) + (delta.vantagePoint ?? 0)}, ${(current?.fundability ?? 0) + (delta.fundability ?? 0)}, ${(current?.investmentReadiness ?? 0) + (delta.investmentReadiness ?? 0)}, ${delta.stage ?? current?.stage ?? "Assess"}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              vantage_point = founder_profiles.vantage_point + ${delta.vantagePoint ?? 0},
              fundability = founder_profiles.fundability + ${delta.fundability ?? 0},
              investment_readiness = founder_profiles.investment_readiness + ${delta.investmentReadiness ?? 0},
              stage = ${delta.stage ?? sql`founder_profiles.stage`},
              updated_at = NOW()
          `);

          const [updated] = await db
            .select()
            .from(founderProfiles)
            .where(eq(founderProfiles.userId, userId))
            .limit(1);

          // Emit event for real-time UI updates (if event emitter is available)
          try {
            (app as any).eventEmitter?.emit?.("vantage:updated", {
              userId,
              source,
              previous: current,
              current: updated,
              metadata,
              timestamp: now,
            });
          } catch {
            // Event emitter not available - ignore
          }

          return updated;
        }

    // No valid update params
    app.log?.warn?.({ input }, "updateVantage called with no delta or absolute values");
    return current ?? null;

  } catch (err) {
    app.log?.error?.({ err, input }, "updateVantage failed");
    throw err;
  }
}

/**
 * Convenience functions for common sources
 */

export async function updateVantageFromAcademy(
  app: FastifyInstance,
  userId: string,
  type: "course" | "cohort",
  metadata?: Record<string, unknown>
) {
  const deltas = {
    course: { vantagePoint: 25 },
    cohort: { vantagePoint: 75 },
  };
  return updateVantage(app, {
    userId,
    source: "academy",
    delta: deltas[type],
    metadata: { type, ...metadata },
  });
}

export async function updateVantageFromWork(
  app: FastifyInstance,
  userId: string,
  type: "gig_complete" | "milestone_10" | "milestone_50",
  metadata?: Record<string, unknown>
) {
  const deltas = {
    gig_complete: { vantagePoint: 10 },
    milestone_10: { vantagePoint: 50 },
    milestone_50: { vantagePoint: 100 },
  };
  return updateVantage(app, {
    userId,
    source: "work",
    delta: deltas[type],
    metadata: { type, ...metadata },
  });
}

export async function updateVantageFromPitchathon(
  app: FastifyInstance,
  userId: string,
  placement: number, // 1 = 1st place, etc.
  metadata?: Record<string, unknown>
) {
  const deltas: Record<number, { vantagePoint: number }> = {
    1: { vantagePoint: 150 },
    2: { vantagePoint: 120 },
    3: { vantagePoint: 100 },
    4: { vantagePoint: 80 },
    5: { vantagePoint: 60 },
    6: { vantagePoint: 50 },
    7: { vantagePoint: 40 },
    8: { vantagePoint: 30 },
    9: { vantagePoint: 20 },
    10: { vantagePoint: 15 },
  };
  return updateVantage(app, {
    userId,
    source: "pitchathon",
    delta: deltas[placement] ?? { vantagePoint: 10 },
    metadata: { placement, ...metadata },
  });
}

export async function updateVantageFromStake(
  app: FastifyInstance,
  userId: string,
  amountDot: number,
  targetType: "venture" | "gig",
  metadata?: Record<string, unknown>
) {
  // 5 pts per 1,000 DOT staked
  const vantagePoints = Math.floor(amountDot / 1000) * 5;
  return updateVantage(app, {
    userId,
    source: "stake",
    delta: { vantagePoint: Math.min(vantagePoints, 50) }, // Cap at 50 per stake
    metadata: { amountDot, targetType, ...metadata },
  });
}

export async function updateVantageFromChallenge(
  app: FastifyInstance,
  userId: string,
  type: "win" | "participate",
  metadata?: Record<string, unknown>
) {
  const deltas = {
    win: { vantagePoint: 20 },
    participate: { vantagePoint: 5 },
  };
  return updateVantage(app, {
    userId,
    source: "challenge",
    delta: deltas[type],
    metadata: { type, ...metadata },
  });
}

export async function updateVantageFromAssessment(
  app: FastifyInstance,
  userId: string,
  assessment: {
    vantagePoint: number;
    fundability: number;
    investmentReadiness: number;
    stage?: string;
  }
) {
  return updateVantage(app, {
    userId,
    source: "assessment",
    absolute: assessment,
  });
}