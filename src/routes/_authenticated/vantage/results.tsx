import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gauge, Trophy, TrendingUp, RefreshCw, ArrowRight, Sparkles, Award,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { getVantageHistory } from "@/api/vantage";
import { canRetakeVantage } from "@/api/vantage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vantage/results")({
  head: () => ({ meta: [{ title: "Vantage Results — DOT" }] }),
  component: VantageResultsPage,
});

function badgeFor(score: number) {
  if (score >= 850) return { label: "Elite", color: "bg-gold/10 text-gold border-gold/30" };
  if (score >= 700) return { label: "Ready to Raise", color: "bg-primary/10 text-primary border-primary/30" };
  if (score >= 500) return { label: "Established", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" };
  if (score >= 300) return { label: "Emerging", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" };
  if (score >= 100) return { label: "Building", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" };
  return { label: "Unverified", color: "bg-muted text-muted-foreground border-border" };
}

function VantageResultsPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["assessments", user?.id],
    enabled: !!user,
    queryFn: getVantageHistory,
  });
  const { data: retakeData } = useQuery({
    queryKey: ["vantage-retake", user?.id],
    enabled: !!user,
    queryFn: canRetakeVantage,
  });

  const latest = assessments[0];
  const canRetake = retakeData?.canRetake ?? false;

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="Vantage Results" subtitle="Loading..." />
        <div className="flex justify-center py-20"><Gauge className="size-8 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }

  if (!latest) {
    return (
      <AppShell>
        <PageHeader title="Vantage Results" subtitle="No assessment yet" />
        <div className="mx-auto max-w-2xl py-20 text-center">
          <Trophy className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl">No Vantage results yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">Take the assessment to see your score and report.</p>
          <Button asChild className="mt-6" variant="hero">
            <Link to="/vantage">Take assessment <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const score = Number(latest.vantagePoint ?? 0);
  const badge = badgeFor(score);
  const percentile = Math.min(100, Math.round((score / 1000) * 100));
  const cats = (latest.categoryScores as Record<string, number> | undefined) ?? {};
  const report = (latest.report as { strengths?: any[]; weaknesses?: any[]; nextActions?: string[] } | null) ?? null;

  async function retake() {
    if (!canRetake) {
      toast.error("You can retake in 30 days");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["assessments", user?.id] });
    toast.success("Starting new assessment");
    window.location.href = "/vantage";
  }

  return (
    <AppShell>
      <PageHeader
        title="Vantage Results"
        subtitle={`Assessment from ${new Date(latest.createdAt).toLocaleDateString()}`}
        action={
          <Button variant="hero" onClick={retake} disabled={!canRetake}>
            {canRetake ? <><RefreshCw className="size-4" /> Retake</> : "Retake locked"}
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Score card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-3xl font-bold text-primary">
              {score}
            </div>
            <div>
              <Badge variant="outline" className={cn("border", badge.color)}>{badge.label}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">Top {100 - percentile}% of founders</p>
            </div>
          </div>
          <Progress value={percentile} className="mt-4" />
        </div>

        {/* Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Section breakdown</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(cats).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="tabular-nums">{Math.round(value)}%</span>
                  </div>
                  <Progress value={Math.round(value)} className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report */}
        {report && (
          <>
            {report.strengths?.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg"><Sparkles className="size-4 text-gold inline mr-2" />Strengths</h3>
                <ul className="mt-3 space-y-2">
                  {report.strengths.map((s: any, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {s.label}: {Math.round(s.score)}%</li>
                  ))}
                </ul>
              </div>
            )}
            {report.nextActions?.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg"><TrendingUp className="size-4 text-primary inline mr-2" />Boost your score</h3>
                <ul className="mt-3 space-y-2">
                  {report.nextActions.map((a: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/vantage">Back to Vantage</Link>
          </Button>
          <Button variant="hero" onClick={retake} disabled={!canRetake}>
            {canRetake ? "Retake assessment" : "Retake available in 30 days"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
