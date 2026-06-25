/**
 * /demo/$id — DOT Demo event
 *
 * Pitchathon leaderboard + judge scoring UI.
 *   - Applicants see their submission + leaderboard rank
 *   - Judges (capital_partner role) see a score dialog
 *   - Anyone sees the ranked list of applications
 */

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy, Loader2, Star, Award, ArrowLeft, Crown, Medal,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dotApi } from "@/api/client";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { scoreSubmission } from "@/api/pitchathons";
import { formatNaira } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/demo/$id")({
  head: () => ({ meta: [{ title: "DOT Demo — Pitch Event" }] }),
  component: DemoEventPage,
});

function DemoEventPage() {
  const { id } = Route.useParams();
  const { user, roles } = useDotAuth();
  const qc = useQueryClient();
  const canJudge = roles.includes("capital_partner") || roles.includes("admin");

  const eventQ = useQuery({
    queryKey: ["demo_event", id],
    queryFn: async () => dotApi.get<any>(`/api/pitchathons/${id}/leaderboard`),
  });

  const [scoreFor, setScoreFor] = useState<any | null>(null);
  const [score, setScore] = useState(7);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitScore() {
    if (!scoreFor) return;
    setBusy(true);
    try {
      await scoreSubmission(id, { applicationId: scoreFor.application.id, score, note });
      toast.success(`Score ${score}/10 submitted`);
      setScoreFor(null);
      setScore(7);
      setNote("");
      qc.invalidateQueries({ queryKey: ["demo_event", id] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit score");
    } finally {
      setBusy(false);
    }
  }

  const board = eventQ.data?.leaderboard ?? [];

  return (
    <AppShell>
      <PageHeader
        title="DOT Demo"
        subtitle="Live pitch competition · scored by capital partners"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/pitchathons"><ArrowLeft className="mr-2 size-4" /> All pitchathons</Link>
          </Button>
        }
      />

      {eventQ.isLoading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : board.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No applications yet"
          description="Once founders apply, they'll appear here ranked by judge scores."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {board.map((row: any, idx: number) => {
            const a = row.application;
            const rank = idx + 1;
            const RankIcon = rank === 1 ? Crown : rank === 2 ? Medal : rank === 3 ? Award : Star;
            const isMe = a.founderId === user?.id;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border p-5 ${
                  rank === 1
                    ? "border-amber-400 bg-amber-50/40"
                    : rank <= 3
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex size-9 items-center justify-center rounded-xl bg-background font-display text-lg font-bold">
                      #{rank}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold flex items-center gap-2">
                        {a.ventureName ?? "Unnamed venture"}
                        {isMe && <Badge variant="outline">You</Badge>}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Funding ask: {formatNaira(Number(a.fundingAsk ?? 0))}
                      </p>
                      {a.pitchDeckUrl && (
                        <a href={a.pitchDeckUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-xs text-primary hover:underline">
                          Pitch deck ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <RankIcon className={`size-4 ${rank === 1 ? "text-amber-500" : "text-muted-foreground"}`} />
                      <div className="font-display text-2xl font-bold">
                        {row.avgScore || "—"}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.scoreCount} {row.scoreCount === 1 ? "judge" : "judges"}
                    </div>
                    {canJudge && (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setScoreFor(row)}>
                        Score
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Score dialog */}
      <Dialog open={!!scoreFor} onOpenChange={(o) => !o && setScoreFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Score this venture</DialogTitle>
            <DialogDescription>
              {scoreFor?.application.ventureName} — your score helps rank the top ventures.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Score: {score}/10</label>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Strengths, concerns, follow-up…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreFor(null)} disabled={busy}>Cancel</Button>
            <Button onClick={submitScore} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}