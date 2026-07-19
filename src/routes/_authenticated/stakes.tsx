/**
 * /stakes — Stake DOT to unlock tier benefits.
 *
 * Reads the live /api/stakes endpoint. No mock data.
 * Stakes unlock premium features by tier: Bronze, Silver, Gold, Platinum.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Plus, Unlock, AlertCircle, Loader2, Check } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getStakes,
  createStake,
  unstake,
  type StakePosition,
  type StakerTier,
  type StakesResponse,
} from "@/api/stakes";
import { useWallet } from "@/hooks/use-dot-data";
import { formatDot } from "@/lib/constants";
import { toast } from "sonner";

const COOLDOWN_DAYS = 14;
const MIN_STAKE_DOT = 100;

const TIERS: { name: string; min: number; color: string }[] = [
  { name: "Bronze", min: 100, color: "text-orange-700" },
  { name: "Silver", min: 1000, color: "text-slate-500" },
  { name: "Gold", min: 10000, color: "text-yellow-600" },
  { name: "Platinum", min: 100000, color: "text-indigo-600" },
];

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

function tierProgress(totalStaked: number, tier: StakerTier | undefined) {
  const current = TIERS.find((t) => t.name === tier?.name) ?? null;
  const next = current ? TIERS[TIERS.indexOf(current) + 1] : TIERS[0];
  if (!next) return { label: "Max tier reached", remaining: 0, nextName: current?.name ?? "Platinum" };
  const remaining = Math.max(0, next.min - totalStaked);
  return { label: `${formatDot(remaining)} more DOT to reach ${next.name}`, remaining, nextName: next.name };
}

function StakesPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const { data: balance } = useWallet();

  const stakesQ = useQuery<StakesResponse>({
    queryKey: ["stakes", "list", user?.id],
    enabled: !!user,
    queryFn: getStakes,
  });

  const stakes: StakePosition[] = stakesQ.data?.stakes ?? [];
  const tier = stakesQ.data?.tier;

  const activeStakes = stakes.filter((s) => s.status === "active" || s.status === "unstaking");
  const totalStaked = activeStakes.reduce((acc, s) => acc + Number(s.amount), 0);
  const activeCount = stakes.filter((s) => s.status === "active").length;
  const progress = tierProgress(totalStaked, tier);

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
      toast.success("Unstake started — cooldown begins");
      qc.invalidateQueries({ queryKey: ["stakes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not unstake"),
  });

  const [amount, setAmount] = useState("500");

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

  return (
    <AppShell>
      <PageHeader
        eyebrow="Stakes"
        title="Stake DOT"
        subtitle="Stake DOT to unlock tier benefits. A cooldown applies when unstaking."
      />

      <PageIntent
        icon={<Lock className="size-5" />}
        intent="How much DOT have you committed to your reputation on DOT?"
        context="Each stake contributes to your tier. Higher tiers unlock platform benefits."
      />

      {/* Tier banner */}
      {tier && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current tier</p>
              <p className="font-display text-xl font-light">{tier.name}</p>
            </div>
            <Badge variant="secondary">Level {tier.level}</Badge>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium tabular-nums">{progress.label}</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (totalStaked / Math.max(1, progress.remaining + totalStaked)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {tier.benefits.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {tier.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-foreground/80">
                  <Check className="size-3.5 text-teal" /> {b}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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
          icon={Unlock}
          accent="teal"
        />
        <SummaryCard
          label="Next tier"
          value={progress.nextName}
          sub={progress.label}
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
            Staked DOT contributes to your tier. Unstaking starts a cooldown before funds return to your wallet.
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
            description={`Start a stake above to unlock premium features. ${COOLDOWN_DAYS}-day cooldown applies to all positions.`}
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {stakes.map((s) => (
              <StakeRow
                key={s.id}
                stake={s}
                busy={unstakeMut.isPending}
                onUnstake={() => unstakeMut.mutate(s.id)}
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
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
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
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function StakeRow({
  stake,
  busy,
  onUnstake,
}: {
  stake: StakePosition;
  busy: boolean;
  onUnstake: () => void;
}) {
  const isActive = stake.status === "active";
  const isUnstaking = stake.status === "unstaking";
  const days = daysUntil(stake.unbondedAt);
  const canUnstake = isActive && days === 0;

  const statusLabel: Record<string, string> = {
    active: "Active",
    unstaking: days > 0 ? `Unstaking · ${days}d to release` : "Unstaking",
    withdrawn: "Withdrawn",
  };

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-lg font-light">
            {formatDot(Number(stake.amount))} DOT
          </p>
          <p className="text-xs text-muted-foreground">
            {statusLabel[stake.status]} · started {formatDate(stake.createdAt)}
            {isActive && days > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Lock className="size-3" /> {days}d until unlock
              </span>
            ) : null}
          </p>
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
        </div>
      </div>
      {isUnstaking ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Funds return to your available balance on {formatDate(stake.unbondedAt)}.
        </p>
      ) : null}
    </li>
  );
}
