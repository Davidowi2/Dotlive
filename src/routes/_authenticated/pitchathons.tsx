import { useState } from "react";
import { useRoleGate } from "@/hooks/use-role-gate";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Trophy,
  Loader2,
  Upload,
  Medal,
  FileText,
  CalendarDays,
  Sparkles,
  Award,
  Crown,
  ArrowRight,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { EcosystemEmptyState } from "@/components/app/EcosystemEmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useFounderProfile } from "@/hooks/use-dot-data";
import {
  listPitchathons,
  applyToPitchathon,
  getMyApplications,
  getLeaderboard,
} from "@/api/pitchathons";
import { uploadDocument } from "@/api/upload";
import { formatNaira } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Pitchathon } from "@/types/api";

export const Route = createFileRoute("/_authenticated/pitchathons")({
  head: () => ({
    meta: [
      { title: "Pitchathons — DOT" },
      { name: "description", content: "Compete in DOT Pitchathons and get in front of investors." },
    ],
  }),
  component: PitchathonsPage,
});

/**
 * Pitchathons page
 *
 * Lists upcoming competitions, the founder's application state, and any
 * past winners (via leaderboard data). Featured/next pitchathon gets a
 * highlighted card at the top.
 */
function PitchathonsPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const { data: founder } = useFounderProfile();
  const [active, setActive] = useState<string | null>(null);
  const [ventureName, setVentureName] = useState("");
  const [fundingAsk, setFundingAsk] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: pitchathons = [], isLoading } = useQuery({
    queryKey: ["pitchathons"],
    queryFn: listPitchathons,
  });

  const { data: myApps = [] } = useQuery({
    queryKey: ["my-applications"],
    enabled: !!user,
    queryFn: getMyApplications,
  });

  const applyMutation = useMutation({
    mutationFn: async (pitchathonId: string) => {
      let deckUrl: string | null = null;
      if (file) {
        deckUrl = await uploadDocument(file, "pitch-decks");
      }
      return applyToPitchathon(pitchathonId, {
        ventureName: ventureName || (founder as { venture_name?: string })?.venture_name || "",
        pitchDeckUrl: deckUrl,
        fundingAsk: fundingAsk ? Number(fundingAsk) : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Application submitted!");
      setActive(null);
      setVentureName("");
      setFundingAsk("");
      setFile(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    },
  });

  const appliedTo = new Set(myApps.map((a) => a.pitchathonId));

  const open = pitchathons.filter((p) => p.status === "open");
  const upcoming = pitchathons.filter((p) => p.status === "upcoming");
  const closed = pitchathons.filter((p) => p.status === "closed");
  const featured: Pitchathon | undefined = open[0] ?? upcoming[0];

  const gate = useRoleGate(["founder", "investor", "admin", "capital_partner"], { redirect: "/dashboard" });
  if (!gate.allowed) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <h2 className="text-2xl font-semibold">Pitchathons access only</h2>
          <p className="mt-2 text-muted-foreground">You need the founder, investor, or operator role to view pitchathons.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pitch"
        title="Pitchathons"
        subtitle="Submit your venture, get scored by judges, and climb the leaderboard."
        action={
          appliedTo.size > 0 ? (
            <Badge variant="secondary">
              <Award className="mr-1 size-3" /> {appliedTo.size} applied
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
              <PageSkeleton.CardGrid count={3} cols={1} />
            ) : pitchathons.length === 0 ? (
              <EcosystemEmptyState
                icon={Trophy}
                title="No pitchathons scheduled"
                subtitle="Live pitch competitions where founders present to investors and judges. Built for accountability and momentum."
                postedBy="Capital Partners and Admins"
                requiredRole={["capital_partner", "admin"]}
                accent="purple"
                secondaryAction={{ label: "See venture list", href: "/discover" }}
              />
            ) : (
        <>
          {/* ── Featured / next pitchathon ──────────────────────── */}
          {featured && (
            <>
              <div className="mt-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px flex-1 bg-border" />
                <Sparkles className="size-3 text-primary" />
                <span>Featured</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <FeaturedPitchathon
                pitchathon={featured}
                applied={appliedTo.has(featured.id)}
                onApply={() => {
                  setActive(featured.id);
                  setVentureName(
                    (founder as { venture_name?: string })?.venture_name ?? ""
                  );
                }}
              />
            </>
          )}

          {/* ── Open competitions ──────────────────────────────── */}
          {open.length > 1 && (
            <>
              <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px flex-1 bg-border" />
                <span>Open for applications</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-4">
                {open.slice(1).map((p) => (
                  <PitchathonCard
                    key={p.id}
                    pitchathon={p}
                    applied={appliedTo.has(p.id)}
                    onApply={() => {
                      setActive(p.id);
                      setVentureName(
                        (founder as { venture_name?: string })?.venture_name ?? ""
                      );
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Upcoming ────────────────────────────────────────── */}
          {upcoming.length > 0 && (
            <>
              <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px flex-1 bg-border" />
                <Clock className="size-3" />
                <span>Coming up</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-4">
                {upcoming.map((p) => (
                  <PitchathonCard
                    key={p.id}
                    pitchathon={p}
                    applied={appliedTo.has(p.id)}
                    onApply={() => {
                      setActive(p.id);
                      setVentureName(
                        (founder as { venture_name?: string })?.venture_name ?? ""
                      );
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Past winners (closed) ─────────────────────────── */}
          {closed.length > 0 && (
            <>
              <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px flex-1 bg-border" />
                <Crown className="size-3 text-gold" />
                <span>Past winners</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-4">
                {closed.map((p) => (
                  <PitchathonCard
                    key={p.id}
                    pitchathon={p}
                    applied={false}
                    onApply={() => undefined}
                    showLeaderboard
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Empty footer ───────────────────────────────────── */}
          {pitchathons.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/50 px-5 py-4">
              <p className="text-xs text-muted-foreground">
                Strong applications start with a clear Vantage score. Update yours before pitching.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vantage">
                  Update Vantage <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to pitchathon</DialogTitle>
            <DialogDescription>
              Submit your venture details and pitch deck. Judges will review and score your entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vn">Venture name</Label>
              <Input id="vn" value={ventureName} onChange={(e) => setVentureName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ask">Funding ask (₦)</Label>
              <Input
                id="ask"
                type="number"
                value={fundingAsk}
                onChange={(e) => setFundingAsk(e.target.value)}
                placeholder="5000000"
              />
              {fundingAsk && (
                <p className="text-xs text-muted-foreground">{formatNaira(Number(fundingAsk))}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck">Pitch deck (PDF)</Label>
              <Input
                id="deck"
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="size-3" /> {file.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="hero"
              onClick={() => active && applyMutation.mutate(active)}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ── Featured pitchathon (highlighted top card) ───────────────────────── */

function FeaturedPitchathon({
  pitchathon: p,
  applied,
  onApply,
}: {
  pitchathon: Pitchathon;
  applied: boolean;
  onApply: () => void;
}) {
  return (
    <section className="relative mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-card p-6 shadow-soft sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="text-[10px] tracking-widest uppercase font-semibold text-primary">
                Next up
              </p>
              <h2 className="font-display text-2xl font-light tracking-tight">{p.title}</h2>
            </div>
          </div>
          {p.description && (
            <p className="mt-3 text-sm font-light text-muted-foreground">{p.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
            {p.prize && (
              <span className="inline-flex items-center gap-1.5 font-medium text-gold">
                <Award className="size-3.5" /> Prize · {p.prize}
              </span>
            )}
            {p.startDate && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {new Date(p.startDate).toLocaleDateString("en", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            <Badge variant="outline" className="border-primary/30 text-primary">
              {p.status}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {applied ? (
            <Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary">
              <Award className="mr-1 size-3" /> Applied
            </Badge>
          ) : p.status === "open" ? (
            <Button variant="hero" size="lg" onClick={onApply}>
              Apply now <ArrowRight className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ── Standard pitchathon card (with optional leaderboard) ────────────── */

function PitchathonCard({
  pitchathon: p,
  applied,
  onApply,
  showLeaderboard,
}: {
  pitchathon: Pitchathon;
  applied: boolean;
  onApply: () => void;
  showLeaderboard?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-light tracking-tight">{p.title}</h3>
            <Badge variant={p.status === "open" ? "default" : "secondary"}>{p.status}</Badge>
          </div>
          {p.description && (
            <p className="mt-2 line-clamp-2 text-sm font-light text-muted-foreground">
              {p.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {p.prize && (
              <span className="inline-flex items-center gap-1 font-medium text-gold">
                <Award className="size-3" /> {p.prize}
              </span>
            )}
            {p.startDate && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="size-3" />
                {new Date(p.startDate).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {applied ? (
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Award className="mr-1 size-3" /> Applied
            </Badge>
          ) : p.status === "open" ? (
            <Button variant="hero" size="sm" onClick={onApply}>
              Apply <ArrowRight className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {showLeaderboard && <Leaderboard pitchathonId={p.id} />}
    </div>
  );
}

/* ── Leaderboard ──────────────────────────────────────────────────────── */

function Leaderboard({ pitchathonId }: { pitchathonId: string }) {
  const { data } = useQuery({
    queryKey: ["leaderboard", pitchathonId],
    queryFn: () => getLeaderboard(pitchathonId),
  });

  const filtered = (data ?? []).filter((r) => r.count > 0).sort((a, b) => b.avg - a.avg);
  if (filtered.length === 0) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <p className="text-sm font-medium">Leaderboard</p>
        <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
          Avg score
        </span>
      </div>
      <ul className="divide-y divide-border">
        {filtered.map((row, i) => (
          <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                i === 0
                  ? "bg-gold/20 text-gold"
                  : i < 3
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < 3 ? <Medal className="size-4" /> : i + 1}
            </span>
            <span className="flex-1 text-sm font-medium">{row.name}</span>
            <span className="text-sm tabular text-muted-foreground">
              {row.avg.toFixed(1)}
              <span className="ml-1 text-xs text-muted-foreground/70">({row.count})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}