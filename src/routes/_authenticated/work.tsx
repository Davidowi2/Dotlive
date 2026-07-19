/**
 * DOT Work — Consolidated freelance / marketplace hub.
 *
 * Replaces the old per-route split:
 *   - /marketplace  → collapsed into /work#services
 *   - /builder      → collapsed into /work#services
 *
 * Tabs:
 *   1. Overview   — role-aware summary cards
 *   2. Services   — builders see "My Services", founders/investors see "Browse Services"
 *   3. Proposals  — builders see "My Proposals", founders/investors see "Proposals Received"
 *   4. Contracts  — active and past contracts (role-aware)
 *   5. Earnings   — builders see monthly breakdown, founders/investors see payments
 */

import { useState, useMemo } from "react";
import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Coins,
  Star,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  FileText,
  Send,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { EmptyState } from "@/components/app/EmptyState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useWallet } from "@/hooks/use-dot-data";
import {
  listServices,
  createService,
  updateService,
  deleteService,
  listMyServices,
  listJobs,
  createJob,
  listOrders,
  reviewOrder,
} from "@/api/work";
import { submitReview } from "@/api/reviews";
import { ReviewModal } from "@/components/work/ReviewModal";
import {
  formatDot,
  dotToNaira,
  formatNaira,
} from "@/lib/constants";
import { ORDER_STATUS_META } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/work")({
  head: () => ({
    meta: [{ title: "DOT Work — Freelance Dashboard" }],
  }),
  component: WorkPage,
});

function useTabFromSearch() {
  const search = useSearch({ from: "/_authenticated/work" }) as { tab?: string };
  const raw = search.tab;
  if (raw === "services" || raw === "proposals" || raw === "contracts" || raw === "earnings") {
    return raw;
  }
  return "overview";
}

function WorkPage() {
  const [showPostJob, setShowPostJob] = useState(false);
  const [showServiceWizard, setShowServiceWizard] = useState(false);
  const { user } = useDotAuth();
  const { data: walletBalance = 0 } = useWallet();
  const qc = useQueryClient();

  const isBuilder = user?.roles?.includes("builder");
  const isFounder = user?.roles?.includes("founder");
  const isInvestor = user?.roles?.includes("investor") || user?.roles?.includes("capital_partner");
  const isClient = isFounder || isInvestor;

  const tabFromSearch = useTabFromSearch();
  const [tab, setTab] = useState(tabFromSearch);
  const [activeTab, setActiveTab] = useState(tabFromSearch);

  // Sync local tab with URL changes
  if (tabFromSearch !== activeTab) {
    setActiveTab(tabFromSearch);
  }

  function handleTabChange(value: string) {
    setActiveTab(value);
    setTab(value);
    // Update URL via navigate
    void import("@tanstack/react-router").then(({ useNavigate }) => {
      // Fallback: use window.history for now; router integration keeps simple
      const url = new URL(window.location.href);
      url.searchParams.set("tab", value);
      window.history.replaceState({}, "", url.toString());
    });
  }

  return (
    <AppShell>
      <PageHeader
        title="DOT Work"
        subtitle="Freelance dashboard — services, proposals, contracts, earnings."
        action={
          isBuilder ? (
            <Button onClick={() => setShowServiceWizard(true)} size="sm">
              <Plus className="size-4" />
              New Service
            </Button>
          ) : isClient ? (
            <Button onClick={() => setShowPostJob(true)} size="sm">
              <Plus className="size-4" />
              Post a Gig
            </Button>
          ) : undefined
        }
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab handleTabChange={handleTabChange} setShowPostJob={setShowPostJob} /></TabsContent>
        <TabsContent value="services">
          {isBuilder ? <MyServicesTab /> : <BrowseServicesTab />}
        </TabsContent>
        <TabsContent value="proposals">
          {isBuilder ? <MyProposalsTab /> : <ProposalsReceivedTab />}
        </TabsContent>
        <TabsContent value="contracts"><ContractsTab /></TabsContent>
        <TabsContent value="earnings"><EarningsTab /></TabsContent>
      </Tabs>

      {/* Job posting wizard — for founders/investors */}
      <PostJobModal
        open={showPostJob}
        onClose={() => setShowPostJob(false)}
        walletBalance={walletBalance}
      />

      {/* Service creation wizard — for builders */}
      <ServiceWizard
        open={showServiceWizard}
        onClose={() => setShowServiceWizard(false)}
        onPublished={() => {
          qc.invalidateQueries({ queryKey: ["services"] });
          qc.invalidateQueries({ queryKey: ["services", "mine"] });
        }}
      />
    </AppShell>
  );
}

/* ═══════════════════ OVERVIEW TAB ═══════════════════ */

function OverviewTab({ handleTabChange, setShowPostJob }: { handleTabChange?: (value: string) => void; setShowPostJob?: (open: boolean) => void }) {
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

  const isBuilder = user?.roles?.includes("builder");
  const isClient = user?.roles?.includes("founder") || user?.roles?.includes("investor") || user?.roles?.includes("capital_partner");

  const activeContracts = orders.filter((o) =>
    o.status === "in_progress" || o.status === "delivered",
  ).length;
  const completedContracts = orders.filter((o) => o.status === "completed").length;
  const earnedDot = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (Number(o.amountDot) || 0), 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Wallet"
          value={`${formatDot(walletBalance)} DOT`}
          sub={`≈ ${formatNaira(dotToNaira(walletBalance))}`}
        />
        {isBuilder && (
          <>
            <StatCard
              icon={Briefcase}
              label="Active contracts"
              value={String(activeContracts)}
              sub={activeContracts === 0 ? "No contracts yet" : "In progress / delivered"}
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={String(completedContracts)}
              sub="Successfully delivered"
            />
            <StatCard
              icon={TrendingUp}
              label="DOT earned"
              value={`${formatDot(earnedDot)} DOT`}
              sub={`${completedContracts} contracts completed`}
            />
          </>
        )}
        {isClient && (
          <>
            <StatCard
              icon={ClipboardList}
              label="Open proposals"
              value={String(jobs.length)}
              sub={jobs.length === 0 ? "Post gigs to receive proposals" : "Visible in Proposals tab"}
            />
            <StatCard
              icon={Briefcase}
              label="My contracts"
              value={String(activeContracts)}
              sub={activeContracts === 0 ? "Hire builders to get started" : "In progress / delivered"}
            />
            <StatCard
              icon={DollarSign}
              label="Total spent"
              value={`${formatDot(earnedDot)} DOT`}
              sub={`≈ ${formatNaira(dotToNaira(earnedDot))}`}
            />
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-light tracking-tight">Where to next</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isBuilder
            ? "Manage your services, track proposals, and review contracts."
            : "Post gigs, hire builders, and manage contracts."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {isBuilder ? (
            <>
              <Button variant="outline" onClick={() => handleTabChange("services")}>
                <Hammer className="mr-2 size-4" /> My services
              </Button>
              <Button variant="outline" onClick={() => handleTabChange("proposals")}>
                <ClipboardList className="mr-2 size-4" /> Proposals
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleTabChange("services")}>
                <Search className="mr-2 size-4" /> Browse services
              </Button>
              <Button variant="outline" onClick={() => setShowPostJob(true)}>
                <Plus className="mr-2 size-4" /> Post a gig
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ SERVICES TAB ═══════════════════ */

function MyServicesTab() {
  const { user } = useDotAuth();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", "mine"],
    queryFn: () => listMyServices(),
    enabled: !!user,
  });
  const qc = useQueryClient();

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    await deleteService(id);
    toast.success("Service removed");
    qc.invalidateQueries({ queryKey: ["services"] });
    qc.invalidateQueries({ queryKey: ["services", "mine"] });
  }

  if (isLoading) {
    return (
      <div className="mt-6">
        <PageSkeleton.CardGrid count={6} cols={3} />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState
          icon={<Hammer className="size-7" />}
          title="No services yet"
          description="Create your first service and start receiving orders."
          action={
            <Button onClick={() => /* wizard is controlled by parent; star the WorkPage instance */ null}>
              <Plus className="mr-2 size-4" /> Create service
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <Card key={s.id}>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-start gap-2">
              <h3 className="flex-1 font-display text-lg font-light tracking-tight">
                {s.title}
              </h3>
              {s.category && (
                <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
              )}
            </div>
            {s.description && (
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {s.description}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 font-semibold tabular">
                <Coins className="size-4 text-primary" />
                {formatDot(s.priceDot)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" /> {s.deliveryDays ?? 3}d
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className={cn("text-xs font-medium", s.isActive ? "text-emerald-500" : "text-muted-foreground")}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => /* future: edit wizard */ null}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                  <XCircle className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BrowseServicesTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => listServices({ category: category || undefined, search: search || undefined }),
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => { if (s.category) set.add(s.category); });
    return Array.from(set).sort();
  }, [services]);

  const filtered = useMemo(() => {
    let items = services.filter((s) => {
      if (!s.isActive) return false;
      const needle = search.trim().toLowerCase();
      if (needle && !s.title.toLowerCase().includes(needle) && !(s.description ?? "").toLowerCase().includes(needle)) {
        return false;
      }
      if (category && s.category !== category) return false;
      if (minPrice && Number(s.priceDot) < Number(minPrice)) return false;
      if (maxPrice && Number(s.priceDot) > Number(maxPrice)) return false;
      return true;
    });

    items = [...items];
    if (sort === "newest") items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === "lowest_price") items.sort((a, b) => Number(a.priceDot) - Number(b.priceDot));
    else if (sort === "highest_rated") items.sort((a, b) => (b.builderRating ?? 0) - (a.builderRating ?? 0));
    else if (sort === "fastest_delivery") items.sort((a, b) => (a.deliveryDays ?? 999) - (b.deliveryDays ?? 999));
    return items;
  }, [services, search, category, sort, minPrice, maxPrice]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="lowest_price">Lowest price</SelectItem>
            <SelectItem value="highest_rated">Highest rated</SelectItem>
            <SelectItem value="fastest_delivery">Fastest delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <PageSkeleton.CardGrid count={6} cols={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<Hammer className="size-7" />}
          title="No services found"
          description="Try clearing your filters or check back later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start gap-2">
                  <h3 className="flex-1 font-display text-lg font-light tracking-tight">{s.title}</h3>
                  {s.category && (
                    <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                  )}
                </div>
                {s.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{s.description}</p>
                )}
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 font-semibold tabular">
                    <Coins className="size-4 text-primary" />
                    {formatDot(s.priceDot)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {s.deliveryDays ?? 3}d
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-current text-amber-500" /> {s.builderRating?.toFixed(1) ?? "New"}
                  </div>
                  <Button size="sm" onClick={() => toast.success("Hire flow coming soon")}>
                    Hire this Builder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ PROPOSALS TAB ═══════════════════ */

function MyProposalsTab() {
  const [search, setSearch] = useState("");
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", "my_proposals"],
    queryFn: () => listJobs(),
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
          icon={<ClipboardList className="size-7" />}
          title="No proposals yet"
          description="Browse open gigs and apply. Your proposals will track here."
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
              <p className="font-medium tabular text-primary">{formatDot(j.salaryDot)}</p>
              <p className="text-xs text-muted-foreground">budget</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProposalsReceivedTab() {
  return (
    <div className="mt-6">
      <EmptyState
        icon={<ClipboardList className="size-7" />}
        title="Proposals received"
        description="When builders submit proposals for your gigs, they display here."
      />
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
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);

  async function handleReviewSubmit(orderId: string, data: { rating: number; comment: string }) {
    await submitReview(orderId, data);
    setReviewOrderId(null);
  }

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
          description="When you hire on a DOT gig, the contract appears here with deliverables."
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
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta?.tone ?? "bg-muted text-muted-foreground"}`}
              >
                {meta?.label ?? o.status}
              </span>
              {o.status === "completed" && (
                <Button size="sm" onClick={() => setReviewOrderId(o.id)}>Review</Button>
              )}
            </div>
          </div>
        );
      })}

      <ReviewModal
        open={reviewOrderId !== null}
        onClose={() => setReviewOrderId(null)}
        onSubmit={(data) => handleReviewSubmit(reviewOrderId!, data)}
      />
    </div>
  );
}

/* ═══════════════════ EARNINGS TAB ═══════════════════ */

function EarningsTab() {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "earnings"],
    queryFn: () => listOrders(),
  });

  const isBuilder = true; // replace with role check if needed
  const completed = orders.filter((o) => o.status === "completed");
  const totalDot = completed.reduce((sum, o) => sum + (Number(o.amountDot) || 0), 0);
  const totalNaira = dotToNaira(totalDot);

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
          label="Total DOT"
          value={`${formatDot(totalDot)} DOT`}
          sub={`≈ ${formatNaira(totalNaira)}`}
        />
        <StatCard
          icon={Briefcase}
          label="Contracts completed"
          value={String(completed.length)}
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
              No earnings yet — complete contracts to see your monthly breakdown.
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

/* ═══════════════════ STAT CARD ═══════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-3 font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ═══════════════════ POST GIG MODAL ═══════════════════ */

function PostJobModal({ open, onClose, walletBalance = 0 }: { open: boolean; onClose: () => void; walletBalance?: number }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Development");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [budgetDot, setBudgetDot] = useState(5000);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  function reset() {
    setStep(1);
    setTitle("");
    setCategory("Development");
    setDescription("");
    setRequirements("");
    setBudgetDot(5000);
    setAgreedToTerms(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    setBusy(true);
    try {
      await createJob({
        title: title.trim(),
        description: description.trim(),
        category,
        salaryDot: Math.floor(budgetDot),
        employmentType: "full_time",
        requirements: requirements.trim() || undefined,
        isOpen: true,
      });
      toast.success("Gig posted");
      qc.invalidateQueries({ queryKey: ["job_listings"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      handleClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not post gig");
    } finally {
      setBusy(false);
    }
  }

  const escrowTotal = Math.floor(budgetDot * 0.2);
  const hasFunds = walletBalance >= escrowTotal;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Post a gig</DialogTitle>
        <DialogDescription className="sr-only">
          Post a new opportunity for builders to apply to.
        </DialogDescription>
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
                Founder → Post a gig
              </div>
              <h2 className="mt-1 text-lg font-semibold">
                {step === 1 ? "Basics" : step === 2 ? "Description" : "Review"}
              </h2>
            </div>
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={handleClose}>Save & exit</Button>
            )}
          </div>
        </div>
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="grid gap-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. UI redesign for SaaS" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Development", "Design", "Writing", "Marketing", "Video", "Other"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget (DOT)</Label>
                <Input type="number" value={budgetDot} onChange={(e) => setBudgetDot(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Escrow will hold 20%: {formatDot(escrowTotal)} DOT</p>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4">
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you need delivered?" />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Files, access, assets…" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Summary</p>
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> {title}</p>
                <p><span className="text-muted-foreground">Category:</span> {category}</p>
                <p><span className="text-muted-foreground">Budget:</span> {formatDot(budgetDot)} DOT</p>
                <p><span className="text-muted-foreground">Escrow:</span> {formatDot(escrowTotal)} DOT</p>
                <p><span className="text-muted-foreground">Delivery:</span> ASAP</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                I agree to the escrow terms
              </label>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {step > 1 && step < 3 ? (
            <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as typeof step)}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            {step < 3 ? (
              <Button onClick={() => setStep((s) => (s + 1) as typeof step)}>
                Next <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy || !agreedToTerms || !hasFunds}>
                {busy ? "Posting…" : "Publish gig"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════ SERVICE WIZARD ═══════════════════ */

type ServiceWizardStep = 1 | 2 | 3 | 4;

interface ServiceWizardProps {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

function ServiceWizard({ open, onClose, onPublished }: ServiceWizardProps) {
  const [step, setStep] = useState<ServiceWizardStep>(1);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Development");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [priceDot, setPriceDot] = useState(1000);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [revisionsIncluded, setRevisionsIncluded] = useState(2);
  const [requirements, setRequirements] = useState("");

  function reset() {
    setStep(1);
    setTitle("");
    setCategory("Development");
    setDescription("");
    setTags("");
    setPriceDot(1000);
    setDeliveryDays(7);
    setRevisionsIncluded(2);
    setRequirements("");
  }

  async function submit() {
    setBusy(true);
    try {
      await createService({
        title: title.trim(),
        description: description.trim(),
        category,
        priceDot,
        deliveryDays,
        requirements: requirements.trim() || undefined,
      });
      toast.success("Service published");
      onPublished?.();
      handleClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create service");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Create service</DialogTitle>
        <DialogDescription className="sr-only">
          4-step service creation wizard for builders.
        </DialogDescription>
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
            <Sparkles className="h-3 w-3" />
            Builder → Create service
          </div>
          <h2 className="mt-1 text-lg font-semibold">
            {step === 1 && "Basic info"}
            {step === 2 && "Pricing"}
            {step === 3 && "Requirements"}
            {step === 4 && "Publish"}
          </h2>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    s < step ? "bg-emerald-500 text-white" : s === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      s < step ? "bg-emerald-500" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="grid gap-4">
              <div>
                <Label>Service title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Next.js landing page build" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Development", "Design", "Writing", "Marketing", "Video", "Other"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you deliver?" />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, UI, SaaS" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4">
              <div>
                <Label>Price (DOT)</Label>
                <Input type="number" value={priceDot} onChange={(e) => setPriceDot(Number(e.target.value))} />
              </div>
              <div>
                <Label>Delivery time (days)</Label>
                <Input type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(Number(e.target.value))} />
              </div>
              <div>
                <Label>Revisions included</Label>
                <Input type="number" value={revisionsIncluded} onChange={(e) => setRevisionsIncluded(Number(e.target.value))} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <Label>Requirements</Label>
              <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="What does the client need to provide?" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Preview</p>
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> {title}</p>
                <p><span className="text-muted-foreground">Category:</span> {category}</p>
                <p><span className="text-muted-foreground">Price:</span> {formatDot(priceDot)} DOT</p>
                <p><span className="text-muted-foreground">Delivery:</span> {deliveryDays} days</p>
                <p><span className="text-muted-foreground">Revisions:</span> {revisionsIncluded}</p>
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tagList.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as ServiceWizardStep)}>
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            {step < 4 ? (
              <Button onClick={() => setStep((s) => (s + 1) as ServiceWizardStep)}>
                Next <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy}>
                {busy ? "Publishing…" : "Publish service"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
