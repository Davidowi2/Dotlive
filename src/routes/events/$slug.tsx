import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  CalendarDays, Clock, Trophy, Vote, Users, Sparkles, ArrowLeft,
  Loader2, CheckCircle2, ExternalLink, Heart, Building2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dotApi } from "@/api/client";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events/$slug")({
  head: () => ({ meta: [{ title: "DOT Demo Event — DOT" }] }),
  component: DemoEventPage,
});

interface DemoEvent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startDate: string | Date;
  endDate: string | Date;
  registrationDeadline: string | Date | null;
  votingOpensAt: string | Date | null;
  votingClosesAt: string | Date | null;
  tracks: string[];
  sponsors: any[];
  judges: any[];
  prizePoolDot: string | null;
  livestreamUrl: string | null;
  registrationFeeDot: string | null;
  status: string;
}

interface LeaderboardRow {
  targetId: string;
  targetType: string;
  totalVotes: number;
  totalWeight: string;
  uniqueVoters: number;
}

function DemoEventPage() {
  const { slug } = useParams({ from: "/events/$slug" });
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["demo-event", slug],
    queryFn: async () => {
      const res = await dotApi.get<{ event: DemoEvent; voteCounts: any[] }>(`/api/demo/events/${slug}`);
      return res;
    },
    staleTime: 30_000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["demo-leaderboard", slug],
    queryFn: async () => {
      const res = await dotApi.get<{ leaderboard: LeaderboardRow[] }>(`/api/votes/${slug}/leaderboard`);
      return res.leaderboard ?? [];
    },
    staleTime: 15_000,
  });

  const { data: ventures = [] } = useQuery({
    queryKey: ["showcase"],
    queryFn: async () => {
      const res = await dotApi.get<any>("/api/founder-profiles");
      return res.ventures ?? res.profiles ?? [];
    },
    staleTime: 60_000,
  });

  const voteMutation = useMutation({
    mutationFn: async (targetId: string) => {
      return await dotApi.post("/api/votes", {
        eventSlug: slug,
        targetType: "venture",
        targetId,
      });
    },
    onSuccess: () => {
      toast.success("Vote cast");
      qc.invalidateQueries({ queryKey: ["demo-leaderboard", slug] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Vote failed"),
  });

  if (isLoading || !data) {
    return (
      <AppShell>
        <PageHeader title="Loading..." subtitle="" />
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }

  const { event } = data;
  const isVotingOpen = event.status === "voting_open" || event.status === "live";
  const isRegistrationOpen = event.status === "registration_open" || event.status === "live";

  return (
    <AppShell>
      <div className="mb-4">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          All events
        </Link>
      </div>

      {/* Hero */}
      <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
        <CardContent className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className={cn(
                "text-[10px] uppercase tracking-wider mb-2",
                event.status === "live" && "bg-red-500 text-white",
                event.status === "voting_open" && "bg-blue-500 text-white",
                event.status === "registration_open" && "bg-primary text-primary-foreground",
                event.status === "upcoming" && "bg-muted text-muted-foreground",
              )}>
                {event.status === "live" ? "🔴 LIVE" : event.status.replace("_", " ").toUpperCase()}
              </Badge>
              <h1 className="text-3xl font-bold md:text-4xl">{event.name}</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">{event.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {event.prizePoolDot && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-gold tabular-nums">{Number(event.prizePoolDot).toLocaleString()}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">DOT prize pool</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isRegistrationOpen && (
              <Button size="lg">
                Apply to pitch
                <Sparkles className="size-4" />
              </Button>
            )}
            {event.livestreamUrl && event.status === "live" && (
              <Button size="lg" variant="outline" asChild>
                <a href={event.livestreamUrl} target="_blank" rel="noreferrer">
                  Watch livestream <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Meta grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Event date
              </div>
              <div className="mt-0.5 font-medium">{new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
            {event.registrationDeadline && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  Register by
                </div>
                <div className="mt-0.5 font-medium">{new Date(event.registrationDeadline).toLocaleDateString()}</div>
              </div>
            )}
            {event.votingClosesAt && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Vote className="size-3.5" />
                  Voting closes
                </div>
                <div className="mt-0.5 font-medium">{new Date(event.votingClosesAt).toLocaleDateString()}</div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="size-3.5" />
                Tracks
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {event.tracks.map(t => (
                  <Badge key={t} variant="outline" className="text-[10px] capitalize">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting section */}
      {isVotingOpen && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Vote for your favorite venture</h2>
            <Badge variant="outline">{leaderboard?.length ?? 0} contenders</Badge>
          </div>

          {!user && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex items-center gap-3 p-4 text-sm text-amber-700">
                Sign in to cast your vote.
                <Button asChild size="sm" variant="outline" className="ml-auto">
                  <Link to="/auth?mode=signin">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {ventures.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                Ventures will appear here as they apply.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ventures.map((v: any) => {
                const lb = leaderboard?.find(r => r.targetId === v.user_id);
                const votes = Number(lb?.totalVotes ?? 0);
                return (
                  <Card key={v.user_id ?? v.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-lg">{v.venture_name ?? "Unnamed venture"}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.industry ?? "—"} · {v.stage ?? "—"}
                          </div>
                        </div>
                        {votes > 0 && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary tabular-nums">{votes}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">votes</div>
                          </div>
                        )}
                      </div>
                      {v.bio && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{v.bio}</p>}
                      <Button
                        className="mt-4 w-full"
                        size="sm"
                        variant={votes > 0 ? "outline" : "default"}
                        disabled={!user || voteMutation.isPending}
                        onClick={() => voteMutation.mutate(v.user_id ?? v.id)}
                      >
                        <Heart className="size-4" />
                        Vote
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard && leaderboard.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Live leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.map((row, i) => (
                  <div key={row.targetId} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                        i === 0 && "bg-gold text-white",
                        i === 1 && "bg-slate-400 text-white",
                        i === 2 && "bg-amber-700 text-white",
                        i > 2 && "bg-muted text-muted-foreground",
                      )}>{i + 1}</span>
                      <span className="font-medium">{ventures.find((v: any) => (v.user_id ?? v.id) === row.targetId)?.venture_name ?? row.targetId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span><Users className="inline size-3" /> {row.uniqueVoters}</span>
                      <span className="font-medium text-foreground tabular-nums">{Number(row.totalVotes)} votes</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Sponsors */}
      {event.sponsors && event.sponsors.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sponsors</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {event.sponsors.map((s: any, i: number) => (
              <Card key={i} className="border">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                  <Building2 className="size-5 text-muted-foreground" />
                  <div className="mt-2 text-sm font-medium">{s.name ?? `Sponsor ${i + 1}`}</div>
                  {s.tier && <Badge variant="outline" className="mt-1 text-[10px] capitalize">{s.tier}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Judges */}
      {event.judges && event.judges.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Judges</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {event.judges.map((j: any, i: number) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {j.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <div className="font-medium">{j.name ?? `Judge ${i + 1}`}</div>
                    <div className="text-xs text-muted-foreground">{j.role ?? ""}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
