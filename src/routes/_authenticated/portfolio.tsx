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
 *   - Performance + distribution + returns
 *
 * Empty state:
 *   - "You haven't invested yet" → CTAs to Discover and Deposit
 */
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  TrendingUp,
  Coins,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  Wallet,
  LineChart as LineIcon,
  ExternalLink,
  Gift,
  Briefcase as BriefcaseIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { getMyInvestments } from "@/api/investments";
import { useMyDividends } from "@/hooks/use-dividends";
import { formatDot, formatNaira } from "@/lib/constants";
import { EcosystemEmptyState } from "@/components/app/EcosystemEmptyState";

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
  const dividendsQ = useMyDividends();

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

      <PageIntent
        icon={<BriefcaseIcon className="size-5" />}
        intent="Where have you put your capital, and how is it doing?"
        context="Every venture you've backed, your average price, your last dividend, and what to back next."
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
          {/* Top stats */}
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

          {/* Per-venture breakdown */}
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

          {/* Recent activity */}
          <SectionDivider
            className="mt-8"
            label="Recent activity"
            icon={<Sparkles className="size-3 text-purple" />}
          >
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
          </SectionDivider>

          {/* Performance */}
          <SectionDivider
            className="mt-8"
            label="Performance"
            icon={<LineIcon className="size-3 text-teal" />}
          >
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "6m", label: "6M" },
                { key: "12m", label: "12M" },
                { key: "24m", label: "24M" },
              ].map((range) => (
                <Button
                  key={range.key}
                  variant={range.key === "12m" ? "hero" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <PerformanceChart investments={investments} />
            </div>
          </SectionDivider>

          {/* Distribution */}
          <SectionDivider
            className="mt-8"
            label="Distribution"
            icon={<BriefcaseIcon className="size-3 text-primary" />}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <DistributionBlock title="By venture" items={buildVentureBars(portfolio)} />
              <DistributionBlock title="By recency" items={buildRecencyBars(investments)} />
              <DistributionBlock title="By ticket size" items={buildTicketBars(investments)} />
            </div>
          </SectionDivider>

          {/* Returns */}
          <SectionDivider
            className="mt-8"
            label="Returns"
            icon={<TrendingUp className="size-3 text-gold" />}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {portfolio.map((p, i) => (
                <div
                  key={p.founderId}
                  className={
                    "flex items-center justify-between gap-3 px-4 py-3 " +
                    (i !== portfolio.length - 1 ? "border-b border-border/60 " : "")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.founderName ?? "Anonymous founder"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.totalShares.toLocaleString()} shares · {p.purchases} purchase{p.purchases === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-semibold tabular-nums text-emerald-600">
                      +0.0%
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDot(p.totalSpentDot)} DOT</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionDivider>

          {/* Dividends */}
          {dividendsQ.data && dividendsQ.data.payments.length > 0 && (
            <SectionDivider
              className="mt-8"
              label="Dividend income"
              icon={<Gift className="size-3 text-emerald-500" />}
            >
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                    Total earned
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                    ₦{Math.round(dividendsQ.data.totalEarnedNaira / 100).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                    Pending
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-amber-600">
                    ₦{Math.round(dividendsQ.data.totalPendingNaira / 100).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {dividendsQ.data.payments.slice(0, 20).map((payment, i) => (
                  <div
                    key={payment.id}
                    className={
                      "flex items-center justify-between gap-3 px-4 py-3 " +
                      (i !== dividendsQ.data!.payments.length - 1 && i !== 19 ? "border-b border-border/60 " : "")
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {payment.ventureName || "Dividend payment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.period} · {payment.sharesOwned} shares ·{" "}
                        <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                          {payment.status}
                        </Badge>
                      </p>
                    </div>
                    <span
                      className={`font-display text-sm font-semibold tabular-nums ${
                        payment.status === "paid" ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      ₦{Math.round(payment.amountNaira / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </SectionDivider>
          )}
        </>
      )}
    </AppShell>
  );
}

function SectionDivider({
  className,
  label,
  icon,
  children,
}: {
  className?: string;
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}

function PerformanceChart({ investments }: { investments: any[] }) {
  const points = investments
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((inv, idx) => ({ idx, dot: Number(inv.totalPaidDot ?? 0) }));

  const cumulative = points.reduce<{ x: number; y: number }[]>((acc, pt) => {
    const last = acc.length ? acc[acc.length - 1].y : 0;
    acc.push({ x: pt.idx + 1, y: last + pt.dot });
    return acc;
  }, []);

  if (!cumulative.length) {
    return <p className="text-sm text-muted-foreground">Not enough data to chart yet.</p>;
  }

  const width = 800;
  const height = 220;
  const padding = 24;
  const maxY = Math.max(...cumulative.map((d) => d.y), 1);
  const maxX = cumulative.length;

  const toX = (x: number) => padding + ((x - 1) / Math.max(maxX - 1, 1)) * (width - padding * 2);
  const toY = (y: number) => height - padding - (y / maxY) * (height - padding * 2);

  const line = cumulative
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(d.x).toFixed(2)} ${toY(d.y).toFixed(2)}`)
    .join(" ");

  const area = `${line} L ${toX(cumulative[cumulative.length - 1].x).toFixed(2)} ${toY(0).toFixed(2)} L ${toX(1).toFixed(2)} ${toY(0).toFixed(2)} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full text-teal">
        <path d={area} fill="currentColor" opacity="0.15" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        {cumulative.map((d, i) => (
          <circle key={i} cx={toX(d.x)} cy={toY(d.y)} r="3" fill="currentColor" />
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{cumulative.length} purchase{cumulative.length === 1 ? "" : "s"}</span>
        <span className="tabular-nums">Peak {formatDot(maxY)} DOT</span>
      </div>
    </div>
  );
}

function DistributionBlock({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; max: number }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{item.label}</span>
                <span className="tabular-nums">{formatDot(item.value)} DOT</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildVentureBars(portfolio: { founderName: string | null; totalSpentDot: number }[]) {
  const max = portfolio.reduce((s, p) => Math.max(s, p.totalSpentDot), 0) || 1;
  return portfolio.map((p) => ({
    label: p.founderName ?? "Anonymous",
    value: p.totalSpentDot,
    max,
  }));
}

function buildRecencyBars(investments: { createdAt: string; totalPaidDot: string | number }[]) {
  const buckets: Record<string, number> = { "0-30d": 0, "31-90d": 0, "91-180d": 0, "180d+": 0 };
  for (const inv of investments) {
    const age = Date.now() - new Date(inv.createdAt).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    if (days <= 30) buckets["0-30d"] += Number(inv.totalPaidDot);
    else if (days <= 90) buckets["31-90d"] += Number(inv.totalPaidDot);
    else if (days <= 180) buckets["91-180d"] += Number(inv.totalPaidDot);
    else buckets["180d+"] += Number(inv.totalPaidDot);
  }
  const max = Math.max(...Object.values(buckets), 1);
  return Object.entries(buckets).map(([label, value]) => ({ label, value, max }));
}

function buildTicketBars(investments: { totalPaidDot: number }[]) {
  const buckets: Record<string, number> = { "0-10": 0, "10-50": 0, "50-200": 0, "200+": 0 };
  for (const inv of investments) {
    const dot = Number(inv.totalPaidDot ?? 0);
    if (dot < 10) buckets["0-10"] += dot;
    else if (dot < 50) buckets["10-50"] += dot;
    else if (dot < 200) buckets["50-200"] += dot;
    else buckets["200+"] += dot;
  }
  const max = Math.max(...Object.values(buckets), 1);
  return Object.entries(buckets).map(([label, value]) => ({ label: `${label} DOT`, value, max }));
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: any;
  tone: "primary" | "teal" | "gold";
  label: string;
  value: string;
  sub?: string;
}) {
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
