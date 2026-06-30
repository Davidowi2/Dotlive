import { JOURNEY_STAGES, type JourneyStage } from "./constants";

/**
 * Vantage question kinds.
 *
 *   - "likert"  — 5-point subjective slider (kept for things you can't quantify,
 *                 like founder conviction)
 *   - "number"  — structured numeric input (e.g. "monthly paying users")
 *   - "select"  — discrete options (e.g. employment status)
 *   - "text"    — short free-text response (e.g. "what's the moat?")
 *
 * Each question carries a `score(value) → 0..100` function so the scoring
 * layer is centralized in this file.
 */
export type VantageQuestionKind = "likert" | "number" | "select" | "text";

export interface VantageQuestionOption {
  value: string;
  label: string;
  /** Score (0..100) for this option. */
  score: number;
}

export interface VantageQuestion {
  id: string;
  text: string;
  /** What kind of input this question takes. Defaults to "likert". */
  kind?: VantageQuestionKind;
  /** Helper copy shown below the question (only used for likert). */
  help?: { low: string; high: string };
  /** For "number" — bounds + scoring curve metadata. */
  numberMeta?: {
    /** Where the score should hit its floor (default 0). */
    minScore?: number;
    /** Where the score should hit 100. Values above still score 100. */
    maxAt: number;
    /** Optional unit suffix (e.g. "₦/mo", "%"). */
    suffix?: string;
    /** Placeholder for the input. */
    placeholder?: string;
  };
  /** For "select" — discrete options. */
  options?: VantageQuestionOption[];
  /** For "text" — what to put in the textarea. */
  textMeta?: {
    placeholder?: string;
    maxLength?: number;
  };
}

export interface VantageCategory {
  key: string;
  label: string;
  description?: string;
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
  /* ---------------- 1. FOUNDER (35%) — 2 questions ---------------------- *
   * Personal commitment + track record. Highest weight because investors
   * bet on people first.                                                  */
  {
    key: "founder",
    label: "Founder",
    description: "Who is building this and how committed are they, personally?",
    weight: 35,
    questions: [
      {
        id: "founder_conviction",
        text: "How committed are you, personally, to this venture?",
        kind: "likert",
        help: {
          low: "Open exploration — not the main thing I'm focused on",
          high: "All-in, full-time, committed for the next 5+ years",
        },
      },
      {
        id: "founder_commitment_status",
        text: "What is your current employment status?",
        kind: "select",
        options: [
          { value: "ft_elsewhere",          label: "Full-time at another job",        score: 10 },
          { value: "pt_venture",            label: "Part-time on this venture",       score: 30 },
          { value: "ft_venture",            label: "Full-time on this venture",       score: 80 },
          { value: "ft_venture_with_revenue", label: "Full-time + earning revenue",   score: 100 },
        ],
      },
    ],
  },

  /* ---------------- 2. TRACTION (30%) — 2 questions --------------------- *
   * Two signals matter most: paying users + month-over-month growth.       */
  {
    key: "traction",
    label: "Traction",
    description: "Hard numbers — paying customers + growth.",
    weight: 30,
    questions: [
      {
        id: "traction_paying_users",
        text: "How many paying customers do you have right now?",
        kind: "number",
        numberMeta: {
          maxAt: 100,
          placeholder: "e.g. 25",
          suffix: "customers",
        },
      },
      {
        id: "traction_mom_growth_pct",
        text: "Month-over-month revenue or user growth (%)",
        kind: "number",
        numberMeta: {
          maxAt: 25,
          placeholder: "e.g. 8",
          suffix: "%",
        },
      },
    ],
  },

  /* ---------------- 3. CAPITAL (20%) — 2 questions ---------------------- *
   * Runway + how much has been raised to date.                            */
  {
    key: "capital",
    label: "Capital",
    description: "Runway and how much you've raised.",
    weight: 20,
    questions: [
      {
        id: "capital_runway_months",
        text: "Months of runway remaining",
        kind: "number",
        numberMeta: {
          maxAt: 18,
          placeholder: "e.g. 9",
          suffix: "months",
        },
      },
      {
        id: "capital_total_raised_dot",
        text: "Total capital raised to date (DOT)",
        kind: "number",
        numberMeta: {
          maxAt: 1_000_000,
          placeholder: "e.g. 250000",
          suffix: "DOT",
        },
      },
    ],
  },

  /* ---------------- 4. MARKET (15%) — 2 questions ----------------------- *
   * Why now + what's your moat. One short text answer.                    */
  {
    key: "market",
    label: "Market",
    description: "Why is now the right time — and what stops competitors?",
    weight: 15,
    questions: [
      {
        id: "market_timing",
        text: "Why is now the right time for this venture?",
        kind: "likert",
        help: {
          low: "Just an idea — no specific tailwind",
          high: "Strong tailwind (regulation, technology, behaviour shift)",
        },
      },
      {
        id: "market_moat",
        text: "What is your competitive moat — why will you win?",
        kind: "text",
        textMeta: {
          placeholder:
            "One short paragraph. What's hard for competitors to copy about your position?",
          maxLength: 500,
        },
      },
    ],
  },
];

/**
 * Vantage answers are typed per-question-kind:
 *   - likert: number 1..5
 *   - number: number
 *   - select: string (option value)
 *   - text:   string
 */
export type VantageAnswerValue = number | string;
export interface VantageAnswers {
  [questionId: string]: VantageAnswerValue | undefined;
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
/**
 * Per-question scoring function. Returns 0..100 for an answer.
 * Centralized so the schema is the source of truth.
 */
export function scoreQuestion(q: VantageQuestion, value: VantageAnswerValue | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  const kind = q.kind ?? "likert";

  if (kind === "likert") {
    // 1..5 → 0..100 (linear, score 0 means 0 reported)
    const v = Number(value);
    if (Number.isNaN(v) || v < 1) return 0;
    if (v > 5) return 100;
    return (v - 1) * 25;
  }

  if (kind === "number") {
    const v = Number(value);
    if (Number.isNaN(v) || v <= 0) return 0;
    const meta = q.numberMeta!;
    const max = meta.maxAt;
    const pct = (v / max) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  if (kind === "select") {
    const opt = q.options?.find((o) => o.value === value);
    if (!opt) return 0;
    return opt.score;
  }

  if (kind === "text") {
    // Text alone doesn't move the dial. But the *presence* of a thoughtful
    // answer (long enough) adds 20 points so the assessor report surfaces
    // the gap if the founder didn't bother writing one.
    const s = String(value).trim();
    if (s.length === 0) return 0;
    if (s.length < 30) return 5;
    if (s.length < 80) return 15;
    return 25;
  }

  return 0;
}

/**
 * Calculates the per-category average (0..100) for each VantageCategory
 * given the answers. Skips unanswered questions. Treats 0-score as "did not answer".
 */
export function categoryScores(answers: VantageAnswers): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cat of VANTAGE_CATEGORIES) {
    const vals: number[] = [];
    for (const q of cat.questions) {
      const v = answers[q.id];
      if (v === undefined) continue;
      const s = scoreQuestion(q, v);
      if (s > 0) vals.push(s);
    }
    if (vals.length === 0) out[cat.key] = 0;
    else out[cat.key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
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