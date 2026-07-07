/**
 * Vouch display + list utilities.
 *
 * - `decayAdjustedScore` applies 1% decay per 30 days since vouch creation.
 * - `vouchSummary` is a pure aggregation: count, gross, decayed.
 * - These functions are also used by `useVantage` to add the vouch component
 *   to the user's Vantage point.
 */

import type { Vouch } from "@/hooks/use-vouches";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Vouch decay: 1% loss per 30 days, compounded. */
export function vouchDecayFactor(createdAt: string | Date): number {
  const t = typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  if (!Number.isFinite(t)) return 1;
  const days = (Date.now() - t) / MS_PER_DAY;
  if (days <= 0) return 1;
  return Math.pow(0.99, days / 30);
}

/** Score with decay applied. Clamped to >= 0. */
export function decayedVouchScore(v: Vouch): number {
  return Math.max(0, Math.round(v.score * vouchDecayFactor(v.createdAt)));
}

export interface VouchSummary {
  count: number;
  totalRaw: number;       // sum of v.score (no decay)
  totalDecayed: number;   // sum of decayed scores
}

export function vouchSummary(vouches: Vouch[]): VouchSummary {
  let totalRaw = 0;
  let totalDecayed = 0;
  for (const v of vouches) {
    totalRaw += v.score;
    totalDecayed += decayedVouchScore(v);
  }
  return {
    count: vouches.length,
    totalRaw,
    totalDecayed: Math.round(totalDecayed),
  };
}

/** Cap at 500 (per the spec). */
export const VOUCH_VANTAGE_CAP = 500;
