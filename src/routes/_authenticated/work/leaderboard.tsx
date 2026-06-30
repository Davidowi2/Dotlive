/**
 * DOT Work Leaderboard — public reputation surface.
 *
 * Sort: earnings (DOT earned) | contracts (completed orders) | reputation
 * Default: top 50.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Briefcase, Award, Crown } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getLeaderboard, type Leader } from "@/api/leaderboard";

export const Route = createFileRoute("/_authenticated/work/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard · DOT Work" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [sort, setSort] = useState<"earnings" | "contracts" | "reputation">("earnings");
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", sort],
    queryFn: () => getLeaderboard(sort),
    refetchInterval: 60_000,
  });
  const leaders: Leader[] = data?.leaders ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Public ranking"
        title="DOT Work Leaderboard"
        subtitle="Top builders by DOT earned, contracts completed, and reputation. Refreshes every 60s."
        action={
          <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
            <TabsList>
              <TabsTrigger value="earnings">
                <Trophy className="mr-1.5 size-3.5" /> Earnings
              </TabsTrigger>
              <TabsTrigger value="contracts">
                <Briefcase className="mr-1.5 size-3.5" /> Contracts
              </TabsTrigger>
              <TabsTrigger value="reputation">
                <Award className="mr-1.5 size-3.5" /> Reputation
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {isLoading ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card/40" />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No leaderboard data yet. Complete a gig to appear here.
          </CardContent>
        </Card>
      ) : (
        <ol className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l, i) => (
            <li key={l.id}>
              <LeaderRow leader={l} rank={i + 1} sort={sort} />
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}

function LeaderRow({ leader, rank, sort }: { leader: Leader; rank: number; sort: string }) {
  const initial = (leader.name ?? leader.id).slice(0, 1).toUpperCase();
  const podium = rank <= 3;
  const accent =
    rank === 1 ? "from-amber-300/30 border-amber-300/40" :
    rank === 2 ? "from-zinc-300/20 border-zinc-300/30" :
    rank === 3 ? "from-orange-300/20 border-orange-300/30" :
    "from-card border-border";

  return (
    <Card className={`bg-gradient-to-br ${accent} to-card`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex flex-col items-center">
          <span className="font-display text-2xl font-light tabular text-muted-foreground">
            {rank}
          </span>
          {podium && (
            <Crown className={`size-3 ${
              rank === 1 ? "text-amber-400" :
              rank === 2 ? "text-zinc-300" :
              "text-orange-300"
            }`} />
          )}
        </div>
        <Avatar className="size-10">
          {leader.avatar_url && <AvatarImage src={leader.avatar_url} />}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {leader.name ?? `User ${leader.id.slice(0, 6)}`}
          </p>
          {leader.headline && (
            <p className="truncate text-xs text-muted-foreground">{leader.headline}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-light tabular text-primary">
            {sort === "earnings" && `${Number(leader.dot_earned).toFixed(0)}`}
            {sort === "contracts" && `${leader.contracts_completed}`}
            {sort === "reputation" && `${leader.reputation}`}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {sort === "earnings" && "DOT earned"}
            {sort === "contracts" && "contracts"}
            {sort === "reputation" && "rep"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}