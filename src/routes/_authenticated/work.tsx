/**
 * DOT Work — Personal freelance dashboard.
 *
 * Per direction: this is the USER's view of THEIR participation in the
 * freelance community. NOT a marketplace for browsing/posting gigs.
 *
 *   Overview      — active contracts, pending proposals, this-week earnings
 *   Proposals     — gigs I've applied for
 *   Contracts     — active service orders (in progress, delivered, completed)
 *   Earnings      — total DOT earned, by-period breakdown
 *
 * To HIRE or POST gigs, go to /discover → Open gigs.
 */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  ClipboardList,
  DollarSign,
  Trophy,
  Gauge,
  Search,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Hammer,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostJobWizard } from "@/components/marketplace/PostJobWizard";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useWallet } from "@/hooks/use-dot-data";
import { listJobs, listOrders } from "@/api/marketplace";
import {
  formatDot,
  dotToNaira,
  formatNaira,
} from "@/lib/constants";
import { ORDER_STATUS_META } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/work")({
  head: () => ({
    meta: [
      { title: "DOT Work — Your Freelance Dashboard" },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  const [showPostJob, setShowPostJob] = useState(false);
  const { user } = useDotAuth();
  const { data: walletBalance = 0 } = useWallet();
  const isFounder = user?.roles?.includes("founder");

  return (
    <AppShell>
      <PageHeader
        title="DOT Work"
        subtitle="Your freelance dashboard — gigs, proposals, earnings."
        action={
          isFounder ? (
            <Button onClick={() => setShowPostJob(true)} size="sm">
              <Plus className="size-4" />
              Post a Gig
            </Button>
          ) : undefined
        }
      />
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Proposals</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="applications"><ApplicationsTab /></TabsContent>
        <TabsContent value="contracts"><ContractsTab /></TabsContent>
        <TabsContent value="earnings"><EarningsTab /></TabsContent>
      </Tabs>

      {/* Post Job Wizard */}
      <PostJobWizard
        open={showPostJob}
        onClose={() => setShowPostJob(false)}
        walletBalance={walletBalance}
      />
    </AppShell>
  );
}

/* ═══════════════════ OVERVIEW TAB ═══════════════════ */
function OverviewTab() {
  const { user } = useDotAuth();
  const { data: walletBalance = 0 } = useWallet();
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "overview", user?.id],
    queryFn: () => listOrders(),
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", "overview"],
    queryFn: () => listJobs(),
  });

  const activeContracts = orders.filter((o) =>
    o.status === "in_progress" || o.status === "delivered",
  ).length;
  const pendingProposals = jobs.length; // approximation: gigs the user sees
  const earnedDot = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (Number(o.amountDot) || 0), 0);

  return (
    <div className="mt-6 space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="Wallet"
          value={`${formatDot(walletBalance)} DOT`}
          subValue={`≈ ${formatNaira(dotToNaira(walletBalance))}`}
        />
        <StatCard
          icon={Briefcase}
          label="Active contracts"
          value={activeContracts}
          sub={activeContracts === 0 ? "No contracts yet" : "In progress / delivered"}
        />
        <StatCard
          icon={ClipboardList}
          label="Open proposals"
          value={pendingProposals}
          sub={pendingProposals === 0 ? "Apply to a gig" : "Visible in Proposals tab"}
        />
        <StatCard
          icon={TrendingUp}
          label="DOT earned"
          value={`${formatDot(earnedDot)} DOT`}
          sub={`${orders.filter((o) => o.status === "completed").length} contracts completed`}
        />
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-light tracking-tight">Where to next</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          DOT Work is your dashboard for freelance participation. Open gigs live in Discover.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/discover" search={{ tab: "open-roles" }}>
              <Search className="mr-2 size-4" /> Find open gigs
              <ArrowUpRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/discover" search={{ tab: "builders" }}>
              <Hammer className="mr-2 size-4" /> Browse builders
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/wallet">
              <Wallet className="mr-2 size-4" /> My wallet
            </Link>
          </Button>
        </div>
      </div>

      {/* Latest activity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-light tracking-tight">Latest activity</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {orders.length === 0
              ? "You haven't started any contracts yet. Apply to an open gig to begin."
              : `${orders.length} order${orders.length === 1 ? "" : "s"} on file.`}
          </p>
          {orders.length > 0 && (
            <ul className="mt-4 divide-y divide-border">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{o.title}</span>
                  <span className="text-muted-foreground tabular">{formatDot(o.amountDot)} DOT</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════ PROPOSALS TAB ═══════════════════ */
function ApplicationsTab() {
  const [search, setSearch] = useState("");
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", "applications"],
    queryFn: () => listJobs({ search: search || undefined }),
  });

  const filtered = jobs.filter((j) =>
    search ? j.title.toLowerCase().includes(search.toLowerCase()) : true,
  );

  if (isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={ClipboardList}
          title="No proposals yet"
          description="Find an open gig on Discover and apply. Your proposals will track here."
          action={
            <Button asChild>
              <Link to="/discover" search={{ tab: "open-roles" }}>
                Browse open gigs
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <Input
        placeholder="Filter proposals…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul className="space-y-3">
        {filtered.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{j.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {j.category} · {j.employmentType ? j.employmentType.replace(/_/g, " ") : "Gig"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-medium tabular text-primary">{formatDot(j.salaryDot)} DOT</p>
              <p className="text-xs text-muted-foreground">budget</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════ CONTRACTS TAB ═══════════════════ */
function ContractsTab() {
  const { user } = useDotAuth();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "contracts", user?.id],
    queryFn: () => listOrders(),
  });

  if (isLoading) {
    return (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={Briefcase}
          title="No contracts yet"
          description="When you're hired on a DOT gig, the contract shows up here with deliverables."
          action={
            <Button asChild>
              <Link to="/discover" search={{ tab: "builders" }}>
                Find builders
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {orders.map((o) => {
        const meta = ORDER_STATUS_META[o.status];
        return (
          <div
            key={o.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{o.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDot(o.amountDot)} DOT ·{" "}
                {new Date(o.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta?.cls ?? "bg-muted text-muted-foreground"}`}
            >
              {meta?.label ?? o.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════ EARNINGS TAB ═══════════════════ */
function EarningsTab() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "earnings"],
    queryFn: () => listOrders(),
  });

  const completed = orders.filter((o) => o.status === "completed");
  const totalDot = completed.reduce((sum, o) => sum + (Number(o.amountDot) || 0), 0);
  const totalNaira = dotToNaira(totalDot);

  // Group by month
  const byMonth: Record<string, number> = {};
  for (const o of completed) {
    const m = new Date(o.createdAt).toLocaleString("en", {
      year: "numeric",
      month: "long",
    });
    byMonth[m] = (byMonth[m] ?? 0) + Number(o.amountDot);
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label="Total DOT earned"
          value={`${formatDot(totalDot)} DOT`}
          subValue={`≈ ${formatNaira(totalNaira)}`}
        />
        <StatCard
          icon={Briefcase}
          label="Contracts completed"
          value={completed.length}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg per contract"
          value={
            completed.length > 0
              ? `${formatDot(Math.round(totalDot / completed.length))} DOT`
              : "—"
          }
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-light tracking-tight">By month</h3>
          {Object.keys(byMonth).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No earnings yet — your earnings by month will appear here as you complete contracts.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {Object.entries(byMonth).map(([month, dot]) => (
                <li key={month} className="flex items-center justify-between py-3">
                  <span className="text-sm">{month}</span>
                  <span className="font-medium tabular text-primary">
                    {formatDot(dot)} DOT
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
