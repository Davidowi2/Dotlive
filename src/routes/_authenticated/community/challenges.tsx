/**
 * Community Challenges — view, submit, award.
 *
 * Three surfaces in one route:
 *   - Member view: see open challenges, submit entry
 *   - Leader view: post challenge (with escrow), pick winners
 *
 * Status drives UI:
 *   open       → submit form (members) or close/award (leader)
 *   judging    → no new submits (members), leader can award
 *   awarded    → show winners, archived
 *   cancelled  → refund issued, archived
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  Calendar,
  Coins,
  Clock,
  Lock,
  X,
  Check,
  Sparkles,
  ChevronRight,
  Inbox,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { BackButton } from "@/components/app/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  listChallenges,
  createChallenge,
  submitToChallenge,
  awardChallenge,
  cancelChallenge,
  getChallenge,
  type Challenge,
  type ChallengeSubmission,
} from "@/api/challenges";

export const Route = createFileRoute("/_authenticated/community/challenges")({
  head: () => ({ meta: [{ title: "Challenges · DOT" }] }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const { id: communityId } = Route.useParams();
  const { user } = useDotAuth();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);

  const queryClient = useQueryClient();
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges", communityId],
    queryFn: () => listChallenges(communityId),
  });

  const open = challenges.filter((c) => c.status === "open");
  const past = challenges.filter((c) => c.status !== "open");

  return (
    <AppShell>
      <div className="mb-3">
        <BackButton label="Back to community" fallback={`/community/${communityId}`} />
      </div>
      <PageHeader
        eyebrow="Challenges"
        title="Compete · Win DOT"
        subtitle="Leader-posted challenges with DOT prize pools. Submit, get picked, get paid."
        action={
          <Button onClick={() => setShowPostForm(true)}>
            <Trophy className="mr-2 size-4" /> Post a challenge
          </Button>
        }
      />

      {showPostForm && (
        <PostChallengeForm
          communityId={communityId}
          onDone={() => {
            setShowPostForm(false);
            queryClient.invalidateQueries({ queryKey: ["challenges", communityId] });
          }}
          onCancel={() => setShowPostForm(false)}
        />
      )}

      {/* Open challenges */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-light tracking-tight">
          Open ({open.length})
        </h2>
        {isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl border border-border bg-card/40 animate-pulse"
              />
            ))}
          </div>
        ) : open.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-7" />}
            title="No open challenges"
            description={
              isLeader
                ? "Be the first to launch a challenge and stake your DOT prize."
                : "The leader hasn't posted a challenge yet. Check back soon."
            }
            action={
              isLeader ? (
                <Button onClick={() => setShowPostForm(true)}>
                  <Trophy className="mr-2 size-4" />
                  Post a challenge
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {open.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onOpen={() => setSelectedChallengeId(c.id)}
                myUserId={user?.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past challenges */}
      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-light tracking-tight">
            Past ({past.length})
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {past.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onOpen={() => setSelectedChallengeId(c.id)}
                myUserId={user?.id}
              />
            ))}
          </div>
        </section>
      )}

      {selectedChallengeId && (
        <ChallengeDetailModal
          challengeId={selectedChallengeId}
          onClose={() => setSelectedChallengeId(null)}
          onChanged={() => {
            queryClient.invalidateQueries({ queryKey: ["challenges", communityId] });
          }}
          currentUserId={user?.id}
        />
      )}
    </AppShell>
  );
}

/* -------------------- Card -------------------- */

function ChallengeCard({
  challenge,
  onOpen,
}: {
  challenge: Challenge;
  onOpen: () => void;
  myUserId?: string;
}) {
  const prize = Number(challenge.prizeDot);
  const totalPrize = Number(challenge.prizeTotalDot);
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.deadline).getTime() - Date.now()) / 86_400_000));

  return (
    <button
      onClick={onOpen}
      className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
            <Trophy className="size-3" />
            {prize} DOT × {challenge.maxWinners} winner{challenge.maxWinners > 1 ? "s" : ""}
          </p>
          <h3 className="mt-1 font-display text-lg font-light leading-tight">
            {challenge.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {challenge.description}
          </p>
        </div>
        <StatusBadge status={challenge.status} />
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Coins className="size-3" /> {totalPrize} DOT pool
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          {challenge.status === "open" ? `${daysLeft}d left` : new Date(challenge.deadline).toLocaleDateString()}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-foreground">
          View <ChevronRight className="size-3" />
        </span>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: Challenge["status"] }) {
  const map: Record<Challenge["status"], { label: string; variant: any }> = {
    open:       { label: "Open", variant: "default" },
    draft:      { label: "Draft", variant: "secondary" },
    judging:    { label: "Judging", variant: "secondary" },
    awarded:    { label: "Awarded", variant: "secondary" },
    cancelled:  { label: "Cancelled", variant: "outline" },
  };
  const m = map[status];
  return (
    <Badge variant={m.variant as any} className="shrink-0 text-[10px] uppercase tracking-widest">
      {m.label}
    </Badge>
  );
}

/* -------------------- Post form -------------------- */

function PostChallengeForm({
  communityId,
  onDone,
  onCancel,
}: {
  communityId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prizeDot, setPrizeDot] = useState<number>(100);
  const [maxWinners, setMaxWinners] = useState<number>(1);
  const [daysAhead, setDaysAhead] = useState<number>(7);
  const m = useMutation({
    mutationFn: () =>
      createChallenge({
        communityId,
        title,
        description,
        prizeDot,
        maxWinners,
        deadline: new Date(Date.now() + daysAhead * 86_400_000).toISOString(),
      }),
  });
  return (
    <Card className="mt-6">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-light">Post a new challenge</h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">
                {prizeDot * maxWinners} DOT will be escrowed now
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Held in your wallet until you pick winners (released to them) or
                cancel before deadline (refunded). Unspent balance auto-refunds
                at the deadline if any slot goes unfilled.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a 30s pitch for our accelerator" />
          </div>
          <div>
            <Label htmlFor="days">Days until deadline</Label>
            <Input id="days" type="number" min={1} max={30}
              value={daysAhead} onChange={(e) => setDaysAhead(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="prize">Prize per winner (DOT)</Label>
            <Input id="prize" type="number" min={10} max={100000}
              value={prizeDot} onChange={(e) => setPrizeDot(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="winners">Max winners</Label>
            <Input id="winners" type="number" min={1} max={50}
              value={maxWinners} onChange={(e) => setMaxWinners(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label htmlFor="desc">Description / what to submit</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell members what you want. Specific beats vague."
            rows={4} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!title || !description || prizeDot < 10 || m.isPending}
            onClick={async () => {
              await m.mutateAsync();
              onDone();
            }}
          >
            {m.isPending ? "Posting..." : `Escrow ${prizeDot * maxWinners} DOT & post`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

/* -------------------- Detail modal -------------------- */

function ChallengeDetailModal({
  challengeId,
  onClose,
  onChanged,
  currentUserId,
}: {
  challengeId: string;
  onClose: () => void;
  onChanged: () => void;
  currentUserId?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => getChallenge(challengeId),
  });
  const submitMut = useMutation({ mutationFn: () => submitBody });
  const awardMut = useMutation({ mutationFn: (winners: string[]) => awardChallenge(challengeId, winners) });
  const cancelMut = useMutation({ mutationFn: () => cancelChallenge(challengeId) });

  async function submitBody(input: { body: string }) {
    return submitToChallenge(challengeId, input);
  }

  if (isLoading || !data) {
    return (
      <Modal onClose={onClose}>
        <div className="h-40 animate-pulse rounded-2xl bg-card/40" />
      </Modal>
    );
  }

  const { challenge: c, submissions } = data;
  const isLeader = c.postedByUserId === currentUserId;
  const mySubmission = submissions.find((s) => s.userId === currentUserId);
  const winners = submissions.filter((s) => s.status === "winner").sort((a, b) => (a.winningRank ?? 0) - (b.winningRank ?? 0));

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
            <Trophy className="size-3" /> {c.prizeDot} DOT × {c.maxWinners}
          </p>
          <h3 className="mt-1 font-display text-2xl font-light tracking-tight">
            {c.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {c.description}
          </p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Member: submit entry */}
      {c.status === "open" && !isLeader && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          {mySubmission ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="size-4" />
              You submitted. Awaiting results.
            </div>
          ) : (
            <SubmitForm
              onSubmit={async (body) => {
                await submitMut.mutateAsync({ body });
                onChanged();
              }}
              pending={submitMut.isPending}
            />
          )}
        </div>
      )}

      {/* Leader: actions */}
      {isLeader && (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-5">
          <p className="mr-auto text-xs text-muted-foreground">
            Leader actions
          </p>
          {c.status === "open" && submissions.length > 0 && (
            <LeaderAwardForm
              submissions={submissions}
              maxWinners={c.maxWinners}
              onAward={async (winners) => {
                await awardMut.mutateAsync(winners);
                onChanged();
              }}
              pending={awardMut.isPending}
            />
          )}
          {(c.status === "open" || c.status === "judging") && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await cancelMut.mutateAsync();
                onChanged();
              }}
              disabled={cancelMut.isPending}
            >
              Cancel & refund
            </Button>
          )}
        </div>
      )}

      {/* Winners (when status=awarded) */}
      {winners.length > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h4 className="flex items-center gap-1.5 font-display text-sm uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Winners
          </h4>
          <ol className="mt-3 space-y-2">
            {winners.map((w, i) => (
              <li key={w.id} className="flex items-center gap-2 text-sm">
                <span className="font-display text-lg font-light tabular">
                  {i + 1}
                </span>
                <span className="truncate">
                  User {w.userId.slice(0, 8)}…
                </span>
                <span className="ml-auto text-xs font-medium text-primary">
                  +{w.payoutDot} DOT
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Submissions list (leader-visible) */}
      {isLeader && submissions.length > 0 && (
        <div className="mt-6">
          <h4 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Submissions ({submissions.length})
          </h4>
          <ul className="mt-3 space-y-2">
            {submissions.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="line-clamp-2">{s.body}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>User {s.userId.slice(0, 8)}…</span>
                  <span>·</span>
                  <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

function SubmitForm({ onSubmit, pending }: { onSubmit: (body: string) => Promise<void>; pending: boolean }) {
  const [body, setBody] = useState("");
  return (
    <div>
      <h4 className="font-display text-sm uppercase tracking-widest">
        Submit your entry
      </h4>
      <Textarea
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you build / write / decide? Concrete wins over fluff."
        className="mt-2"
      />
      <div className="mt-2 flex justify-end">
        <Button
          disabled={!body || pending}
          onClick={() => onSubmit(body)}
        >
          {pending ? "Submitting..." : "Submit entry"}
        </Button>
      </div>
    </div>
  );
}

function LeaderAwardForm({
  submissions,
  maxWinners,
  onAward,
  pending,
}: {
  submissions: ChallengeSubmission[];
  maxWinners: number;
  onAward: (winners: string[]) => Promise<void>;
  pending: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < maxWinners ? [...s, id] : s,
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
      <p className="text-xs">
        Pick winners ({selected.length}/{maxWinners}):
      </p>
      <div className="flex flex-wrap gap-1">
        {submissions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.userId)}
            className={`rounded-full border px-3 py-1 text-xs ${
              selected.includes(s.userId)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {s.userId.slice(0, 6)}…
          </button>
        ))}
      </div>
      <Button
        size="sm"
        disabled={selected.length === 0 || pending}
        onClick={() => onAward(selected)}
      >
        Award {selected.length} winner{selected.length === 1 ? "" : "s"} ({selected.length * Number(submissions[0]?.payoutDot ?? 0)} DOT)
      </Button>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}