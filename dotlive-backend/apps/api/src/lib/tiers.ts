/**
 * Tier pricing + helpers.
 *
 *   builder         → free, default. Cannot be purchased.
 *   founder         → 5,000 DOT / 365 days.
 *   capital_partner → 25,000 DOT / 365 days.
 *   operator        → internal only, not buyable.
 *
 * The pricing table is intentionally a `const` object so the frontend
 * (which has its own mirror) and the backend can't drift. If you add
 * a tier, update BOTH sides.
 */

export const TIER_PRICING = {
  founder: {
    dot: 5_000,
    label: "Founder",
    durationDays: 365,
    description: "Create ventures, submit pitches, get the Founder badge.",
    features: [
      "Create up to 5 ventures",
      "Submit to pitchathons",
      "Founder badge on profile",
      "Direct messaging with investors",
    ],
  },
  capital_partner: {
    dot: 25_000,
    label: "Capital Partner",
    durationDays: 365,
    description: "See the deal flow, invest, and surface ventures in front of LPs.",
    features: [
      "See the full deal flow",
      "Invest in ventures directly",
      "Capital Partner badge on profile",
      "Priority support",
    ],
  },
} as const;

export type PurchasableTier = keyof typeof TIER_PRICING;
export type TierName = PurchasableTier | "builder" | "operator";

const PURCHASABLE = new Set<string>(Object.keys(TIER_PRICING));

export function isPurchasableTier(tier: string): tier is PurchasableTier {
  return PURCHASABLE.has(tier);
}

export function tierCost(tier: PurchasableTier): number {
  return TIER_PRICING[tier].dot;
}

export function tierDurationDays(tier: PurchasableTier): number {
  return TIER_PRICING[tier].durationDays;
}

/** Day difference (b - a) in whole days. */
export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}
