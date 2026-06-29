/**
 * /portfolio — Investor's portfolio dashboard.
 *
 * Tier 3 / Commitment 4 — Portfolio tracking.
 *
 * Shows:
 *   - Total DOT invested
 *   - Number of ventures invested in
 *   - Total shares owned
 *   - Per-venture breakdown (founder name, shares, spent, last purchase)
 *   - Recent purchase history
 *
 * Empty state:
 *   - "You haven't invested yet" → CTAs to Discover and Deposit
 */
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, TrendingUp, Coins, Users, ArrowRight, Plus,
  Sparkles, Wallet, LineChart as LineIcon, ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { getMyInvestments } from "@/api/investments";
import { formatDot, formatNaira } from "@/lib/constants";
import { EcosystemEmptyState } from "@/components/app/EcosystemEmptyState";
import { Briefcase as BriefcaseIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "My Portfolio — DOT" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { user } = useDotAuth();
  const q = useQuery({
    queryKey: ["my-investments"],
    queryFn: getMyInvestments,
    enabled: !!user,
  });

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="My portfolio" subtitle="Loading…" />
      </AppShell>
    );
  }

  if (q.isLoading) {
    return (
      <AppShell>
        <PageHeader title="My portfolio" subtitle="Loading your investments…" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  const investments = q.data?.investments ?? [];
  const portfolio = q.data?.portfolio ?? [];

  const totalInvestedDot = portfolio.reduce((s, p) => s + p.totalSpentDot, 0);
  const totalShares = portfolio.reduce((s, p) => s + p.totalShares, 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Investor OS"
        title="My portfolio"
        subtitle="Every venture you've backed. Real-time from the investments ledger."
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/discover">Browse ventures</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/wallet">
                <Wallet className="size-4" />
                Deposit DOT
              </Link>
            </Button>
          </div>
        }
      />

      {portfolio.length === 0 ? (
        <EcosystemEmptyState
          icon={BriefcaseIcon}
          title="No investments yet"
          subtitle="Your portfolio lives here once you back a founder. Every share you buy shows up in real-time."
          postedBy="Investors"
          requiredRole="investor"
          postHref="/discover"
          postLabel="Find ventures to back"
          secondaryAction={{ label: "Deposit NGN via Paystack", href: "/wallet" }}
        />
      ) : (
        <>
          {/* ── Top stats ─────────────────────────────── */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Coins}
              tone="gold"
              label="Total invested"
              value={`${formatDot(totalInvestedDot)} DOT`}
              sub={`≈ ${formatNaira(Math.round(totalInvestedDot * 15))}`}
            />
            <StatCard
              icon={Briefcase}
              tone="primary"
              label="Ventures backed"
              value={String(portfolio.length)}
              sub={portfolio.length === 1 ? "venture" : "ventures"}
            />
            <StatCard
              icon={TrendingUp}
              tone="teal"
              label="Shares owned"
              value={totalShares.toLocaleString()}
              sub="across all ventures"
            />
          </section>

          {/* ── Per-venture breakdown ─────────────────── */}
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
                <LineIcon className="size-3 text-teal" />
                Ventures you back
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              {portfolio.map((p) => (
                <article
                  key={p.founderId}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg font-semibold">
                        {p.founderName ?? "Anonymous founder"}
                      </h3>
                      {p.founderDotId && (
                        <code className="font-mono text-xs text-muted-foreground">
                          {p.founderDotId}
                        </code>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                        <Coins className="mr-1 size-3" /> {p.totalShares.toLocaleString()} shares
                      </Badge>
                      <Badge variant="outline">
                        {p.purchases} purchase{p.purchases === 1 ? "" : "s"}
                      </Badge>
                      <span className="text-muted-foreground">
                        last bought {new Date(p.lastPurchaseAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold tabular-nums">
                        {formatDot(p.totalSpentDot)} DOT
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ≈ {formatNaira(Math.round(p.totalSpentDot * 15))}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/founder/$id" params={{ id: p.founderDotId ?? p.founderId }}>
                        View venture
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ── Recent purchases ──────────────────────── */}
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
                <Sparkles className="size-3 text-purple" />
                Recent activity
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {investments.slice(0, 20).map((inv, i) => (
                <div
                  key={inv.id}
                  className={
                    "flex items-center justify-between gap-3 px-4 py-3 " +
                    (i !== investments.length - 1 && i !== 19 ? "border-b border-border/60 " : "") +
                    (i === 19 ? "" : "")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Bought {inv.shares} share{inv.shares === 1 ? "" : "s"} of {inv.founderName ?? "founder"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNaira(Math.round(inv.sharePriceKobo / 100))}/share ·{" "}
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-display text-sm font-semibold tabular-nums">
                    {formatDot(Number(inv.totalPaidDot))} DOT
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function StatCard({
  icon: Icon, tone, label, value, sub,
}: { icon: any; tone: "primary" | "teal" | "gold"; label: string; value: string; sub?: string }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal/10 text-teal",
    gold: "bg-gold/10 text-gold",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="size-4" />
        </div>
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}