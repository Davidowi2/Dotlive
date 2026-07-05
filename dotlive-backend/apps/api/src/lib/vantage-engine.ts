/**
 * Vantage Engine
 *
 * Computes a user's Vantage score (0-1000) from activity signals:
 *   academy, work, stake, challenge, pitchathon, assessment
 *
 * Writes the result to founder_profiles as the canonical score.
 * Does NOT modify existing vantage route behavior.
 */

import { db } from "../db/client.js";
import { founderProfiles } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

export interface VantageSignal {
  source:
    | "academy"
    | "work"
    | "stake"
    | "challenge"
    | "pitchathon"
    | "assessment"
    | "connection"
    | "profile";
  event: string;
  weight?: number; // override default weight for this event
  metadata?: Record<string, unknown>;
}

interface VantageComputeInput {
  userId: string;
  signals: VantageSignal[];
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  course: 25,
  cohort: 75,
  gig_complete: 10,
  milestone_10: 50,
  milestone_50: 100,
  stake: 5, // per 1000 DOT
  challenge_win: 20,
  challenge_participate: 5,
  pitchathon_1: 150,
  pitchathon_2: 120,
  pitchathon_3: 100,
  pitchathon_4_10: 80,
  pitchathon_participate: 10,
  assessment: 0, // handled separately
  connection_accepted: 15,
  profile_complete: 50,
};

export async function computeVantage(
  app: FastifyInstance,
  input: VantageComputeInput
): Promise<{ score: number; vantagePoint: number; fundability: number; investmentReadiness: number; stage: string | null } | null> {
  const { userId, signals } = input;

  // Fetch current profile for base + stage
  const [current] = await db
    .select()
    .from(founderProfiles)
    .where(eq(founderProfiles.userId, userId))
    .limit(1);

  const base = Number(current?.vantagePoint ?? 0);
  const fundability = Number(current?.fundability ?? 0);
  const investmentReadiness = Number(current?.investmentReadiness ?? 0);
  const stage = current?.stage ?? "Assess";

  let delta = 0;
  let newFundability = fundability;
  let newInvestmentReadiness = investmentReadiness;

  for (const sig of signals) {
    if (sig.source === "assessment") continue; // handled elsewhere

    const key = `${sig.source}_${sig.event}`;
    const weight = sig.weight ?? DEFAULT_WEIGHTS[key] ?? 0;

    if (sig.source === "stake" && sig.metadata?.amountDot) {
      const pts = Math.min(Math.floor((sig.metadata.amountDot as number) / 1000) * weight, 50);
      delta += pts;
    } else if (sig.source === "pitchathon" && typeof sig.metadata?.placement === "number") {
      const p = sig.metadata.placement as number;
      let pts = 0;
      if (p === 1) pts = 150;
      else if (p === 2) pts = 120;
      else if (p === 3) pts = 100;
      else if (p >= 4 && p <= 10) pts = 80;
      else pts = 10;
      delta += pts;
      newInvestmentReadiness = Math.min(1000, newInvestmentReadiness + (p <= 3 ? 30 : 10));
    } else {
      delta += weight;
    }

    if (["course", "cohort", "gig_complete", "milestone_10", "milestone_50"].includes(key)) {
      newFundability = Math.min(1000, newFundability + Math.floor(weight / 2));
    }
    if (["pitchathon_1", "pitchathon_2", "pitchathon_3"].includes(key)) {
      newInvestmentReadiness = Math.min(1000, newInvestmentReadiness + 20);
    }
  }

  const newScore = Math.max(0, Math.min(1000, base + delta));

  await db.execute(sql`
    INSERT INTO founder_profiles
      (user_id, vantage_point, fundability, investment_readiness, stage, updated_at)
    VALUES
      (${userId}, ${newScore}, ${newFundability}, ${newInvestmentReadiness}, ${stage}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      vantage_point = EXCLUDED.vantage_point,
      fundability = EXCLUDED.fundability,
      investment_readiness = EXCLUDED.investment_readiness,
      updated_at = NOW()
  `);

  const [updated] = await db
    .select()
    .from(founderProfiles)
    .where(eq(founderProfiles.userId, userId))
    .limit(1);

  if (!updated) return null;

  try {
    (app as any).eventEmitter?.emit?.("vantage:updated", {
      userId,
      previous: current,
      current: updated,
      delta,
    });
  } catch {
    // event emitter optional
  }

  return {
    score: newScore,
    vantagePoint: Number(updated.vantagePoint ?? newScore),
    fundability: Number(updated.fundability ?? newFundability),
    investmentReadiness: Number(updated.investmentReadiness ?? newInvestmentReadiness),
    stage: updated.stage ?? stage,
  };
}

/** Convenience: recompute from all available live sources for a user. */
export async function recomputeVantageFromSources(app: FastifyInstance, userId: string): Promise<ReturnType<typeof computeVantage>> {
  const [profile] = await db.select().from(founderProfiles).where(eq(founderProfiles.userId, userId)).limit(1);
  const signals: VantageSignal[] = [];

  if (!profile) {
    signals.push({
      source: "profile",
      event: "complete",
      weight: 50,
    });
  }

  // This is intentionally minimal — each service should call computeVantage()
  // at event time. This helper exists for admin/cron re-syncs.
  return computeVantage(app, { userId, signals });
}
