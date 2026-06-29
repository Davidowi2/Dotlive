import { JOURNEY_STAGES, type JourneyStage } from "./constants";

export interface VantageQuestion {
  id: string;
  text: string;
  /** Helper copy shown below the question to explain what each end means. */
  help?: { low: string; high: string };
}

export interface VantageCategory {
  key: string;
  label: string;
  /** Percentage weight of overall score. All weights must sum to 100. */
  weight: number;
  questions: VantageQuestion[];
}

/**
 * 4 dimensions × 3 questions = 12.
 * Each dimension is what an investor looks at first when reviewing a
 * venture profile. Replaces the previous 27-question "self-rating" form
 * (Tier 1) which read like Instagram polls.
 *
 * Scale: 1 (Very low) → 5 (Very high).  See vantage.tsx SCALE.
 */
export const VANTAGE_CATEGORIES: VantageCategory[] = [
  {
    key: "founder",
    label: "Founder",
    weight: 30,
    questions: [
      {
        id: "founder_commitment",
        text: "How committed is the founder to this venture full-time?",
        help: { low: "Side project", high: "Quit job, full-time, no plan B" },
      },
      {
        id: "founder_experience",
        text: "How directly relevant is the founder's experience to this problem?",
        help: { low: "First time in industry", high: "10+ years in this exact space" },
      },
      {
        id: "founder_team",
        text: "How strong is the founding team (skills, complementarity, track record)?",
        help: { low: "Solo founder", high: "Repeat founders, complementary skills" },
      },
    ],
  },
  {
    key: "traction",
    label: "Traction",
    weight: 30,
    questions: [
      {
        id: "traction_revenue",
        text: "What does annual revenue look like today?",
        help: { low: "Pre-revenue", high: "₦50M+ ARR" },
      },
      {
        id: "traction_customers",
        text: "How many paying customers do you have?",
        help: { low: "0", high: "1000+ recurring" },
      },
      {
        id: "traction_growth",
        text: "How fast is the business growing month-over-month?",
        help: { low: "Flat", high: ">20% MoM" },
      },
    ],
  },
  {
    key: "market",
    label: "Market",
    weight: 20,
    questions: [
      {
        id: "market_size",
        text: "How large is the addressable market you're going after?",
        help: { low: "Local niche", high: "$1B+ SAM" },
      },
      {
        id: "market_competition",
        text: "How clearly do you understand your competitive landscape?",
        help: { low: "Vague", high: "Deep moat / network effects" },
      },
      {
        id: "market_timing",
        text: "Why is now the right time for this market?",
        help: { low: "Just an idea", high: "Tailwind (regulation, tech, behaviour)" },
      },
    ],
  },
  {
    key: "capital",
    label: "Capital",
    weight: 20,
    questions: [
      {
        id: "capital_runway",
        text: "How many months of runway does the business currently have?",
        help: { low: "<3 months", high: "12+ months" },
      },
      {
        id: "capital_need",
        text: "How clearly defined is your capital need (use of funds)?",
        help: { low: "Vague", high: "Tied to specific milestones" },
      },
      {
        id: "capital_history",
        text: "Have you raised capital before?",
        help: { low: "First raise", high: "Multiple rounds, notable investors" },
      },
    ],
  },
];

export interface VantageAnswers {
  [questionId: string]: number; // 1-5
}

export const TOTAL_QUESTIONS = VANTAGE_CATEGORIES.reduce(
  (sum, c) => sum + c.questions.length,
  0,
);

/**
 * Maps a Vantage score (0–1000) to one of the founder journey stages.
 * Mirrors what the assessor report shows.
 */
export function vantageStageFromScore(score: number): JourneyStage {
  if (score >= 850) return "Scale" as JourneyStage;
  if (score >= 700) return "Fund" as JourneyStage;
  if (score >= 550) return "Pitch" as JourneyStage;
  if (score >= 400) return "Improve" as JourneyStage;
  if (score >= 250) return "Validate" as JourneyStage;
  return "Assess" as JourneyStage;
}

/**
 * Convenience: which JourneyStage should be displayed for the user
 * given their vantagePoint. Delegates to vantageStageFromScore.
 */
export function journeyStageForScore(score: number): JourneyStage {
  return vantageStageFromScore(score);
}

/**
 * Calculates the per-category average for each VantageCategory given
 * the answers. Skips unanswered questions.
 */
export function categoryScores(answers: VantageAnswers): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cat of VANTAGE_CATEGORIES) {
    const vals: number[] = [];
    for (const q of cat.questions) {
      const v = answers[q.id];
      if (typeof v === "number" && v >= 1 && v <= 5) vals.push(v);
    }
    if (vals.length === 0) out[cat.key] = 0;
    else out[cat.key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 20); // 0..100
  }
  return out;
}

/**
 * Composite 0..1000 vantage point from weighted category scores.
 * Each category score is 0..100; weights are percentages.
 */
export function vantagePointFromScores(scores: Record<string, number>): number {
  let weighted = 0;
  for (const cat of VANTAGE_CATEGORIES) {
    weighted += (scores[cat.key] ?? 0) * cat.weight;
  }
  // weighted is already 0..10000; map to 0..1000
  return Math.round(weighted / 10);
}

/** Fundability % = traction + capital weighted average, 0..100. */
export function fundabilityFromScores(scores: Record<string, number>): number {
  const t = scores["traction"] ?? 0;
  const c = scores["capital"] ?? 0;
  return Math.round(t * 0.6 + c * 0.4);
}

/**
 * Server-side combined computation: returns all derived scores + a
 * basic diagnostic report. Used by vantage.server.ts to prevent
 * client-side score manipulation before DB insert.
 */
export function computeVantage(answers: VantageAnswers) {
  const scores = categoryScores(answers);
  const vantagePoint = vantagePointFromScores(scores);
  const fundability = fundabilityFromScores(scores);
  const investmentReadiness = scores["market"] ?? 0;
  const stage = vantageStageFromScore(vantagePoint);
  const report = {
    strengths: Object.entries(scores)
      .filter(([, v]) => v >= 75)
      .map(([k]) => k),
    weaknesses: Object.entries(scores)
      .filter(([, v]) => v < 50)
      .map(([k]) => k),
    nextActions: [
      vantagePoint < 400
        ? "Recruit at least one co-founder with relevant industry experience."
        : vantagePoint < 550
        ? "Run a structured customer-discovery round (10+ interviews) before pitching."
        : vantagePoint < 700
        ? "Define a clear 12-month revenue plan with milestone-based projections."
        : "Apply to DOT Demo — you're investor-ready.",
    ],
    stage,
  };
  return {
    categoryScores: scores,
    vantagePoint,
    fundability,
    investmentReadiness,
    stage,
    report,
    score: vantagePoint,
  };
}

/** Investment readiness 0..100 = market + founder weighted, but penalised by capital. */
export function investmentReadinessFromScores(scores: Record<string, number>): number {
  const m = scores["market"] ?? 0;
  const f = scores["founder"] ?? 0;
  const c = scores["capital"] ?? 0;
  return Math.round((m * 0.4 + f * 0.4 + c * 0.2));
}

export { JOURNEY_STAGES };