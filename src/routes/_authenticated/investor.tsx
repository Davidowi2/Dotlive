import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Bookmark, Search, Heart, ArrowUpRight, Gauge, TrendingUp, Vote, MapPin, Briefcase, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { dotApi } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { INDUSTRIES, JOURNEY_STAGES } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * /investor — Sprint B investor portal.
 *
 * Investors are different from Capital Partners:
 *   - Investor: browses, saves, votes, follows ventures; does NOT commit funds
 *   - Capital Partner: commits DOT, funds ventures, sponsors events
 *
 * This page lets investors:
 *   - Filter ventures (industry, stage, vantage range, search)
 *   - Save favorites for later
 *   - See vote counts
 *   - Click into public founder profiles
 */

export const Route = createFileRoute("/_authenticated/investor")({
  head: () => ({
    meta: [
      { title: "Investor Portal — DOT" },
      { name: "description", content: "Browse, filter and connect with African ventures on DOT." },
    ],
  }),
  component: InvestorPage,
});

const STAGES = ["Assess", "Validate", "Build", "Fund", "Scale"];

function InvestorPage() {
  const { user, roles } = useDotAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [stage, setStage] = useState("all");
  const [minVantage, setMinVantage] = useState(0);
  const [savedOnly, setSavedOnly] = useState(false);

  const isCapitalPartner = roles.includes("capital_partner");

  // Use the new /api/ventures endpoint for live discovery
  const filters = useMemo(() => ({
    search: query || undefined,
    industry: industry !== "all" ? industry : undefined,
    stage: stage !== "all" ? stage : undefined,
    minVantage: minVantage > 0 ? minVantage : undefined,
    sort: minVantage > 0 ? "vantage_desc" : "newest",
    limit: 50,
  }), [query, industry, stage, minVantage]);

  const { data: venturesData, isLoading } = useQuery({
    queryKey: ["investor", "ventures", filters],
    queryFn: () => dotApi.get<{ ventures: any[] }>(
      "/api/ventures?" + new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
      ).toString()
    ),
  });

  const ventures: any[] = venturesData?.ventures ?? [];

  // Saves (favorites)
  const { data: saves = [] } = useQuery({
    queryKey: ["investor-saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await dotApi.get<{ saves: { founderId: string }[] }>("/api/investor/saves");
        return res?.saves ?? [];
      } catch { return []; }
    },
  });
  const saved = new Set(saves.map((s: any) => s.founderId));

  // Vote counts
  const { data: voteCounts } = useQuery({
    queryKey: ["investor-votes", ventures.map((v: any) => v.id)],
    queryFn: async () => {
      const map: Record<string, number> = {};
      await Promise.all(
        ventures.slice(0, 50).map(async (v: any) => {
          try {
            const r = await dotApi.get<any>(`/api/votes/venture/${v.id}/count`).catch(() => ({ totalVotes: 0 }));
            map[v.id] = r.totalVotes ?? 0;
          } catch { map[v.id] = 0; }
        })
      );
      return map;
    },
    enabled: ventures.length > 0,
    staleTime: 60_000,
  });

  // Founder info
  const founderIds = useMemo(() => Array.from(new Set(ventures.map((v: any) => v.userId))), [ventures]);
  const { data: foundersMap } = useQuery({
    queryKey: ["investor-founders-map", founderIds],
    queryFn: async () => {
      const map: Record<string, { name: string | null; dotId: string | null }> = {};
      await Promise.all(
        founderIds.slice(0, 50).map(async (id) => {
          try {
            const r = await dotApi.get<any>(`/api/founders/${encodeURIComponent(id)}`);
            map[id] = { name: r.founder.name, dotId: r.founder.dotId };
          } catch {}
        })
      );
      return map;
    },
    enabled: founderIds.length > 0,
    staleTime: 60_000,
  });

  // Apply savedOnly filter (we don't filter on the backend)
  const filtered = useMemo(() => {
    if (!savedOnly) return ventures;
    return ventures.filter((v: any) => saved.has(v.userId));
  }, [ventures, savedOnly, saved]);

  async function toggleSave(founderId: string) {
    if (!user) {
      toast.error("Sign in to save ventures");
      return;
    }
    try {
      if (saved.has(founderId)) {
        await dotApi.delete(`/api/investor/saves/${encodeURIComponent(founderId)}`);
        toast.success("Removed from saved");
      } else {
        await dotApi.post("/api/investor/saves", { founderId });
        toast.success("Saved");
      }
      qc.invalidateQueries({ queryKey: ["investor-saves", user.id] });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Investor Portal"
        title="Discover ventures"
        subtitle="Browse, filter and save the African ventures you want to follow. Investors don't commit funds — that's for Capital Partners."
        action={
          isCapitalPartner ? (
            <Button asChild variant="default">
              <Link to="/capital">Open Capital dashboard →</Link>
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by venture name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {INDUSTRIES.filter((i: string) => i !== "All").map((i: string) => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 min-w-[200px] items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Min vantage: <strong className="text-foreground tabular-nums">{minVantage}</strong></span>
            <Slider
              min={0}
              max={1000}
              step={50}
              value={[minVantage]}
              onValueChange={(v) => setMinVantage(v[0])}
              className="max-w-md"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
              className="rounded"
            />
            Saved only
          </label>
        </div>

        {isCapitalPartner && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <Bookmark className="mt-0.5 size-5 text-emerald-500" />
              <div className="flex-1 text-sm">
                <strong>You're a Capital Partner.</strong> Investors browse and vote; Capital Partners deploy DOT.
                Use the Capital dashboard to commit funds to a venture.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <Briefcase className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No ventures match these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing filters or check back soon.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
              <span><strong className="text-foreground">{filtered.length}</strong> ventures</span>
              <Link to="/discover" className="text-primary hover:underline">Open full Discover →</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((v: any) => {
                const founder = foundersMap?.[v.userId];
                const founderLinkParam = founder?.dotId ?? v.userId;
                return (
                  <Card key={v.id} className="group transition-all hover:border-primary/40 hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Link
                            to="/founder/$id"
                            params={{ id: founderLinkParam }}
                            className="font-display text-lg group-hover:text-primary"
                          >
                            {v.name}
                          </Link>
                          {founder?.name && (
                            <div className="mt-0.5 text-xs text-muted-foreground">by {founder.name}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-8 shrink-0",
                            saved.has(v.userId) && "text-rose-500"
                          )}
                          onClick={() => toggleSave(v.userId)}
                          title={saved.has(v.userId) ? "Remove from saved" : "Save"}
                        >
                          <Heart className={cn("size-4", saved.has(v.userId) && "fill-current")} />
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                        {v.industry && (
                          <Badge variant="outline" className="text-[10px]">
                            <Briefcase className="mr-1 size-3" />{v.industry}
                          </Badge>
                        )}
                        {v.stage && (
                          <Badge variant="secondary" className="text-[10px]">{v.stage}</Badge>
                        )}
                        {v.country && (
                          <Badge variant="outline" className="text-[10px]">
                            <MapPin className="mr-1 size-3" />{v.country}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                        <Stat icon={Gauge} label="Vantage" value={Number(v.vantagePoint ?? 0).toLocaleString()} />
                        <Stat icon={TrendingUp} label="Fundability" value={`${Number(v.fundability ?? 0)}%`} />
                        <Stat icon={Vote} label="Votes" value={(voteCounts?.[v.id] ?? 0).toLocaleString()} />
                      </div>

                      {Number(v.fundingGoal ?? 0) > 0 && (
                        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                          <span className="text-xs text-muted-foreground">Goal</span>
                          <span className="font-medium tabular-nums">{Number(v.fundingGoal).toLocaleString()} DOT</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />{label}
      </div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
