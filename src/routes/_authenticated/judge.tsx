/**
 * /judge — Judge Portal.
 *
 * Real wiring: lists pitchathons; pick one; see all applications for it;
 * score 1-10 with optional note; scores persist via /api/pitchathons/:id/score.
 *
 * Replaces a previous version that hard-coded MOCK_APPLICATIONS. That was
 * the only mock-data page in the app — fixed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoleGate } from "@/hooks/use-role-gate";
import { Trophy, Star, Check, ExternalLink, Loader2, FileText } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDot } from "@/lib/constants";
import {
  getPitchathons,
  getJudgeApplications,
  scoreSubmission,
  type JudgeApplication,
} from "@/api/pitchathons";

export const Route = createFileRoute("/_authenticated/judge")({
  head: () => ({ meta: [{ title: "Judge Portal — DOT" }] }),
  component: JudgePage,
});

function JudgePage() {
  const [selectedPitchathonId, setSelectedPitchathonId] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoreVal, setScoreVal] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const gate = useRoleGate(["judge", "capital_partner", "admin", "super_admin"], { redirect: "/dashboard" });
  if (!gate.allowed) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <h2 className="text-2xl font-semibold">Judge access only</h2>
          <p className="mt-2 text-muted-foreground">
            You need the judge, capital-partner or operator role to score pitchathons.
          </p>
        </div>
      </AppShell>
    );
  }

  // 1) List pitchathons
  const pitchathonsQ = useQuery({
    queryKey: ["pitchathons"],
    queryFn: () => getPitchathons(),
  });

  // 2) Once a pitchathon is picked, fetch its applications
  const appsQ = useQuery({
    queryKey: ["pitchathon-applications", selectedPitchathonId],
    queryFn: () => getJudgeApplications(selectedPitchathonId!),
    enabled: !!selectedPitchathonId,
  });

  const apps: JudgeApplication[] = appsQ.data ?? [];
  const pendingCount = apps.filter((a) => !a.myScore).length;
  const myScoredCount = apps.length - pendingCount;

  async function handleScore(applicationId: string) {
    if (!selectedPitchathonId) return;
    setSubmitting(true);
    try {
      await scoreSubmission(selectedPitchathonId, {
        applicationId,
        score: scoreVal,
        note: feedback.trim() || undefined,
      });
      toast.success(`Score ${scoreVal}/10 saved`);
      setScoringId(null);
      setScoreVal(5);
      setFeedback("");
      qc.invalidateQueries({ queryKey: ["pitchathon-applications", selectedPitchathonId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save score");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Judging"
        title="Judge Portal"
        subtitle="Score pitchathon applications and surface the best ventures."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Trophy className="mr-1 size-3" /> {apps.length} {apps.length === 1 ? "application" : "applications"}
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="default">
                {pendingCount} to score
              </Badge>
            )}
          </div>
        }
      />

      {/* ─── Step 1: Pick a pitchathon ──────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-base font-semibold tracking-tight">
          1. Pick a pitchathon
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which event's applications you want to score.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {pitchathonsQ.isLoading && <PageSkeleton lines={3} />}
          {pitchathonsQ.data?.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<Trophy className="size-7" />}
                title="No pitchathons yet"
                description="When an operator creates a pitchathon, it'll appear here."
              />
            </div>
          )}
          {pitchathonsQ.data?.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPitchathonId(p.id)}
              className={cn(
                "rounded-xl border bg-card p-4 text-left transition",
                selectedPitchathonId === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-semibold">{p.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {p.description ?? "No description"}
                  </p>
                </div>
                {selectedPitchathonId === p.id && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </div>
              {p.prize && (
                <div className="mt-2 text-[10px] uppercase tracking-widest text-gold">
                  Prize · {p.prize}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Step 2: Score applications ─────────────────────── */}
      {selectedPitchathonId && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight">
                2. Applications
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {myScoredCount} scored · {pendingCount} pending
              </p>
            </div>
          </div>

          {appsQ.isLoading && <PageSkeleton lines={4} />}
          {appsQ.data && appsQ.data.length === 0 && (
            <EmptyState
              icon={<FileText className="size-7" />}
              title="No applications yet"
              description="Founders will appear here once they submit to this pitchathon."
            />
          )}

          <div className="space-y-3">
            {apps.map((a) => {
              const isScoring = scoringId === a.id;
              const hasMyScore = !!a.myScore;
              return (
                <div
                  key={a.id}
                  className={cn(
                    "rounded-2xl border bg-card p-5",
                    hasMyScore ? "border-primary/30" : "border-border",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base font-semibold">
                        {a.ventureName ?? "Untitled venture"}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Founder ID · {a.founderId.slice(0, 8)}…
                        {a.fundingAsk && (
                          <> · Ask: {formatDot(Number(a.fundingAsk))} DOT</>
                        )}
                      </p>
                      {a.pitchDeckUrl && (
                        <a
                          href={a.pitchDeckUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <FileText className="size-3" /> View deck
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasMyScore ? (
                        <Badge variant="default">
                          <Check className="mr-1 size-3" /> Your score: {a.myScore!.score}/10
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {a.avgScore != null && (
                        <Badge variant="outline">
                          Avg {a.avgScore}/10 · {a.scoreCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isScoring ? (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                          Score
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={scoreVal}
                            onChange={(e) => setScoreVal(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="font-display text-lg font-semibold tabular-nums w-8 text-right">
                            {scoreVal}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                          Note (optional)
                        </label>
                        <Textarea
                          rows={3}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Why this score? One short paragraph."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setScoringId(null);
                            setFeedback("");
                            setScoreVal(5);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleScore(a.id)}
                          disabled={submitting}
                        >
                          {submitting && <Loader2 className="size-4 animate-spin" />}
                          Save score
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant={hasMyScore ? "outline" : "default"}
                        onClick={() => {
                          setScoringId(a.id);
                          setScoreVal(a.myScore?.score ?? 5);
                          setFeedback(a.myScore?.note ?? "");
                        }}
                      >
                        <Star className="size-4" />
                        {hasMyScore ? "Re-score" : "Score"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </AppShell>
  );
}
