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
  Wrench,
  Share2,
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
import { PageIntent } from "@/components/app/PageIntent";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { useVantage } from "@/hooks/use-dot-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submitAssessment, getVantageHistory } from "@/api/vantage";
import {
  VANTAGE_CATEGORIES,
  categoryScores as genericCategoryScores,
  vantagePointFromScores,
  fundabilityFromScores,
  investmentReadinessFromScores,
  vantageStageFromScore,
  type VantageAnswers,
  type VantageAnswerValue,
  scoreQuestion,
} from "@/lib/vantage";
import {
  FOUNDER_QUESTIONS,
  FOUNDER_SECTIONS,
  scoreFounderAssessment,
} from "@/lib/vantage-founder";
import {
  BUILDER_QUESTIONS,
  BUILDER_SECTIONS,
  scoreBuilderAssessment,
} from "@/lib/vantage-builder";
import {
  INVESTOR_QUESTIONS,
  INVESTOR_SECTIONS,
  scoreInvestorAssessment,
} from "@/lib/vantage-investor";
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

function effectiveRole(user: any): string {
  const raw = user?.roles ?? user?.role;
  if (Array.isArray(raw)) return raw[0] ?? "founder";
  if (typeof raw === "string") return raw;
  return "founder";
}

function roleScores(role: string, answers: Record<string, VantageAnswerValue | undefined>) {
  if (role === "builder") return scoreBuilderAssessment(answers as any);
  if (role === "investor") return scoreInvestorAssessment(answers as any);
  return scoreFounderAssessment(answers as any);
}

function roleSections(role: string) {
  if (role === "builder") return BUILDER_SECTIONS;
  if (role === "investor") return INVESTOR_SECTIONS;
  return FOUNDER_SECTIONS;
}

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
    key: "founder",
    label: "Founder",
    icon: Compass,
    sources: ["founder"],
  },
  {
    key: "traction",
    label: "Traction",
    icon: TrendingUp,
    sources: ["traction"],
  },
  {
    key: "capital",
    label: "Capital",
    icon: Briefcase,
    sources: ["capital"],
  },
  {
    key: "market",
    label: "Market",
    icon: Layers,
    sources: ["market"],
  },
  {
    key: "execution",
    label: "Execution",
    icon: Wrench,
    // Derived: team + opportunity (i.e. can you ship + do you get it?)
    sources: ["team", "opportunity"],
  },
  {
    key: "fundability",
    label: "Fundability",
    icon: ShieldCheck,
    // Derived: average of traction + capital.
    sources: ["traction", "capital"],
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
  // Canonical Vantage signal — same source as /dashboard.
  const { vantagePoint: canonicalVantagePoint } = useVantage();
  // Displayed value: canonical signal (single source of truth).
  const vantagePoint = canonicalVantagePoint;
  const [taking, setTaking] = useState(false);
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState<VantageAnswers>({});
    const [busy, setBusy] = useState(false);
    const [submittedNow, setSubmittedNow] = useState<any>(null);
    const [stage, setStage] = useState<"intro" | "taking" | "results">("intro");

    const role = effectiveRole(user);

    const BANK = {
      bank: roleSections(role).flatMap((s) => s.questions),
      sections: roleSections(role),
      label: role === "builder" ? "Builder Vantage" : role === "investor" ? "Investor Vantage" : "Founder Vantage",
    };
    const ACTIVE_QUESTIONS = BANK.bank.map((q) => ({
      ...q,
      category: BANK.sections.find((s) => s.questions.some((x) => x.id === q.id))?.label ?? "Assessment",
      categoryKey: BANK.sections.find((s) => s.questions.some((x) => x.id === q.id))?.key ?? q.id,
      categoryDescription: "",
    }));
    const TOTAL_QUESTIONS = ACTIVE_QUESTIONS.length;
    const FLAT_QUESTIONS = ACTIVE_QUESTIONS;

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

  function setAnswer(v: VantageAnswerValue | undefined) {
    setAnswers((a) => ({ ...a, [current.id]: v }));
    // Auto-advance only for short-input kinds (likert + select).
    const k = current?.kind ?? "likert";
    if ((k === "likert" || k === "select") && idx < FLAT_QUESTIONS.length - 1) {
      setTimeout(() => setIdx((i) => i + 1), 200);
    }
  }


  async function submit() {
    if (!user || !answeredAll) return;
    setBusy(true);
    try {
      // Compute per-category scores for the active role-specific assessment.
      const role = effectiveRole(user);
      const { totalScore, sectionScores, badge } = roleScores(role, answers);
      const vantagePoint = Math.min(1000, Math.round(totalScore));
      const sections = roleSections(role);

      function sectionLabel(key: string) {
        return sections.find((s) => s.key === key)?.label ?? key;
      }

      const sorted = Object.entries(sectionScores)
        .map(([key, value]) => ({
          key,
          label: sectionLabel(key),
          score: value,
          max: sections.find((s) => s.key === key)?.maxScore ?? 100,
        }))
        .sort((a, b) => b.score - a.score);

      const strengths = sorted.filter((c) => c.score >= Math.round(c.max * 0.75)).slice(0, 3).map((c) => ({ label: c.label, score: Math.round((c.score / c.max) * 100) }));
      const weaknesses = sorted.filter((c) => c.score < Math.round(c.max * 0.5)).slice(0, 3).map((c) => ({ label: c.label, score: Math.round((c.score / c.max) * 100) }));
      const nextActions: string[] = [];
      weaknesses.slice(0, 3).forEach((c) => nextActions.push(`Improve ${c.label} — currently ${c.score}% of max`));
      if (vantagePoint < 400) nextActions.push("Focus on core assessment areas with the lowest scores.");
      else if (vantagePoint < 700) nextActions.push("Strengthen mid-tier sections to reach the next badge.");
      else nextActions.push("Maintain momentum and retake after 30 days.");
      if (strengths.length && nextActions.length < 6) nextActions.push("Lean into your strength: " + strengths[0].label + " (" + strengths[0].score + "%).");

      const report = { strengths, weaknesses, nextActions, stage: badge };
      const fundability = Math.round(Object.values(sectionScores).reduce((a, b) => a + b, 0) / (sections.length * Math.max(...sections.map((s) => s.maxScore))) * 100);
      const investmentReadiness = fundability;

      const result = await submitAssessment({
        answers: answers as Record<string, number | string>,
        categoryScores: sectionScores,
        vantagePoint,
        fundability,
        investmentReadiness,
        stage: badge,
        report,
      });
      toast.success("Vantage updated. Score: " + vantagePoint + ".");
      setSubmittedNow(result);
      setStage("results");
      qc.invalidateQueries({ queryKey: ["vantage"] });
      qc.invalidateQueries({ queryKey: ["founder-profile", "me"] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
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
            <p className="text-[10px] tracking-widest uppercase font-semibold text-primary">
              {current.category}
            </p>
            {current.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {current.description}
              </p>
            )}
            <h2 className="mt-2 font-display text-xl font-light">{current.text}</h2>

            {(current.kind ?? "likert") === "likert" && (
              <>
                {current.help && (
                  <div className="mt-3 flex items-stretch gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex-1">
                      <p className="font-medium text-foreground/80">Low (1-2)</p>
                      <p>{current.help.low}</p>
                    </div>
                    <div className="my-1 w-px bg-border" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground/80">High (4-5)</p>
                      <p>{current.help.high}</p>
                    </div>
                  </div>
                )}
                <div className="mt-6 grid gap-2">
                  {SCALE.map((s) => (
                    <button
                      key={s.v}
                      onClick={() => setAnswer(s.v)}
                      className={cn(
                        "flex items-center justify-between rounded-sm border p-4 text-left transition-all hover:border-primary/50",
                        answers[current.id] === s.v
                          ? "border-primary bg-primary/10"
                          : "border-border",
                      )}
                    >
                      <span className="text-sm font-medium">{s.label}</span>
                      <span className="font-display text-sm text-muted-foreground">
                        {s.v}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {(current.kind ?? "likert") === "number" && (
              <div className="mt-6">
                <Label htmlFor={current.id} className="text-xs uppercase tracking-wider text-muted-foreground">
                  {current.numberMeta?.suffix ?? "Value"}
                </Label>
                <Input
                  id={current.id}
                  type="number"
                  min={0}
                  step="any"
                  placeholder={current.numberMeta?.placeholder}
                  value={typeof answers[current.id] === "string" ? "" : (answers[current.id] as number | undefined) ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setAnswer(raw === "" ? undefined : Number(raw));
                  }}
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Counts toward your Vantage Point — 0 means "didn't report."
                </p>
              </div>
            )}

            {(current.kind ?? "likert") === "select" && (
              <div className="mt-6 grid gap-2">
                {current.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(opt.value)}
                    className={cn(
                      "flex items-center justify-between rounded-sm border p-4 text-left transition-all hover:border-primary/50",
                      answers[current.id] === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {(current.kind ?? "likert") === "text" && (
              <div className="mt-6">
                <Textarea
                  id={current.id}
                  placeholder={current.textMeta?.placeholder}
                  maxLength={current.textMeta?.maxLength}
                  value={(answers[current.id] as string) ?? ""}
                  onChange={(e) =>
                    setAnswer(e.target.value === "" ? undefined : e.target.value)
                  }
                  className="min-h-32"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Scored on length + specificity, not vibes.</span>
                  {current.textMeta?.maxLength && (
                    <span>
                      {(answers[current.id] as string)?.length ?? 0} /{" "}
                      {current.textMeta.maxLength}
                    </span>
                  )}
                </div>
              </div>
            )}

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

  const ShareButton = latest ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const url = `${window.location.origin}/founder/${user?.dotId ?? ""}?vantage=${latest.id ?? ""}`;
        const text = `My Vantage Point: ${vantagePoint}/1000 — ${current?.text ?? ""} on DOT`;
        if (navigator.share) {
          navigator.share({ title: "My Vantage Score", text, url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(`${text}\n${url}`);
          toast.success("Link copied — share your Vantage");
        }
      }}
    >
      <Share2 className="size-4" /> Share
    </Button>
  ) : null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Vantage"
        title="Venture intelligence"
        subtitle="Score your venture across founder, traction, market, and capital readiness — 12 questions, 4 dimensions."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {ShareButton}
            {RetakeButton}
          </div>
        }
      />

      <PageIntent
        icon={<Gauge className="size-5" />}
        intent="How credible does your venture look to investors, today?"
        context="Your Vantage Point (0–1000) is built from real activity signals — assessment, academy, work, stakes, escrow, and capital."
      />

      {!latest ? (
        <EmptyState
          variant="full-page"
          icon={Gauge}
          title="Take your first Vantage"
          description={`Answer ${TOTAL_QUESTIONS} quick questions across 4 investor-grade dimensions. We'll generate your Vantage Point, Fundability and Investment Readiness, plus a venture report.`}
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

      {/* ─── Prominent "What to do next" section ─────────────── */}
      {(() => {
        const nextActions: string[] = (latest.report as any)?.nextActions ?? [];
        if (!nextActions.length) return null;
        return (
          <section className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">What to do next</h2>
                <p className="text-sm text-muted-foreground">
                  Specific actions ranked by impact. Do these in order to move your Vantage Point.
                </p>
              </div>
            </div>
            <ol className="space-y-3">
              {nextActions.map((action, i) => (
                <li key={i} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary tabular">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90 pt-1">{action}</p>
                  {i === 0 && (
                    <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold uppercase tracking-wide">
                      Top priority
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="hero" asChild>
                <a href="#retake" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <RefreshCw className="size-4" /> Retake after making progress
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/demo">
                  <Sparkles className="size-4" /> View on DOT Demo
                </a>
              </Button>
            </div>
          </section>
        );
      })()}
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

  // Mini bar chart removed — fake datapoints mislead users

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