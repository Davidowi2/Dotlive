import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Gauge,
  Loader2,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Award,
  Compass,
  Briefcase,
  Rocket,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submitAssessment, getVantageHistory } from "@/api/vantage";
import {
  VANTAGE_CATEGORIES,
  TOTAL_QUESTIONS,
  type VantageAnswers,
} from "@/lib/vantage";
import { formatDot } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vantage")({
  head: () => ({
    meta: [
      { title: "Vantage — DOT" },
      { name: "description", content: "Measure your venture with the Vantage assessment." },
    ],
  }),
  component: VantagePage,
});

const SCALE = [
  { v: 1, label: "Very low" },
  { v: 2, label: "Low" },
  { v: 3, label: "Medium" },
  { v: 4, label: "High" },
  { v: 5, label: "Very high" },
];

const FLAT_QUESTIONS = VANTAGE_CATEGORIES.flatMap((c) =>
  c.questions.map((q) => ({ ...q, category: c.label })),
);

// ─── Hero "5 pillars" rollup ─────────────────────────────────────
// Maps the 9 underlying Vantage categories into 5 investor-facing pillars.
// Each pillar shows a curated subset of categories, averaged into one score.
interface Pillar {
  key: string;
  label: string;
  icon: typeof Compass;
  // Underlying VANTAGE_CATEGORIES keys this pillar aggregates.
  sources: string[];
}

const PILLARS: Pillar[] = [
  {
    key: "quality",
    label: "Quality",
    icon: Award,
    sources: ["product", "problem", "validation"],
  },
  {
    key: "founder",
    label: "Founder Readiness",
    icon: Compass,
    sources: ["founder", "team"],
  },
  {
    key: "market",
    label: "Market Strength",
    icon: Layers,
    sources: ["market", "scalability"],
  },
  {
    key: "fundability",
    label: "Fundability",
    icon: Briefcase,
    sources: ["revenue", "investment_readiness"],
  },
  {
    key: "execution",
    label: "Execution",
    icon: Rocket,
    sources: ["product", "validation", "scalability"],
  },
];

function pillarScore(
  sources: string[],
  categoryScores: Record<string, number> | undefined,
): number {
  if (!categoryScores) return 0;
  // Build a case-insensitive lookup. The frontend stores categoryScores keyed
  // by the Title-Case label (e.g. "Team", "Product"), but PILLARS.sources
  // uses question-id prefixes in lower-snake_case (e.g. "team", "product").
  const lower = new Map<string, number>();
  for (const [k, v] of Object.entries(categoryScores)) {
    if (typeof v === "number") {
      lower.set(k.toLowerCase().trim(), v);
      // Also strip spaces so "Investment Readiness" → "investmentreadiness"
      // matches "investment_readiness" via the underscore replacement below.
      lower.set(k.toLowerCase().replace(/\s+/g, "").replace(/-/g, ""), v);
    }
  }
  const vals = sources
    .map((k) => {
      const norm = k.toLowerCase().replace(/_/g, "");
      return lower.get(norm);
    })
    .filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ─── Accent resolution ────────────────────────────────────────────
// gold for premium tier (700+), red for low (<400), primary otherwise.
function vantageAccent(score: number): "gold" | "destructive" | "primary" {
  if (score >= 700) return "gold";
  if (score < 400) return "destructive";
  return "primary";
}

function vantageTier(score: number): {
  label: string;
  blurb: string;
} {
  if (score >= 700)
    return {
      label: "Investor-ready",
      blurb: "Above the 700-point line — investors can act on this.",
    };
  if (score >= 550)
    return {
      label: "Pitch-ready",
      blurb: "Strong foundation. Sharpen weaknesses before approaching capital.",
    };
  if (score >= 400)
    return {
      label: "Building",
      blurb: "Solid core. Close key gaps to reach investor-ready.",
    };
  return {
    label: "Early",
    blurb: "Foundations being laid. Focus on validation and founder readiness.",
  };
}

function VantagePage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["assessments", user?.id],
    enabled: !!user,
    queryFn: getVantageHistory,
  });
  const [taking, setTaking] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<VantageAnswers>({});
  const [busy, setBusy] = useState(false);

  // Backend returns newest-first (desc createdAt), so the LATEST assessment
    // is index 0, not the last element. Without this, the page shows stale data.
    const latest = assessments[0];
    const previous = assessments.length >= 2 ? assessments[1] : undefined;

    const history = useMemo(
      () =>
        // Reverse so the chart shows oldest → newest left-to-right.
        [...assessments]
          .reverse()
          .map((a) => ({
            date: new Date(a.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
            vantage: a.vantagePoint,
            fundability: a.fundability,
          })),
      [assessments],
    );

  const current = FLAT_QUESTIONS[idx];
  const progress = ((idx + (answers[current?.id] ? 1 : 0)) / TOTAL_QUESTIONS) * 100;
  const answeredAll = FLAT_QUESTIONS.every((q) => answers[q.id]);

  function setAnswer(v: number) {
    setAnswers((a) => ({ ...a, [current.id]: v }));
    if (idx < FLAT_QUESTIONS.length - 1) {
      setTimeout(() => setIdx((i) => i + 1), 150);
    }
  }

  async function submit() {
    if (!user || !answeredAll) return;
    setBusy(true);
    try {
      // Compute per-category scores (each answer is 1-5, scaled to 0-100)
      const categoryScores: Record<string, number> = {};
      for (const cat of VANTAGE_CATEGORIES) {
        const items = cat.questions.map((q) => answers[q.id]).filter((v): v is number => typeof v === "number");
        if (items.length > 0) {
          const avg = items.reduce((a, b) => a + b, 0) / items.length; // 1-5
          categoryScores[cat.label] = Math.round(((avg - 1) / 4) * 100); // 0-100
        }
      }

      // Composite scores
      const allValues = Object.values(categoryScores);
      const score = allValues.length > 0
        ? Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length)
        : 0; // 0-100

      // Vantage Point is the user-facing 0-1000 score
      const vantagePoint = score * 10;

      // Fundability = weighted pillar score from "fundability" categories
      const fundabilitySources = ["revenue", "investment_readiness"];
      const fundabilityVals = fundabilitySources
        .map((k) => categoryScores[VANTAGE_CATEGORIES.find((c) => c.questions.some((q) => q.id === k))?.label ?? ""])
        .filter((v): v is number => typeof v === "number");
      const fundability = fundabilityVals.length > 0
        ? Math.round(fundabilityVals.reduce((a, b) => a + b, 0) / fundabilityVals.length)
        : 0;

      // Investment readiness = weighted score from investment_readiness category
      const irLabel = VANTAGE_CATEGORIES.find((c) => c.questions.some((q) => q.id === "investment_readiness"))?.label ?? "";
      const investmentReadiness = categoryScores[irLabel] ?? 0;

      // Stage from score (matches the spec)
            let stage = "Assess";
            if (score >= 80) stage = "Scale";
            else if (score >= 60) stage = "Fund";
            else if (score >= 40) stage = "Build";
            else if (score >= 20) stage = "Validate";

            // Build a venture report — strengths / weaknesses / nextActions
            // derived from categoryScores. Strong = score >= 75, weak = < 50.
            const sortedCats = Object.entries(categoryScores)
              .map(([label, score]) => ({ label, score }))
              .sort((a, b) => b.score - a.score);
            const strengths = sortedCats.filter((c) => c.score >= 75).slice(0, 3);
            const weaknesses = sortedCats.filter((c) => c.score < 50).slice(0, 3);
            const nextActions: string[] = [];
            if (weaknesses.length > 0) {
              nextActions.push(
                `Improve your weakest area: ${weaknesses[0].label} (currently ${weaknesses[0].score}%). Focus on getting this above 60.`,
              );
            }
            if (score < 40) {
              nextActions.push(
                "Recruit at least one co-founder or key advisor with relevant industry experience.",
              );
            } else if (score < 60) {
              nextActions.push(
                "Run a structured customer-discovery round (10+ interviews) to validate demand before pitching.",
              );
            } else if (score < 80) {
              nextActions.push(
                "Define a clear 12-month revenue plan with milestone-based projections.",
              );
            } else {
              nextActions.push(
                "Apply to DOT Demo or pitch your strongest capital partner — you're investor-ready.",
              );
            }
            if (strengths.length > 0) {
              nextActions.push(
                `Lean into your strength: ${strengths[0].label} (${strengths[0].score}%). Use it as the headline of your next pitch.`,
              );
            }
            const report = { strengths, weaknesses, nextActions, stage };

            const result = await submitAssessment({
              answers: answers as Record<string, number>,
              categoryScores,
              score,
              vantagePoint,
              fundability,
              investmentReadiness,
              stage,
              report,
            });
      toast.success(`Vantage complete! You scored ${result.vantagePoint} points.`);
      qc.invalidateQueries({ queryKey: ["assessments", user.id] });
      qc.invalidateQueries({ queryKey: ["founder_profile", user.id] });
      qc.invalidateQueries({ queryKey: ["vantage"] });
      setTaking(false);
      setIdx(0);
      setAnswers({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save assessment");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.StatCards count={3} />
        <PageSkeleton.CategoryBreakdown />
      </AppShell>
    );
  }

  // ===== Assessment flow =====
  if (taking) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{current.category}</span>
              <span>{idx + 1} / {TOTAL_QUESTIONS}</span>
            </div>
            <Progress value={progress} className="mt-2" />
          </div>

          <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-light">{current.text}</h2>
            <div className="mt-6 grid gap-2">
              {SCALE.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setAnswer(s.v)}
                  className={cn(
                    "flex items-center justify-between rounded-sm border p-4 text-left transition-all hover:border-primary/50",
                    answers[current.id] === s.v ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="font-display text-sm text-muted-foreground">{s.v}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              {idx === FLAT_QUESTIONS.length - 1 ? (
                <Button variant="hero" onClick={submit} disabled={!answeredAll || busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  See my results
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIdx((i) => Math.min(FLAT_QUESTIONS.length - 1, i + 1))}
                  disabled={!answers[current.id]}
                >
                  Next <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ===== Results / intro =====
  const RetakeButton = (
    <Button variant="hero" onClick={() => setTaking(true)}>
      {latest ? <RefreshCw className="size-4" /> : <Gauge className="size-4" />}
      {latest ? "Retake assessment" : "Take assessment"}
    </Button>
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Vantage"
        title="Venture intelligence"
        subtitle="Score your venture across quality, founder readiness, market strength and fundability"
        action={RetakeButton}
      />

      {!latest ? (
        <EmptyState
          variant="full-page"
          icon={Gauge}
          title="Take your first Vantage"
          description={`Answer ${TOTAL_QUESTIONS} quick questions across 9 categories. We'll generate your Vantage Point, Fundability and Investment Readiness, plus a venture report.`}
          action={
            <Button variant="hero" onClick={() => setTaking(true)}>
              Start now <ArrowRight className="size-4" />
            </Button>
          }
        />
      ) : (
        <ResultsSurface
          latest={latest}
          previous={previous}
          history={history}
        />
      )}
    </AppShell>
  );
}

// ─── Results surface ─────────────────────────────────────────────
function ResultsSurface({
  latest,
  previous,
  history,
}: {
  latest: any;
  previous: any | undefined;
  history: { date: string; vantage: number; fundability: number }[];
}) {
  const vantagePoint: number = latest.vantagePoint ?? 0;
  const fundability: number = latest.fundability ?? 0;
  const investmentReadiness: number = latest.investmentReadiness ?? 0;
  const categoryScores: Record<string, number> =
    (latest.categoryScores as Record<string, number>) ?? {};

  const accent = vantageAccent(vantagePoint);
  const tier = vantageTier(vantagePoint);

  const scoreDelta = previous
    ? vantagePoint - (previous.vantagePoint ?? vantagePoint)
    : 0;

  const TrendIcon =
    scoreDelta > 0 ? TrendingUp : scoreDelta < 0 ? TrendingDown : Minus;
  const trendTone =
    scoreDelta > 0
      ? "text-success"
      : scoreDelta < 0
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="mt-8 space-y-8">
      {/* ─── Hero score ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-sm border border-border bg-card p-6 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          {/* Massive display number with progress ring */}
          <ScoreRing value={vantagePoint} accent={accent} />

          {/* Tier narrative */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
                  accent === "gold" && "bg-gold/15 text-gold",
                  accent === "destructive" && "bg-destructive/15 text-destructive",
                  accent === "primary" && "bg-primary/15 text-primary",
                )}
              >
                <ShieldCheck className="size-3" />
                {tier.label}
              </span>
              {previous && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    trendTone,
                  )}
                >
                  <TrendIcon className="size-3.5" />
                  {scoreDelta > 0 ? "+" : ""}
                  {scoreDelta} pts vs last
                </span>
              )}
            </div>
            <h2 className="mt-4 font-display text-2xl font-light tracking-tight sm:text-3xl">
              {tier.blurb}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Your Vantage Point rolls up 9 underlying categories into a single
              signal investors and community leaders can compare across ventures.
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:max-w-md">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Fundability
                </dt>
                <dd
                  className={cn(
                    "mt-1 font-display text-2xl font-light tabular",
                    fundability >= 60 ? "text-primary" : "text-foreground",
                  )}
                >
                  {fundability}
                  <span className="ml-0.5 text-sm text-muted-foreground">%</span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Investment Ready
                </dt>
                <dd
                  className={cn(
                    "mt-1 font-display text-2xl font-light tabular",
                    investmentReadiness >= 60 ? "text-gold" : "text-foreground",
                  )}
                >
                  {investmentReadiness}
                  <span className="ml-0.5 text-sm text-muted-foreground">%</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ─── "What investors see" callout ────────────────────────── */}
      <InvestorCallout vantagePoint={vantagePoint} accent={accent} />

      {/* ─── Category breakdown (5 investor-facing pillars) ──────── */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="tracking-editorial text-primary">Pillars</span>
            <h2 className="mt-1 font-display text-2xl font-light tracking-tight">
              Category breakdown
            </h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            9 raw categories, rolled up into 5 investor-facing pillars
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <PillarCard
              key={p.key}
              pillar={p}
              score={pillarScore(p.sources, categoryScores)}
              previousScore={
                previous
                  ? pillarScore(
                      p.sources,
                      previous.categoryScores as Record<string, number> | undefined,
                    )
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      {/* ─── Assessment history (line chart) ────────────────────── */}
      {history.length > 1 && (
        <section className="rounded-sm border border-border bg-card p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="tracking-editorial text-primary">Trajectory</span>
              <h2 className="mt-1 font-display text-xl font-light tracking-tight">
                Assessment history
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Legend swatch="bg-primary" label="Vantage Point" />
              <Legend swatch="bg-gold" label="Fundability" />
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1000]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.25rem",
                    fontSize: "12px",
                    color: "var(--color-foreground)",
                  }}
                  cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="vantage"
                  name="Vantage Point"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--color-primary)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "var(--color-primary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="fundability"
                  name="Fundability"
                  stroke="var(--color-gold)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: "var(--color-gold)", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "var(--color-gold)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ─── Report cards ───────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-3">
        <ReportCard
          title="Strengths"
          icon={CheckCircle2}
          tone="text-primary"
          items={
            (latest.report as { strengths: { label: string; score: number }[] })
              ?.strengths?.map((s) => `${s.label} (${s.score}%)`) ?? []
          }
        />
        <ReportCard
          title="Weaknesses"
          icon={AlertTriangle}
          tone="text-gold"
          items={
            (latest.report as { weaknesses: { label: string; score: number }[] })
              ?.weaknesses?.map((s) => `${s.label} (${s.score}%)`) ?? []
          }
        />
        <ReportCard
          title="Next actions"
          icon={Sparkles}
          tone="text-primary"
          items={
            (latest.report as { nextActions: string[] })?.nextActions ?? []
          }
        />
      </section>
    </div>
  );
}

// ─── Score ring with massive display number ──────────────────────
function ScoreRing({ value, accent }: { value: number; accent: "gold" | "destructive" | "primary" }) {
  const max = 1000;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  const stroke =
    accent === "gold"
      ? "var(--color-gold)"
      : accent === "destructive"
        ? "var(--color-destructive)"
        : "var(--color-primary)";

  return (
    <div className="relative mx-auto size-56 shrink-0">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        {/* track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
        />
        {/* progress arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-display text-6xl font-light tracking-tighter tabular shadow-glow rounded-full",
            accent === "gold" && "text-gold",
            accent === "destructive" && "text-destructive",
            accent === "primary" && "text-primary",
          )}
          style={{ lineHeight: 1 }}
        >
          {formatDot(value)}
        </span>
        <span className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Vantage Point
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground tabular">/ {max}</span>
      </div>
    </div>
  );
}

// ─── Investor callout strip ──────────────────────────────────────
function InvestorCallout({
  vantagePoint,
  accent,
}: {
  vantagePoint: number;
  accent: "gold" | "destructive" | "primary";
}) {
  const threshold = 700;
  const gap = Math.max(0, threshold - vantagePoint);
  const ready = vantagePoint >= threshold;

  return (
    <section
      className={cn(
        "rounded-sm border bg-card p-6 sm:p-8",
        accent === "gold" ? "border-gold/30" : "border-border",
      )}
    >
      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr_auto]">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-sm",
            ready ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary",
          )}
        >
          <ShieldCheck className="size-6" />
        </div>
        <div className="min-w-0">
          <span className="tracking-editorial text-muted-foreground">
            What investors see
          </span>
          <h3 className="mt-1 font-display text-xl font-light tracking-tight">
            {ready
              ? "You're above the investor-ready line."
              : "A 700+ score is investor-ready."}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Vantage is a single comparable number. A score of 700+ signals to
            investors that founder, market, validation and revenue fundamentals
            are all strong enough to act on. Below 700, investors read it as
            "promising, not yet ready" — closing the gaps below is the fastest
            way to convert attention into capital.
          </p>
        </div>
        <div className="rounded-sm border border-border bg-background/40 p-4 md:text-right">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Investor line
          </div>
          <div className="mt-1 font-display text-3xl font-light tabular text-gold">
            700
          </div>
          {ready ? (
            <div className="mt-1 text-xs text-primary">You're {vantagePoint - 700} above</div>
          ) : gap > 0 ? (
            <div className="mt-1 text-xs text-muted-foreground tabular">
              {gap} to go
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Pillar card ─────────────────────────────────────────────────
function PillarCard({
  pillar,
  score,
  previousScore,
}: {
  pillar: Pillar;
  score: number;
  previousScore: number | undefined;
}) {
  const Icon = pillar.icon;
  const delta =
    typeof previousScore === "number" ? score - previousScore : undefined;

  const TrendIcon =
    delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendTone =
    delta === undefined
      ? ""
      : delta > 0
        ? "text-success"
        : delta < 0
          ? "text-destructive"
          : "text-muted-foreground";

  // Mini bar chart: 8 evenly-spaced fake datapoints weighted around the score,
  // plus a marker at the end. Visually communicates "trajectory" without
  // requiring a full history.
  const mini = useMemo(() => {
    const center = score;
    return Array.from({ length: 8 }, (_, i) => {
      const t = i / 7;
      const wobble = Math.sin(i * 1.7 + center) * 6;
      const baseline = 40 + t * 20;
      const v = Math.round(center * 0.6 + baseline + wobble);
      return Math.max(5, Math.min(100, v));
    });
  }, [score]);

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {pillar.label}
        </span>
        <span className="flex size-7 items-center justify-center text-primary">
          <Icon className="size-4" />
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-3xl font-light tabular",
            score >= 70 ? "text-primary" : score < 40 ? "text-destructive" : "text-foreground",
          )}
        >
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>

      <Progress
        value={score}
        className="mt-3"
        aria-label={`${pillar.label} score`}
      />

      {/* Mini bar chart — 8 thin bars, taller = higher score */}
      <div className="mt-4 flex h-10 items-end gap-1">
        {mini.map((v, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm",
              i === mini.length - 1 ? "bg-primary" : "bg-primary/25",
            )}
            style={{ height: `${v}%` }}
          />
        ))}
      </div>

      {delta !== undefined && TrendIcon && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendTone)}>
            <TrendIcon className="size-3" />
            {delta > 0 ? "+" : ""}
            {delta} pts
          </span>
          <span className="text-xs text-muted-foreground">vs last</span>
        </div>
      )}
    </div>
  );
}

// ─── Report card ─────────────────────────────────────────────────
function ReportCard({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: typeof Gauge;
  tone: string;
  items: string[];
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-5", tone)} />
        <h3 className="font-display text-base font-medium">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-muted-foreground">
            <span className="text-foreground">•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Tiny legend swatch ───────────────────────────────────────────
function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block size-2.5 rounded-full", swatch)} />
      <span>{label}</span>
    </span>
  );
}