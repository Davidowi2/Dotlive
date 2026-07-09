import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Building2, Sparkles, Wallet, ShieldCheck, Clock, AlertTriangle, ArrowRight } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getTierPricing,
  getMyTier,
  getTierHistory,
  upgradeTier,
  renewTier,
  type PurchasableTier,
  type TierInfo,
  type MyTierResponse,
  type TierUpgrade,
} from "@/api/tiers";

export const Route = createFileRoute("/_authenticated/tier")({
  head: () => ({ meta: [{ title: "Tier — DOT" }] }),
  component: TierPage,
});

/* ────────────────────────── Helpers ────────────────────────── */

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDot(n: number): string {
  // 1 DOT = ₦15. Money displayed in Naira directly, no kobo.
  return `₦${(n * 15).toLocaleString()}`;
}

function tierBadgeClasses(tier: string): string {
  switch (tier) {
    case "founder":
      return "bg-primary/10 text-primary ring-primary/20";
    case "capital_partner":
      return "bg-gold/10 text-gold ring-gold/20";
    default:
      return "bg-muted/40 text-muted-foreground ring-border";
  }
}

function tierIcon(tier: PurchasableTier) {
  return tier === "founder" ? Building2 : Crown;
}

/* ────────────────────────── Tier Card ────────────────────────── */

function TierCard({
  info,
  myTier,
  isPurchasing,
  onUpgrade,
  onRenew,
  busy,
}: {
  info: TierInfo;
  myTier: MyTierResponse | undefined;
  isPurchasing: boolean;
  onUpgrade: (tier: PurchasableTier) => void;
  onRenew: (tier: PurchasableTier) => void;
  busy: boolean;
}) {
  const Icon = tierIcon(info.key);
  const ownsThis = myTier?.tier === info.key;
  const ownsOther = !!myTier && myTier.tier !== info.key && myTier.tier !== "builder";
  const canRenewThis = ownsThis && myTier?.canRenew;

  let buttonLabel = `Upgrade — ${formatDot(info.dot)}`;
  let onClick: () => void = () => onUpgrade(info.key);
  let disabled = busy || isPurchasing;
  let variant: "hero" | "outline" = "hero";

  if (ownsThis) {
    if (canRenewThis) {
      buttonLabel = `Renew — ${formatDot(info.dot)}`;
      onClick = () => onRenew(info.key);
      variant = "outline";
    } else {
      buttonLabel = "Active";
      onClick = () => {};
      disabled = true;
      variant = "outline";
    }
  } else if (ownsOther) {
    buttonLabel = "Owned (other tier)";
    disabled = true;
    variant = "outline";
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-soft",
        ownsThis ? "border-primary/40" : "border-border",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl ring-1 ring-inset",
              info.key === "founder" ? "bg-primary/10 text-primary ring-primary/20" : "bg-gold/10 text-gold ring-gold/20",
            )}
          >
            <Icon className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-xl font-light tracking-tight">{info.label}</h3>
            <p className="text-xs text-muted-foreground">
              {info.durationDays}-day access
            </p>
          </div>
        </div>
        {ownsThis && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
            <ShieldCheck className="size-3" /> Active
          </span>
        )}
      </header>

      <p className="text-sm text-muted-foreground font-light">{info.description}</p>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-light tracking-tight">
          {info.dot.toLocaleString()} DOT
        </span>
        <span className="text-xs text-muted-foreground">≈ {formatDot(info.dot)}</span>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-foreground/90 font-light">
        {info.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-3.5 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <Button
          variant={variant}
          onClick={onClick}
          disabled={disabled}
          className="w-full"
        >
          {busy && isPurchasing ? "Processing…" : buttonLabel}
          {!disabled && <ArrowRight className="size-4" />}
        </Button>
        {ownsThis && myTier?.expiresAt && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            <Clock className="mr-1 inline size-3" />
            Renews / expires {formatDate(myTier.expiresAt)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── History Row ────────────────────────── */

function HistoryRow({ u }: { u: TierUpgrade }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-3 text-sm font-light">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs ring-1 ring-inset",
            tierBadgeClasses(u.tier),
          )}
        >
          {u.tier === "founder" ? "Founder" : "Capital Partner"}
        </span>
      </td>
      <td className="px-3 py-3 text-sm font-light">{u.costDot.toLocaleString()} DOT</td>
      <td className="px-3 py-3 text-sm font-light text-muted-foreground">
        {formatDate(u.purchasedAt)}
      </td>
      <td className="px-3 py-3 text-sm font-light text-muted-foreground">
        {formatDate(u.expiresAt)}
      </td>
      <td className="px-3 py-3 text-xs">
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            u.status === "active"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted/40 text-muted-foreground",
          )}
        >
          {u.status}
        </span>
      </td>
    </tr>
  );
}

/* ────────────────────────── Page ────────────────────────── */

function TierPage() {
  const qc = useQueryClient();
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const pricingQ = useQuery({
    queryKey: ["tier", "pricing"],
    queryFn: getTierPricing,
  });
  const myTierQ = useQuery({
    queryKey: ["tier", "me"],
    queryFn: getMyTier,
  });
  const historyQ = useQuery({
    queryKey: ["tier", "history"],
    queryFn: getTierHistory,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["tier"] });
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const upgradeM = useMutation({
    mutationFn: (tier: PurchasableTier) => upgradeTier(tier),
    onSuccess: () => {
      setPurchaseError(null);
      invalidateAll();
    },
    onError: (err: any) => {
      setPurchaseError(err?.message || "Upgrade failed");
    },
  });
  const renewM = useMutation({
    mutationFn: (tier: PurchasableTier) => {
      const active = historyQ.data?.upgrades.find(
        (u) => u.tier === tier && u.status === "active",
      );
      if (!active) throw new Error("No active upgrade to renew");
      return renewTier(active.id);
    },
    onSuccess: () => {
      setPurchaseError(null);
      invalidateAll();
    },
    onError: (err: any) => {
      setPurchaseError(err?.message || "Renew failed");
    },
  });

  const myTier = myTierQ.data;
  const tiers = useMemo(() => pricingQ.data?.tiers ?? [], [pricingQ.data]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Upgrade"
          title="DOT Tier"
          subtitle="Unlock Founder or Capital Partner tools by staking DOT for 365 days."
          icon={<Crown className="size-7 text-primary" />}
        />

        <PageIntent
          intent="Which DOT tier unlocks the tools you need?"
          context="Tiers cost DOT, run for 365 days, and stack from your current expiry on renewal."
          icon={<Wallet className="size-5" />}
        />

        {/* Current tier banner */}
        {myTier && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-wider ring-1 ring-inset",
                    tierBadgeClasses(myTier.tier),
                  )}
                >
                  {myTier.tier === "builder"
                    ? "Builder (default)"
                    : myTier.tier === "founder"
                    ? "Founder"
                    : myTier.tier === "capital_partner"
                    ? "Capital Partner"
                    : "Operator"}
                </span>
                {myTier.expiresAt ? (
                  <span className="text-xs text-muted-foreground">
                    {myTier.daysRemaining ?? 0} day{(myTier.daysRemaining ?? 0) === 1 ? "" : "s"} remaining
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No expiry — free tier</span>
                )}
              </div>
              {myTier.tier === "builder" && (
                <Link
                  to="/wallet"
                  className="text-xs text-primary hover:underline"
                >
                  Deposit DOT →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Purchase error */}
        {purchaseError && (
          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{purchaseError}</p>
          </div>
        )}

        {/* Tier cards */}
        {pricingQ.isLoading ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">Loading tiers…</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {tiers.map((t) => (
              <TierCard
                key={t.key}
                info={t}
                myTier={myTier}
                isPurchasing={upgradeM.isPending || renewM.isPending}
                onUpgrade={(tier) => upgradeM.mutate(tier)}
                onRenew={(tier) => renewM.mutate(tier)}
                busy={upgradeM.isPending || renewM.isPending}
              />
            ))}
          </div>
        )}

        {/* What you get — quick reference */}
        <section className="mt-10">
          <h2 className="font-display text-lg font-light tracking-tight">
            What you get
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/50 p-4 text-sm font-light text-muted-foreground">
              <strong className="block text-foreground">Founder</strong>
              Create ventures, submit pitches, get a Founder badge, message investors.
            </div>
            <div className="rounded-2xl border border-border bg-card/50 p-4 text-sm font-light text-muted-foreground">
              <strong className="block text-foreground">Capital Partner</strong>
              See the full deal flow, invest in ventures directly, get priority support.
            </div>
          </div>
        </section>

        {/* History */}
        <section className="mt-10">
          <h2 className="font-display text-lg font-light tracking-tight">
            Purchase history
          </h2>
          {historyQ.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading history…</p>
          ) : !historyQ.data || historyQ.data.upgrades.length === 0 ? (
            <EmptyState
              variant="card"
              icon={Wallet}
              title="No purchases yet"
              description="Buy a tier above to unlock Founder or Capital Partner tools."
              accent="primary"
            />
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card/50">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Tier</th>
                    <th className="px-3 py-2 font-medium">Cost</th>
                    <th className="px-3 py-2 font-medium">Purchased</th>
                    <th className="px-3 py-2 font-medium">Expires</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyQ.data.upgrades.map((u) => (
                    <HistoryRow key={u.id} u={u} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
