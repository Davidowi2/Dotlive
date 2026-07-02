/**
 * /builder — DOT OS Builder Arena
 *
 * Single home for builders. Shows:
 *   - Level + reputation + next gate
 *   - Open challenges (with apply CTA)
 *   - My submissions + earnings
 *   - AI advisor recommendations
 *
 * This is THE loop: builders see opportunities, apply, get DOT,
 * watch reputation tick up, level up, see bigger opportunities.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Trophy, Sparkles, Target, Clock, Award, ArrowRight, Loader2,
  Send, BookOpen, Lightbulb, Zap, CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { EcosystemEmptyState } from "@/components/app/EcosystemEmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useBuilderLevel, useBuilderArena, useAdvisor, useReputation, useAchievements,
} from "@/hooks/use-dot-data";
import { dotApi } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDot } from "@/lib/constants";
import { LevelRequirementsModal } from "@/components/builder/LevelRequirementsModal";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Builder Arena — DOT" },
      { name: "description", content: "Turn your skills into opportunities. Earn DOT, level up, win challenges." },
    ],
  }),
  component: BuilderArenaPage,
});

const LEVEL_COLORS = ["bg-zinc-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

function BuilderArenaPage() {
  const qc = useQueryClient();
  const levelQ = useBuilderLevel();
  const arenaQ = useBuilderArena();
  const advisorQ = useAdvisor();
  const repQ = useReputation();
  const achQ = useAchievements();

  const lvl = levelQ.data;
  const arena = arenaQ.data;
  const recommendations = advisorQ.data ?? [];
  const achievements = achQ.data ?? [];
  const reputation = repQ.data?.score ?? 0;

  const [submitFor, setSubmitFor] = useState<any | null>(null);
  const [submitContent, setSubmitContent] = useState("");
  const [submitLink, setSubmitLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [levelModalOpen, setLevelModalOpen] = useState(false);

  async function submitWork() {
    if (!submitFor) return;
    if (submitContent.trim().length < 10) {
      toast.error("Add a description of what you delivered (10+ chars).");
      return;
    }
    setBusy(true);
    try {
      await dotApi.post(`/api/builder/challenges/${submitFor.id}/submit`, {
        content: submitContent.trim(),
        link: submitLink.trim() || undefined,
      });
      toast.success("Submission received — awaiting review.");
      setSubmitFor(null);
      setSubmitContent("");
      setSubmitLink("");
      qc.invalidateQueries({ queryKey: ["builder_arena"] });
      qc.invalidateQueries({ queryKey: ["my_challenges"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  const isLoading = arenaQ.isLoading || levelQ.isLoading;

  return (
    <AppShell>
      <PageHeader
        title="Builder Arena"
        subtitle="Turn your skills into opportunities. Earn DOT, build reputation, level up."
        action={
          lvl ? (
            <Badge className={`${LEVEL_COLORS[Math.min(4, lvl.level - 1)]} text-white text-sm px-3 py-1`}>
              Level {lvl.level} · {lvl.label}
            </Badge>
          ) : null
        }
      />

      {/* Stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          label="Reputation"
          value={String(lvl?.reputation ?? 0)}
          sub={lvl?.nextLevel ? `${lvl.nextLevel.gates?.stats?.reputation ?? 0} / 1000` : "—"}
        />
        <StatCard
          icon={Target}
          label="Level"
          value={String(lvl?.level ?? 1)}
          sub={lvl?.label ?? "Explorer"}
        />
        <StatCard
          icon={Zap}
          label="Challenges Open"
          value={String(arena?.challenges?.length ?? 0)}
          sub="apply to earn"
        />
        <StatCard
          icon={Award}
          label="Submissions"
          value={String(arena?.mySubmissions?.length ?? 0)}
          sub={`${arena?.mySubmissions?.filter((s: any) => s.status === "approved").length ?? 0} won`}
        />
      </div>

      {/* Next-level gate */}
      {lvl?.nextLevel && lvl.nextLevel.level <= 5 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">
                Reach Level {lvl.nextLevel.level}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete these to promote automatically.
              </p>
            </div>
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {Object.entries(lvl.nextLevel.gates?.requirements ?? {}).map(([k, v]) => (
              <Badge key={k} variant={v ? "default" : "outline"}>
                {v ? "✓" : "○"} {k}
              </Badge>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => setLevelModalOpen(true)}
              data-testid="view-level-tasks"
            >
              View tasks
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* AI advisor */}
      {recommendations.length > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            <h3 className="font-display text-base font-semibold">Your next best moves</h3>
          </div>
          <ul className="mt-3 space-y-2">
            {recommendations.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-background p-3">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{r.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Open challenges */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Open Challenges</h2>
            <Badge variant="outline">{arena?.challenges?.length ?? 0}</Badge>
          </div>

          {isLoading ? (
                      <PageSkeleton.CardGrid count={3} cols={1} />
                    ) : !arena?.challenges?.length ? (
                      <EcosystemEmptyState
                        icon={Target}
                        title="No open challenges right now"
                        subtitle="Short-term paid tasks founders post to test builders. Win a challenge to grow your reputation."
                        postedBy="Founders and Admins"
                        requiredRole="founder"
                        accent="primary"
                        secondaryAction={{ label: "See open gigs", href: "/work" }}
                      />
                    ) : (
            <div className="space-y-3">
              {arena.challenges.map((c: any) => (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{c.skill}</Badge>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="mr-1 inline size-3" />
                          {c.deadline ? new Date(c.deadline).toLocaleDateString() : "No deadline"}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-display text-base font-semibold">{c.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-primary">
                        {formatDot(Number(c.rewardDot))} DOT
                      </div>
                      <Button size="sm" className="mt-2" onClick={() => setSubmitFor(c)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Achievements */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-display text-base font-semibold">Achievements</h3>
            {achQ.isLoading ? (
              <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground" />
            ) : achievements.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Win a challenge or complete a service order to earn your first badge.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {achievements.slice(0, 5).map((a: any) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <Award className="size-4 text-amber-500" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* My submissions */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-display text-base font-semibold">My Submissions</h3>
            {arena?.mySubmissions?.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No submissions yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {arena?.mySubmissions?.slice(0, 5).map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1 truncate text-muted-foreground">{s.content.slice(0, 30)}…</div>
                    <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "outline" : "secondary"}>
                      {s.status === "approved" && <CheckCircle2 className="mr-1 size-3" />}
                      {s.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Submit dialog */}
      <Dialog open={!!submitFor} onOpenChange={(o) => !o && setSubmitFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit work</DialogTitle>
            <DialogDescription>
              {submitFor?.title} · {formatDot(Number(submitFor?.rewardDot ?? 0))} DOT on approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">What did you deliver?</label>
              <Textarea
                value={submitContent}
                onChange={(e) => setSubmitContent(e.target.value)}
                placeholder="Describe what you built / designed / wrote. 10+ characters."
                rows={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Link to work (optional)</label>
              <Input
                value={submitLink}
                onChange={(e) => setSubmitLink(e.target.value)}
                placeholder="https://github.com/you/repo, https://figma.com/file/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitFor(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitWork} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Send className="mr-2 size-4" /> Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level requirements modal — opens when builder clicks "View tasks" */}
      <LevelRequirementsModal
        open={levelModalOpen}
        onClose={() => setLevelModalOpen(false)}
        currentLevel={lvl?.level ?? 1}
        nextLevel={lvl?.nextLevel?.level ?? (lvl?.level ?? 1) + 1}
        requirements={lvl?.nextLevel?.gates?.requirements ?? {}}
        stats={lvl?.nextLevel?.gates?.stats}
      />
    </AppShell>
  );
}