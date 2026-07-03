/**
 * DOT Demo — Pitch discovery platform.
 *
 * Industrial-grade redesign:
 *   - Hero stat strip (total ventures, capital seeking, top vantage)
 *   - Filter bar: stage, industry, country, min vantage, min fundability
 *   - Two views: Card grid (default) and List view
 *   - Each venture card shows: vantage ring, fundability bar, traction metrics,
 *     funding ask, tags, save/meet actions (investors only)
 *   - Meeting request integrated directly on the card
 *   - Leaderboard tab showing ranked ventures by vantage
 *   - My Meetings tab for founders (requests received)
 */
import { dotApi } from "@/api/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Building2, Loader2, Gauge, MapPin, Bookmark, BookmarkCheck,
  Send, TrendingUp, Briefcase, Filter, LayoutGrid, List,
  Trophy, Star, ArrowUpRight, Coins, Users, Search, X,
  CheckCircle2, XCircle, Clock, MessageSquare, Sparkles,
  ChevronRight, Target, Rocket, BarChart3, CalendarDays,
  RefreshCw, Mail, AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { formatNaira, dotToNaira, formatDot } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/demo")({
  head: () => ({
    meta: [
      { title: "DOT Demo — Venture Showcase" },
      { name: "description", content: "Discover and invest in Africa's most fundable ventures." },
    ],
  }),
  component: DemoPage,
});

export interface FounderShowcase {
  user_id: string;
  venture_name: string | null;
  industry: string | null;
  stage: string | null;
  country: string | null;
  bio: string | null;
  funding_goal: number | null;
  vantage_point: number | null;
  fundability: number | null;
  mrr?: number | null;
  headcount?: number | null;
  founded_year?: number | null;
  total_raised?: number | null;
  website?: string | null;
  dot_id?: string | null;
  founder_name?: string | null;
  avatar_url?: string | null;
}

const STAGES = ["Assess", "Validate", "Build", "Fund", "Scale"];
const INDUSTRIES = ["Fintech", "Agriculture", "Commerce", "Health", "Energy", "Education", "Logistics", "Media", "Other"];

function DemoPage() {
  const { user, roles } = useDotAuth();
  const qc = useQueryClient();
  const isInvestor = roles.includes("investor");
  const isFounder = roles.includes("founder");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [industry, setIndustry] = useState("");
  const [minVantage, setMinVantage] = useState("");
  const [meetModal, setMeetModal] = useState<FounderShowcase | null>(null);

  const { data: ventures = [], isLoading } = useQuery({
    queryKey: ["showcase"],
    queryFn: async () => {
      const res = await dotApi.get<{ ventures: FounderShowcase[] }>("/api/founder-profiles");
      return res?.ventures ?? [];
    },
    staleTime: 60_000,
  });

  const { data: saves = [] } = useQuery({
    queryKey: ["investor-saves", user?.id],
    enabled: !!user && isInvestor,
    queryFn: async () => {
      const res = await dotApi.get<{ saves: { founderId: string }[] }>("/api/investor/saves");
      return res?.saves ?? [];
    },
  });
  const saved = new Set(saves.map((s) => s.founderId));

  const filtered = useMemo(() => {
    return ventures.filter((v) => {
      if (stage && v.stage !== stage) return false;
      if (industry && v.industry !== industry) return false;
      if (minVantage && (v.vantage_point ?? 0) < Number(minVantage)) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(v.venture_name ?? "").toLowerCase().includes(s) &&
            !(v.bio ?? "").toLowerCase().includes(s) &&
            !(v.country ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [ventures, stage, industry, minVantage, search]);

  const totalSeeking = ventures.reduce((s, v) => s + (v.funding_goal ?? 0), 0);
  const topVantage = ventures.length ? Math.max(...ventures.map((v) => v.vantage_point ?? 0)) : 0;
  const investorReady = ventures.filter((v) => (v.vantage_point ?? 0) >= 700).length;
  const hasActiveFilters = search || stage || industry || minVantage;

  async function toggleSave(founderId: string) {
    if (!user) return;
    try {
      if (saved.has(founderId)) {
        await dotApi.delete(`/api/investor/saves/${encodeURIComponent(founderId)}`);
      } else {
        await dotApi.post("/api/investor/saves", { founderId });
      }
      qc.invalidateQueries({ queryKey: ["investor-saves", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="DOT Demo"
        title="Venture Showcase"
        subtitle={
          isInvestor
            ? "Africa's most fundable ventures, ranked by Vantage. Save, research, and request meetings."
            : "Boost your Vantage to rank higher and get discovered by investors."
        }
        action={
          isFounder ? (
            <Button variant="hero" asChild>
              <Link to="/vantage">
                <Sparkles className="size-4" />
                Update my Vantage
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ── Hero stat strip ─────────────────────────────────────── */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DemoStat icon={Building2} label="Ventures listed" value={ventures.length.toString()} />
        <DemoStat icon={Rocket} label="Investor-ready" value={investorReady.toString()} sub="Vantage ≥ 700" accent="gold" />
        <DemoStat icon={Coins} label="Capital sought" value={`₦${Math.round(totalSeeking / 1e6)}M`} />
        <DemoStat icon={Trophy} label="Top Vantage" value={topVantage.toString()} sub="/ 1000" accent="primary" />
      </section>

      {/* ── Tabs: Browse / Leaderboard / Meetings ───────────────── */}
      <Tabs defaultValue="browse" className="mt-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="browse"><LayoutGrid className="size-3.5 mr-1.5" />Browse</TabsTrigger>
            <TabsTrigger value="leaderboard"><Trophy className="size-3.5 mr-1.5" />Leaderboard</TabsTrigger>
            {(isFounder || isInvestor) && (
              <TabsTrigger value="meetings"><CalendarDays className="size-3.5 mr-1.5" />Meetings</TabsTrigger>
            )}
          </TabsList>
          <div className="flex gap-1.5">
            <button onClick={() => setView("grid")} className={cn("rounded-lg border p-2 transition-colors", view === "grid" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
              <LayoutGrid className="size-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("rounded-lg border p-2 transition-colors", view === "list" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}>
              <List className="size-4" />
            </button>
          </div>
        </div>

        {/* ── BROWSE TAB ── */}
        <TabsContent value="browse" className="mt-5">
          {/* Filters */}
          <div className="mb-5 flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ventures…" className="pl-9" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="size-4 text-muted-foreground" /></button>}
            </div>
            <Select value={stage} onValueChange={(v) => setStage(v === "__all" ? "" : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Any stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Any stage</SelectItem>
                {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={industry} onValueChange={(v) => setIndustry(v === "__all" ? "" : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Any industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Any industry</SelectItem>
                {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Min Vantage:</span>
              <Input type="number" value={minVantage} onChange={(e) => setMinVantage(e.target.value)} placeholder="0" className="h-9 w-20 text-xs" />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStage(""); setIndustry(""); setMinVantage(""); }}>
                <X className="size-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            <strong>{filtered.length}</strong> venture{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " matching filters" : " listed"}
          </p>

          {isLoading ? (
            <div className={cn("gap-4", view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "space-y-3")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No ventures match"
              description={hasActiveFilters ? "Clear filters to see all ventures." : "Founders with completed Vantage assessments appear here."}
            />
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <VentureCard
                  key={v.user_id}
                  v={v}
                  isInvestor={isInvestor}
                  isSaved={saved.has(v.user_id)}
                  isSelf={v.user_id === user?.id}
                  onSave={() => toggleSave(v.user_id)}
                  onMeet={() => setMeetModal(v)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((v) => (
                <VentureRow
                  key={v.user_id}
                  v={v}
                  isInvestor={isInvestor}
                  isSaved={saved.has(v.user_id)}
                  isSelf={v.user_id === user?.id}
                  onSave={() => toggleSave(v.user_id)}
                  onMeet={() => setMeetModal(v)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── LEADERBOARD TAB ── */}
        <TabsContent value="leaderboard" className="mt-5">
          <LeaderboardView ventures={ventures} />
        </TabsContent>

        {/* ── MEETINGS TAB ── */}
        {(isFounder || isInvestor) && (
          <TabsContent value="meetings" className="mt-5">
            <MeetingsView isFounder={isFounder} isInvestor={isInvestor} />
          </TabsContent>
        )}
      </Tabs>

      {/* ── Meeting request modal ── */}
      {meetModal && (
        <MeetingModal
          venture={meetModal}
          onClose={() => setMeetModal(null)}
        />
      )}
    </AppShell>
  );
}

/* ── Stat tile ──────────────────────────────────────────────────── */
function DemoStat({ icon: Icon, label, value, sub, accent = "default" }: {
  icon: any; label: string; value: string; sub?: string; accent?: "gold" | "primary" | "default";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={cn("flex size-8 items-center justify-center rounded-lg mb-2",
        accent === "gold" ? "bg-gold/10 text-gold" :
        accent === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="size-4" />
      </div>
      <p className="font-display text-2xl font-light tabular">{value}</p>
      <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── Venture card (grid view) ────────────────────────────────────── */
function VentureCard({ v, isInvestor, isSaved, isSelf, onSave, onMeet }: {
  v: FounderShowcase; isInvestor: boolean; isSaved: boolean;
  isSelf: boolean; onSave: () => void; onMeet: () => void;
}) {
  const vantage = v.vantage_point ?? 0;
  const fundability = v.fundability ?? 0;
  const tier = vantage >= 700 ? "investor-ready" : vantage >= 550 ? "pitch-ready" : vantage >= 400 ? "building" : "early";
  const tierColor = { "investor-ready": "text-gold border-gold/30 bg-gold/5", "pitch-ready": "text-primary border-primary/30 bg-primary/5", "building": "text-blue-500 border-blue-500/30 bg-blue-500/5", "early": "text-muted-foreground border-border bg-muted/30" }[tier];

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
            {(v.venture_name ?? "V").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold truncate">{v.venture_name ?? "Unnamed venture"}</h3>
            {v.founder_name && <p className="text-xs text-muted-foreground truncate">by {v.founder_name}</p>}
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tierColor)}>
          {tier.replace("-", " ")}
        </span>
      </div>

      {/* Vantage + Fundability */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1"><Gauge className="size-3" /> Vantage</span>
          <span className="font-semibold tabular">{vantage} <span className="font-normal text-muted-foreground">/ 1000</span></span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (vantage / 1000) * 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3" /> Fundability</span>
          <span className="font-semibold tabular text-primary">{fundability}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${fundability}%` }} />
        </div>
      </div>

      {/* Tags */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {v.industry && <Badge variant="outline" className="text-[10px]"><Briefcase className="mr-1 size-2.5" />{v.industry}</Badge>}
        {v.stage && <Badge variant="secondary" className="text-[10px]">{v.stage}</Badge>}
        {v.country && <Badge variant="outline" className="text-[10px]"><MapPin className="mr-1 size-2.5" />{v.country}</Badge>}
      </div>

      {/* Bio */}
      {v.bio && <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2">{v.bio}</p>}

      {/* Funding ask */}
      {v.funding_goal ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
          <Coins className="size-3.5 text-emerald-500 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            Raising {formatNaira(Number(v.funding_goal))}
          </span>
        </div>
      ) : null}

      {/* Actions */}
      {isInvestor && !isSelf ? (
        <div className="mt-auto flex gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSave}>
            {isSaved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="hero" size="sm" className="flex-1" onClick={onMeet}>
            <Send className="size-4" /> Request meeting
          </Button>
        </div>
      ) : isSelf ? (
        <div className="mt-auto pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/vantage"><Sparkles className="size-4" /> Update Vantage</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-auto pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={`/founder/${v.dot_id ?? v.user_id}`}><ArrowUpRight className="size-4" /> View profile</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Venture row (list view) ─────────────────────────────────────── */
function VentureRow({ v, isInvestor, isSaved, isSelf, onSave, onMeet }: {
  v: FounderShowcase; isInvestor: boolean; isSaved: boolean;
  isSelf: boolean; onSave: () => void; onMeet: () => void;
}) {
  const vantage = v.vantage_point ?? 0;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-primary">
        {(v.venture_name ?? "V").charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{v.venture_name}</p>
          {v.stage && <Badge variant="secondary" className="text-[10px]">{v.stage}</Badge>}
          {v.industry && <Badge variant="outline" className="text-[10px]">{v.industry}</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {v.country && <span className="flex items-center gap-1"><MapPin className="size-3" />{v.country}</span>}
          {v.funding_goal ? <span className="text-emerald-600 font-medium">Raising {formatNaira(Number(v.funding_goal))}</span> : null}
        </div>
      </div>
      <div className="shrink-0 text-right hidden sm:block">
        <p className="text-sm font-semibold tabular text-primary">{vantage}</p>
        <p className="text-[10px] text-muted-foreground">Vantage</p>
      </div>
      <div className="shrink-0 text-right hidden md:block">
        <p className="text-sm font-semibold tabular text-emerald-600">{v.fundability ?? 0}%</p>
        <p className="text-[10px] text-muted-foreground">Fundability</p>
      </div>
      {isInvestor && !isSelf && (
        <div className="flex gap-1.5 shrink-0">
          <button onClick={onSave} className="rounded-lg border border-border p-2 hover:border-primary/40 transition-colors">
            {isSaved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4 text-muted-foreground" />}
          </button>
          <Button size="sm" variant="hero" onClick={onMeet}><Send className="size-3.5" /> Meet</Button>
        </div>
      )}
    </div>
  );
}

/* ── Leaderboard view ────────────────────────────────────────────── */
function LeaderboardView({ ventures }: { ventures: FounderShowcase[] }) {
  const sorted = [...ventures].sort((a, b) => (b.vantage_point ?? 0) - (a.vantage_point ?? 0)).slice(0, 50);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">Top 50 ventures ranked by Vantage Point</p>
      {sorted.map((v, i) => {
        const rank = i + 1;
        const podium = rank <= 3;
        const accent = rank === 1 ? "from-amber-300/20 border-amber-300/40" : rank === 2 ? "from-zinc-300/20 border-zinc-300/30" : rank === 3 ? "from-orange-300/20 border-orange-300/30" : "from-card border-border";
        return (
          <div key={v.user_id} className={cn("flex items-center gap-3 rounded-2xl border bg-gradient-to-r to-card px-4 py-3", accent)}>
            <div className="w-8 text-center">
              <span className="font-display text-xl font-light text-muted-foreground">{rank}</span>
              {podium && <Trophy className={cn("mx-auto size-3 mt-0.5", rank === 1 ? "text-amber-400" : rank === 2 ? "text-zinc-400" : "text-orange-400")} />}
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-sm text-primary">
              {(v.venture_name ?? "V").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{v.venture_name}</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {v.stage && <span>{v.stage}</span>}
                {v.country && <span>{v.country}</span>}
                {v.industry && <span>{v.industry}</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-light tabular text-primary">{v.vantage_point ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Vantage</p>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <p className="font-semibold text-sm tabular text-emerald-600">{v.fundability ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground">Fundability</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Meetings view (replaces the separate /meetings page) ────────── */
function MeetingsView({ isFounder, isInvestor }: { isFounder: boolean; isInvestor: boolean }) {
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const { data: received = [], isLoading: rxLoading } = useQuery({
    queryKey: ["meetings-received", user?.id],
    enabled: !!user && isFounder,
    queryFn: async () => {
      const res = await dotApi.get<{ meetings: any[] }>("/api/investor/meetings?role=founder");
      return res?.meetings ?? [];
    },
  });

  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: ["meetings-sent", user?.id],
    enabled: !!user && isInvestor,
    queryFn: async () => {
      const res = await dotApi.get<{ meetings: any[] }>("/api/investor/meetings");
      return res?.meetings ?? [];
    },
  });

  async function updateStatus(id: string, status: "accepted" | "declined") {
    try {
      await dotApi.patch(`/api/investor/meetings/${id}`, { status });
      // When accepted: open a connection thread so both parties can chat
      if (status === "accepted") {
        try {
          await dotApi.post(`/api/connections/from-meeting/${id}`, {});
        } catch { /* best effort */ }
      }
      qc.invalidateQueries({ queryKey: ["meetings-received", user?.id] });
      qc.invalidateQueries({ queryKey: ["connections"] });
      toast.success(status === "accepted" ? "Meeting accepted! Chat thread opened in Meetings." : "Request declined.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  }

  const pending = received.filter((r) => r.status === "pending");

  if (rxLoading || sentLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Received</p>
          <p className="mt-2 font-display text-3xl font-light">{received.length}</p>
          {pending.length > 0 && <p className="text-xs text-amber-500 mt-1">{pending.length} pending reply</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Accepted</p>
          <p className="mt-2 font-display text-3xl font-light text-primary">{received.filter((r) => r.status === "accepted").length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sent</p>
          <p className="mt-2 font-display text-3xl font-light">{sent.length}</p>
        </div>
      </div>

      {/* Received list */}
      {isFounder && (
        <section>
          <h3 className="mb-3 font-semibold">Received requests</h3>
          {received.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No meeting requests yet" description="When investors request meetings with you, they'll appear here." />
          ) : (
            <div className="space-y-3">
              {received.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(r.investor?.name ?? "I").charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.investor?.name ?? "Investor"}</p>
                        {r.investor?.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3" />{r.investor.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"} className="text-[10px]">
                        {r.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />{new Date(r.createdAt ?? r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {r.message && (
                    <blockquote className="mt-3 rounded-lg border-l-2 border-primary/40 bg-muted/30 px-3 py-2 text-sm italic text-foreground/80">
                      "{r.message}"
                    </blockquote>
                  )}
                  {r.status === "pending" && (
                    <div className="mt-3 flex gap-2 pt-3 border-t border-border">
                      <Button size="sm" variant="hero" onClick={() => updateStatus(r.id, "accepted")}><CheckCircle2 className="size-4" /> Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "declined")}><XCircle className="size-4" /> Decline</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sent list */}
      {isInvestor && sent.length > 0 && (
        <section>
          <h3 className="mb-3 font-semibold">Requests you sent</h3>
          <div className="space-y-2">
            {sent.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <Building2 className="size-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.founder?.venture_name ?? "Venture"}</p>
                  {r.founder?.country && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{r.founder.country}</p>}
                </div>
                <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"} className="text-[10px]">{r.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Meeting request modal ───────────────────────────────────────── */
function MeetingModal({ venture, onClose }: { venture: FounderShowcase; onClose: () => void }) {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState("I'd like to learn more about your venture and explore a potential investment.");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) return;
    setBusy(true);
    try {
      await dotApi.post("/api/investor/meetings", {
        founderId: venture.user_id,
        topic: `Investment inquiry — ${venture.venture_name}`,
        message: message.trim(),
      });
      qc.invalidateQueries({ queryKey: ["meetings-sent", user.id] });
      toast.success("Meeting request sent!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Request a meeting</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              with <strong>{venture.founder_name ?? "the founder"}</strong> of {venture.venture_name}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-md p-1">✕</button>
        </div>

        {/* Venture snapshot */}
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Vantage</span><span className="font-semibold text-primary">{venture.vantage_point ?? 0} / 1000</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fundability</span><span className="font-semibold text-emerald-600">{venture.fundability ?? 0}%</span></div>
          {venture.funding_goal && <div className="flex justify-between"><span className="text-muted-foreground">Raising</span><span className="font-semibold">{formatNaira(Number(venture.funding_goal))}</span></div>}
          {venture.stage && <div className="flex justify-between"><span className="text-muted-foreground">Stage</span><span>{venture.stage}</span></div>}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Your message</label>
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">{message.length}/500</p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={!message.trim() || busy} className="flex-1">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send request
          </Button>
        </div>
      </div>
    </div>
  );
}
