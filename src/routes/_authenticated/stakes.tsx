/**
 * /stakes — Stake DOT to earn 12% APY with a 14-day cooldown.
 *
 * Reads the live /api/stakes endpoint. No mock data.
 * Earned rewards come from `rewardAccrued` (server-computed).
 * Claim button is disabled until the 14-day lock has elapsed.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Plus, Unlock, Sparkles, Clock, AlertCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getStakes,
  createStake,
  unstake,
  claimRewards,
  type StakePosition,
} from "@/api/stakes";
import { useWallet } from "@/hooks/use-dot-data";
import { formatDot } from "@/lib/constants";
import { toast } from "sonner";

const COOLDOWN_DAYS = 14;
const APY_PCT = 12;
const MIN_STAKE_DOT = 100;

export const Route = createFileRoute("/_authenticated/stakes")({
  head: () => ({ meta: [{ title: "Stakes — DOT" }] }),
  component: StakesPage,
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function StakesPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const { data: balance } = useWallet();

  const stakesQ = useQuery({
    queryKey: ["stakes", "list", user?.id],
    enabled: !!user,
    queryFn: getStakes,
  });

  const [amount, setAmount] = useState<string>("500");

  const createMut = useMutation({
    mutationFn: (n: number) => createStake({ amount: n }),
    onSuccess: () => {
      toast.success(`Staked ${formatDot(Number(amount))} DOT`);
      qc.invalidateQueries({ queryKey: ["stakes"] });
      qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
      setAmount("500");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not stake"),
  });

  const unstakeMut = useMutation({
    mutationFn: (id: string) => unstake(id),
    onSuccess: () => {
      toast.success("Unstake started — 14-day cooldown begins");
      qc.invalidateQueries({ queryKey: ["stakes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not unstake"),
  });

  const claimMut = useMutation({
    mutationFn: (id: string) => claimRewards(id),
    onSuccess: (res: any) => {
      const claimed = Number(res?.claimed ?? 0);
      toast.success(
        claimed > 0
          ? `Claimed ${formatDot(claimed)} DOT in rewards`
          : "Nothing to claim yet"
      );
      qc.invalidateQueries({ queryKey: ["stakes"] });
      qc.invalidateQueries({ queryKey: ["wallet", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not claim"),
  });

  if (stakesQ.isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Stakes" title="Stake DOT" />
        <PageSkeleton.StatCards count={3} />
        <PageSkeleton.CardGrid count={2} cols={1} />
      </AppShell>
    );
  }

  if (stakesQ.error) {
    return (
      <AppShell>
        <PageHeader eyebrow="Stakes" title="Stake DOT" />
        <EmptyState
          icon={AlertCircle}
          title="Could not load stakes"
          description="The stakes service is unreachable. Try again in a moment."
          action={
            <Button onClick={() => stakesQ.refetch()} variant="outline">
              Retry
            </Button>
          }
        />
      </AppShell>
    );
  }

  const stakes: StakePosition[] = stakesQ.data ?? [];
  const totalStaked = stakes
    .filter((s) => s.status === "active" || s.status === "unstaking")
    .reduce((acc, s) => acc + Number(s.amount), 0);
  const totalRewards = stakes.reduce(
    (acc, s) => acc + Number(s.rewardClaimed) + Number(s.rewardAccrued),
    0
  );
  const activeCount = stakes.filter((s) => s.status === "active").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Stakes"
        title="Stake DOT"
        subtitle={`Earn ${APY_PCT}% APY with a ${COOLDOWN_DAYS}-day cooldown. Skin in the game is the only credibility that can't be faked.`}
      />

      <PageIntent
        icon={<Lock className="size-5" />}
        intent="How much DOT have you put on the line for your venture?"
        context="Active stakes, accrued rewards, and the cooldown timer on every position."
      />

      {/* Summary cards */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total staked"
          value={`${formatDot(totalStaked)} DOT`}
          icon={Lock}
          accent="primary"
        />
        <SummaryCard
          label="Active positions"
          value={String(activeCount)}
          icon={Sparkles}
          accent="teal"
        />
        <SummaryCard
          label="Lifetime rewards"
          value={`${formatDot(totalRewards)} DOT`}
          icon={Clock}
          accent="gold"
        />
      </section>

      {/* New stake */}
      <Card className="mt-6">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-semibold">New stake</p>
            <p className="text-xs text-muted-foreground">
              Available balance: {formatDot(Number(balance ?? 0))} DOT
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="stake-amount">Amount (DOT)</Label>
              <Input
                id="stake-amount"
                type="number"
                min={MIN_STAKE_DOT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
              />
            </div>
            <Button
              onClick={() => {
                const n = Number(amount);
                if (!Number.isFinite(n) || n < MIN_STAKE_DOT) {
                  toast.error(`Minimum stake is ${MIN_STAKE_DOT} DOT`);
                  return;
                }
                if (balance != null && n > Number(balance)) {
                  toast.error("Amount exceeds your balance");
                  return;
                }
                createMut.mutate(n);
              }}
              disabled={createMut.isPending}
              className="sm:w-40"
            >
              {createMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Stake DOT
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Rewards are calculated against the locked principal and become
            claimable after the {COOLDOWN_DAYS}-day cooldown ends. Claim
            manually — no auto-payout.
          </p>
        </CardContent>
      </Card>

      {/* Positions */}
      <section className="mt-8">
        <h2 className="text-sm font-display font-semibold">Your positions</h2>
        {stakes.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No active stakes"
            description={`Start a stake above to earn ${APY_PCT}% APY. ${COOLDOWN_DAYS}-day cooldown applies to all positions.`}
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {stakes.map((s) => (
              <StakeRow
                key={s.id}
                stake={s}
                busy={
                  unstakeMut.isPending || claimMut.isPending
                }
                onUnstake={() => unstakeMut.mutate(s.id)}
                onClaim={() => claimMut.mutate(s.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 text-center text-xs text-muted-foreground">
        <Link to="/wallet" className="hover:text-foreground">
          ← Back to wallet
        </Link>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Lock;
  accent: "primary" | "teal" | "gold";
}) {
  const ring = {
    primary: "ring-primary/20 bg-primary/5",
    teal: "ring-teal/20 bg-teal/5",
    gold: "ring-gold/20 bg-gold/5",
  }[accent];
  const text = {
    primary: "text-primary",
    teal: "text-teal",
    gold: "text-gold",
  }[accent];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-border p-4 ring-1 ring-inset ${ring}`}
    >
      <span
        className={`flex size-10 items-center justify-center rounded-lg bg-card ${text}`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-lg font-light tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function StakeRow({
  stake,
  busy,
  onUnstake,
  onClaim,
}: {
  stake: StakePosition;
  busy: boolean;
  onUnstake: () => void;
  onClaim: () => void;
}) {
  const isActive = stake.status === "active";
  const isUnstaking = stake.status === "unstaking";
  const days = daysUntil(stake.lockEndsAt);
  const canUnstake = isActive && days === 0;
  const claimable = Number(stake.rewardAccrued) > 0;
  const canClaim = !isActive ? false : isActive && days === 0 && claimable;

  const statusLabel: Record<StakePosition["status"], string> = {
    active: "Active",
    unstaking: `Unstaking · ${days}d to release`,
    unstaked: "Unstaked",
    claimed: "Claimed",
  };

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-lg font-light">
            {formatDot(Number(stake.amount))} DOT · {stake.apyPct}% APY
          </p>
          <p className="text-xs text-muted-foreground">
            {statusLabel[stake.status]} · started {formatDate(stake.createdAt)}
            {isActive && days > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Lock className="size-3" /> {days}d until unlock
              </span>
            ) : null}
          </p>
          {Number(stake.rewardAccrued) > 0 ? (
            <p className="text-xs text-gold">
              Accrued: {formatDot(Number(stake.rewardAccrued))} DOT
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {isActive ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!canUnstake || busy}
              onClick={onUnstake}
            >
              <Unlock className="size-4" /> Unstake
            </Button>
          ) : null}
          {isActive ? (
            <Button
              size="sm"
              disabled={!canClaim || busy}
              onClick={onClaim}
            >
              <Sparkles className="size-4" /> Claim
            </Button>
          ) : null}
        </div>
      </div>
      {isUnstaking ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Funds return to your available balance on {formatDate(stake.lockEndsAt)}.
        </p>
      ) : null}
    </li>
  );
}
