import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Gauge,
  Loader2,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
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
import { StatCard } from "@/components/app/StatCard";
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

  const latest = assessments[assessments.length - 1];

  const history = useMemo(
    () =>
      assessments.map((a) => ({
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
      const result = await submitAssessment(answers as Record<string, number>);
      toast.success(`Vantage complete! You scored ${result.vantagePoint} points.`);
      qc.invalidateQueries({ queryKey: ["assessments", user.id] });
      qc.invalidateQueries({ queryKey: ["founder_profile", user.id] });
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

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold">{current.text}</h2>
            <div className="mt-6 grid gap-2">
              {SCALE.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setAnswer(s.v)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-primary/50",
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
  return (
    <AppShell>
      <PageHeader
        title="Vantage"
        subtitle="Your measurable venture intelligence score."
        action={
          <Button variant="hero" onClick={() => setTaking(true)}>
            {latest ? <RefreshCw className="size-4" /> : <Gauge className="size-4" />}
            {latest ? "Retake assessment" : "Take assessment"}
          </Button>
        }
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
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Vantage Point"
              value={formatDot(latest.vantagePoint)}
              sub="/ 1000"
              icon={Gauge}
              accent="primary"
            />
            <StatCard
              label="Fundability"
              value={`${latest.fundability}%`}
              icon={TrendingUp}
              accent="gold"
            />
            <StatCard
              label="Investment Ready"
              value={`${latest.investmentReadiness}%`}
              icon={Target}
              accent="primary"
            />
          </div>

          {history.length > 1 && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Progress over time</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
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
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.75rem",
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
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Category breakdown</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {VANTAGE_CATEGORIES.map((c) => {
                const score = (latest.categoryScores as Record<string, number>)?.[c.key] ?? 0;
                return (
                  <div key={c.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-muted-foreground">{score}%</span>
                    </div>
                    <Progress value={score} className="mt-1.5" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ReportCard
              title="Strengths"
              icon={CheckCircle2}
              tone="text-primary"
              items={(latest.report as { strengths: { label: string; score: number }[] })?.strengths?.map((s) => `${s.label} (${s.score}%)`) ?? []}
            />
            <ReportCard
              title="Weaknesses"
              icon={AlertTriangle}
              tone="text-gold"
              items={(latest.report as { weaknesses: { label: string; score: number }[] })?.weaknesses?.map((s) => `${s.label} (${s.score}%)`) ?? []}
            />
            <ReportCard
              title="Next actions"
              icon={Sparkles}
              tone="text-primary"
              items={(latest.report as { nextActions: string[] })?.nextActions ?? []}
            />
          </div>
        </>
      )}
    </AppShell>
  );
}

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
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-5", tone)} />
        <h3 className="font-display font-semibold">{title}</h3>
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
