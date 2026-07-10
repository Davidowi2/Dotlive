/**
 * /referrals — Referral dashboard.
 *
 * Tabs:
 *   1. My Referrals — Your code, stats, and referral list with claim flow
 *   2. Leaderboard — Top referrers with ranking
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Users,
  Wallet,
  Trophy,
  ArrowUpRight,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { claimReferral } from "@/api/referrals";
import type { Referral, ReferralStatus } from "@/api/referrals";
import { useMyReferrals, useReferralLeaderboard } from "@/hooks/use-referrals";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — DOT" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<"my" | "leaderboard">("my");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Refer & Earn"
          subtitle="Bring builders, founders, and investors onto DOT. Both of you earn 10 DOT."
          icon={<Users className="h-6 w-6" />}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "my" | "leaderboard")} className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my" className="gap-2">
              <Users className="h-4 w-4" />
              My Referrals
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-8">
            <MyReferralsTab />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-8">
            <LeaderboardTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/**
 * Task 10: My Referrals Tab
 */
function MyReferralsTab() {
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "vantage" | "name">("date");
  const [page, setPage] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimDialog, setClaimDialog] = useState<{ show: boolean; referral: Referral | null }>({
    show: false,
    referral: null,
  });

  const qc = useQueryClient();

  const pageSize = 50;

  const { referrer, referrals, pagination, isLoading, error } = useMyReferrals({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: pageSize,
    offset: page * pageSize,
  });

  const claimMutation = useMutation({
    mutationFn: (referralId: string) => claimReferral(referralId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referrals", "my"] });
      qc.invalidateQueries({ queryKey: ["referrals", "leaderboard"] });
      toast.success("Reward claimed! 10 DOT added to your wallet");
      setClaimDialog({ show: false, referral: null });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to claim reward");
    },
  });

  if (isLoading) {
    return <MyReferralsLoadingState />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
        <h3 className="mt-4 font-semibold">Could not load referrals</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    );
  }

  // Sort referrals
  const sortedReferrals = useMemo(() => {
    let sorted = [...referrals];
    switch (sortBy) {
      case "vantage":
        sorted.sort((a, b) => b.vantageScore - a.vantageScore);
        break;
      case "name":
        sorted.sort((a, b) => a.refereeName.localeCompare(b.refereeName));
        break;
      case "date":
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [referrals, sortBy]);

  const hasNextPage = pagination?.hasMore ?? false;
  const hasPrevPage = page > 0;

  return (
    <div className="space-y-6">
      {/* Referral Code Display */}
      <ReferralCodeSection code={referrer?.code ?? ""} />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Referrals"
          value={String(referrer?.totalReferrals ?? 0)}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Pending Referrals"
          value={String((referrer?.totalReferrals ?? 0) - (referrer?.completedReferrals ?? 0))}
          badge={{ text: "pending", variant: "secondary" }}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Completed Referrals"
          value={String(referrer?.completedReferrals ?? 0)}
          badge={{ text: "completed", variant: "default" }}
          icon={Check}
          accent="emerald"
        />
        <StatCard
          label="Pending Rewards"
          value={`${referrer?.pendingRewards ?? 0}`}
          sub="DOT"
          icon={Zap}
          accent="amber"
        />
        <StatCard
          label="Claimed Rewards"
          value={`${referrer?.claimedRewards ?? 0}`}
          sub="DOT"
          icon={Wallet}
          accent="emerald"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReferralStatus | "all")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rewarded">Rewarded</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm font-medium text-muted-foreground sm:ml-4">Sort:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "vantage" | "name")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (newest first)</SelectItem>
              <SelectItem value="vantage">Vantage Score</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Referrals List */}
      {sortedReferrals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">You haven't referred anyone yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your code to start earning. Both of you get 10 DOT.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Vantage Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <p className="font-medium">{ref.refereeName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">{ref.refereeEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{ref.vantageScore.toFixed(1)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <ReferralStatusBadge status={ref.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ref.status === "completed" && !ref.rewardClaimed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClaimDialog({ show: true, referral: ref })}
                          disabled={claimingId === ref.id}
                        >
                          {claimingId === ref.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Claim Reward"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {sortedReferrals.map((ref) => (
              <Card key={ref.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{ref.refereeName}</p>
                    <p className="text-xs text-muted-foreground">{ref.refereeEmail}</p>
                  </div>
                  <ReferralStatusBadge status={ref.status} />
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Vantage</p>
                    <p className="font-semibold">{ref.vantageScore.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Added</p>
                    <p className="text-xs">{new Date(ref.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {ref.status === "completed" && !ref.rewardClaimed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setClaimDialog({ show: true, referral: ref })}
                    disabled={claimingId === ref.id}
                  >
                    {claimingId === ref.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Claim Reward"
                    )}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Claim Reward Dialog */}
      <ClaimRewardDialog
        open={claimDialog.show}
        referral={claimDialog.referral}
        onOpenChange={(show) => setClaimDialog({ show, referral: show ? claimDialog.referral : null })}
        onClaim={() => {
          if (claimDialog.referral) {
            setClaimingId(claimDialog.referral.id);
            claimMutation.mutate(claimDialog.referral.id);
          }
        }}
        isLoading={claimMutation.isPending}
      />
    </div>
  );
}

/**
 * Task 11: Leaderboard Tab
 */
function LeaderboardTab() {
  const [sortBy, setSortBy] = useState<"rank" | "completed" | "earned">("rank");
  const [page, setPage] = useState(0);

  const pageSize = 20;

  const { leaderboard, userRank, pagination, isLoading, error } = useReferralLeaderboard({
    limit: pageSize,
    offset: page * pageSize,
  });

  if (isLoading) {
    return <LeaderboardLoadingState />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
        <h3 className="mt-4 font-semibold">Could not load leaderboard</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    );
  }

  const sortedLeaderboard = useMemo(() => {
    let sorted = [...leaderboard];
    switch (sortBy) {
      case "completed":
        sorted.sort((a, b) => b.completedReferrals - a.completedReferrals);
        break;
      case "earned":
        sorted.sort((a, b) => b.earnedRewards - a.earnedRewards);
        break;
      case "rank":
      default:
        sorted.sort((a, b) => a.rank - b.rank);
    }
    return sorted;
  }, [leaderboard, sortBy]);

  const hasNextPage = pagination?.hasMore ?? false;
  const hasPrevPage = page > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Referrers
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "rank" | "completed" | "earned")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Rank</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="earned">Earned DOT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User's Rank Highlight */}
      {userRank && (
        <Card className="border-2 border-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
                #{userRank.rank}
              </div>
              <div>
                <p className="font-semibold">Your Position</p>
                <p className="text-sm text-muted-foreground">{userRank.completedReferrals} completed referrals</p>
              </div>
            </div>
            <Badge variant="outline">You</Badge>
          </div>
        </Card>
      )}

      {/* Leaderboard List */}
      {sortedLeaderboard.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No referrers yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to start referring and earn a spot on the leaderboard.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Earned DOT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedLeaderboard.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={cn(
                      "hover:bg-muted/20",
                      userRank?.rank === entry.rank ? "bg-primary/5" : ""
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold text-xs">
                          {entry.rank <= 3 ? (
                            <span className="text-base">
                              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            entry.rank
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {entry.avatar && (
                          <img
                            src={entry.avatar}
                            alt={entry.userName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <p className="font-medium">{entry.userName}</p>
                        {userRank?.rank === entry.rank && (
                          <Badge variant="outline" className="text-[10px]">
                            You
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{entry.totalReferrals}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{entry.completedReferrals}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold">{entry.earnedRewards} DOT</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {sortedLeaderboard.map((entry) => (
              <Card
                key={entry.userId}
                className={cn(
                  userRank?.rank === entry.rank ? "border-2 border-primary bg-primary/5" : ""
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold">
                        {entry.rank <= 3 ? (
                          <span className="text-lg">
                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          entry.rank
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{entry.userName}</p>
                        <p className="text-xs text-muted-foreground">#{entry.rank}</p>
                      </div>
                    </div>
                    {userRank?.rank === entry.rank && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">{entry.totalReferrals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-semibold">{entry.completedReferrals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">DOT</p>
                      <p className="font-semibold">{entry.earnedRewards}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Task 12: Claim Reward Dialog & Flow
 */
function ClaimRewardDialog({
  open,
  referral,
  onOpenChange,
  onClaim,
  isLoading,
}: {
  open: boolean;
  referral: Referral | null;
  onOpenChange: (open: boolean) => void;
  onClaim: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim Reward</DialogTitle>
          <DialogDescription>
            {referral ? `${referral.refereeName}'s referral` : ""}
          </DialogDescription>
        </DialogHeader>

        {referral && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Reward Amount</p>
              <p className="mt-1 text-3xl font-bold text-primary">10 DOT</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Referral Details</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Name: {referral.refereeName}</p>
                <p>Email: {referral.refereeEmail}</p>
                <p>Vantage Score: {referral.vantageScore.toFixed(1)}</p>
                <p>Date: {new Date(referral.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                <strong>Note:</strong> This reward will be added to your wallet immediately upon claim.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={onClaim}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper Components & Functions
 */

function ReferralCodeSection({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const link = `https://dotlive.africa/join?ref=${code}`;

  async function handleCopy(text: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success("Copied!");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy. Try selecting manually.");
    }
  }

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Your Referral Code
          </p>
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-secondary/40 px-4 py-3 font-mono text-2xl font-bold tracking-widest flex-1">
              {code}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(code, "code")}
              aria-label="Copy code"
              title="Copy code to clipboard"
            >
              {copied === "code" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Share Link
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={link}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs sm:text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(link, "link")}
              aria-label="Copy link"
              title="Copy link to clipboard"
            >
              {copied === "link" ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <a href={link} target="_blank" rel="noreferrer">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open link"
                title="Open referral link in new tab"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            💡 Share this link with your network. Both of you earn 10 DOT when they sign up.
          </p>
        </div>
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  sub,
  badge,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: { text: string; variant: "default" | "secondary" };
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  const accentColors = {
    primary: "text-primary bg-primary/10",
    amber: "text-amber-600 bg-amber-500/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
    muted: "text-muted-foreground bg-muted/20",
  } as const;

  const color = accentColors[accent as keyof typeof accentColors] || accentColors.primary;

  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>
        <Icon className={`h-4 w-4 ${color.split(" ")[0]}`} />
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
        {badge && (
          <Badge variant={badge.variant} className="text-[10px] ml-2">
            {badge.text}
          </Badge>
        )}
      </div>
      {sub && (
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      )}
    </Card>
  );
}

function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const variants = {
    pending: { variant: "secondary" as const, text: "Pending", icon: "⏳" },
    completed: { variant: "default" as const, text: "Completed", icon: "✓" },
    rewarded: { variant: "default" as const, text: "Rewarded", icon: "★" },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant}>
      {config.icon} {config.text}
    </Badge>
  );
}

function MyReferralsLoadingState() {
  return (
    <div className="space-y-6">
      {/* Code section skeleton */}
      <Skeleton className="h-32 w-full rounded-lg" />

      {/* Stats skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function LeaderboardLoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}