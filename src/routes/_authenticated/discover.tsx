import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass, Search, X, Filter, Sparkles, Building2, MapPin,
  ArrowUpRight, Gauge, TrendingUp, Briefcase, ChevronDown, Loader2,
  Heart, Vote,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/app/EmptyState";
import { cn } from "@/lib/utils";
import { dotApi } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * /discover — Sprint B: real filters, real ventures.
 *
 * Filters:
 *   - search (name)
 *   - stage (Assess/Validate/Build/Fund/Scale)
 *   - industry
 *   - country
 *   - vantage range
 *   - fundability minimum
 *   - sort (newest / vantage_desc / fundability_desc / alpha)
 *
 * Each card shows: venture name, founder name + DOT ID, stage, country,
 * industry, vantage, fundability, and a "View profile" link to the
 * public /founder/$dotId page.
 */

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — DOT" }] }),
  component: DiscoverPage,
});

const STAGES = ["Assess", "Validate", "Build", "Fund", "Scale"];
const INDUSTRIES = [
  "Fintech", "Agriculture", "Commerce", "Health",
  "Energy", "Education", "Logistics", "Media", "Other",
];

function DiscoverPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [minVantage, setMinVantage] = useState<string>("");
  const [minFundability, setMinFundability] = useState<string>("");
  const [sort, setSort] = useState<string>("newest");

  const filters = useMemo(() => ({
    search: query || undefined,
    stage: stage || undefined,
    industry: industry || undefined,
    country: country || undefined,
    minVantage: minVantage ? Number(minVantage) : undefined,
    minFundability: minFundability ? Number(minFundability) : undefined,
    sort,
    limit: 50,
  }), [query, stage, industry, country, minVantage, minFundability, sort]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["discover", filters],
    queryFn: () => dotApi.get<{ ventures: any[]; nextCursor: string | null }>("/api/ventures?" + new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
    ).toString()),
    staleTime: 30_000,
  });

  const ventures: any[] = (data as any)?.ventures ?? [];

  // For each venture card, fetch founder info (cached via React Query)
  const founderIds = useMemo(() => Array.from(new Set(ventures.map((v) => v.userId))), [ventures]);
  const { data: foundersMap } = useQuery({
    queryKey: ["founders-map", founderIds],
    queryFn: async () => {
      const map: Record<string, { name: string | null; dotId: string | null; avatarUrl: string | null }> = {};
      await Promise.all(
        founderIds.slice(0, 50).map(async (id) => {
          try {
            const r = await dotApi.get<any>(`/api/founders/${encodeURIComponent(id)}`);
            map[id] = { name: r.founder.name, dotId: r.founder.dotId, avatarUrl: r.founder.avatarUrl };
          } catch {}
        })
      );
      return map;
    },
    enabled: founderIds.length > 0,
    staleTime: 60_000,
  });

  // For each venture, fetch demo votes count
  const { data: voteCounts } = useQuery({
    queryKey: ["discover-votes", ventures.map(v => v.id)],
    queryFn: async () => {
      const map: Record<string, number> = {};
      await Promise.all(
        ventures.slice(0, 50).map(async (v) => {
          try {
            // Pull from the demo-events leaderboard API or votes — fallback to 0
            const r = await dotApi.get<any>(`/api/votes/venture/${v.id}/count`).catch(() => ({ count: 0 }));
            map[v.id] = r.count ?? 0;
          } catch {
            map[v.id] = 0;
          }
        })
      );
      return map;
    },
    enabled: ventures.length > 0,
    staleTime: 60_000,
  });

  const hasActiveFilters = query || stage || industry || country || minVantage || minFundability;

  return (
    <AppShell>
      <PageHeader
              eyebrow="Network"
              title="Discover"
              subtitle="Browse ventures, founders, communities, and open gigs across the DOT network."
            />

            {/* Surface-level navigation — clarifies what Discover vs Communities vs DOT Work are */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link
                to="/discover"
                className="rounded-full border border-primary bg-primary/10 px-3 py-1 font-medium text-primary"
              >
                Ventures
              </Link>
              <Link
                to="/discover/communities"
                className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                Communities
              </Link>
              <Link
                to="/marketplace"
                className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                Open gigs
              </Link>
            </div>

      <div className="mt-6 space-y-6">
        {/* Search + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ventures by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="vantage_desc">Highest vantage</SelectItem>
              <SelectItem value="fundability_desc">Most fundable</SelectItem>
              <SelectItem value="alpha">A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Stage"
            value={stage}
            onChange={setStage}
            options={STAGES}
            placeholder="Any stage"
          />
          <FilterChip
            label="Industry"
            value={industry}
            onChange={setIndustry}
            options={INDUSTRIES}
            placeholder="Any industry"
          />
          <FilterInput
            label="Country"
            value={country}
            onChange={setCountry}
            placeholder="e.g. Nigeria"
          />
          <FilterInput
            label="Min vantage"
            value={minVantage}
            onChange={setMinVantage}
            placeholder="0"
            type="number"
          />
          <FilterInput
            label="Min fundability %"
            value={minFundability}
            onChange={setMinFundability}
            placeholder="0"
            type="number"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery(""); setStage(""); setIndustry(""); setCountry("");
                setMinVantage(""); setMinFundability("");
              }}
              className="h-8"
            >
              <X className="mr-1 size-3" /> Clear all
            </Button>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-destructive">
              Could not load ventures. {String((error as any)?.message ?? "")}
            </CardContent>
          </Card>
        ) : ventures.length === 0 ? (
          <EmptyState
            title="No ventures match these filters"
            description={hasActiveFilters
              ? "Try removing a filter — there are 0 ventures matching all of these."
              : "Be the first founder on DOT."}
            icon={Building2}
            action={hasActiveFilters ? (
              <Button variant="outline" onClick={() => {
                setQuery(""); setStage(""); setIndustry(""); setCountry("");
                setMinVantage(""); setMinFundability("");
              }}>Clear filters</Button>
            ) : (
              <Button asChild>
                <Link to="/onboarding">Create your venture</Link>
              </Button>
            )}
          />
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span><strong>{ventures.length}</strong> ventures</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ventures.map((v) => {
                const founder = foundersMap?.[v.userId];
                return (
                  <VentureCard key={v.id} venture={v} founder={founder} voteCount={voteCounts?.[v.id] ?? 0} />
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function VentureCard({ venture, founder, voteCount }: {
  venture: any;
  founder?: { name: string | null; dotId: string | null; avatarUrl: string | null };
  voteCount: number;
}) {
  const fundingGoal = Number(venture.fundingGoal ?? 0);
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link
              to="/founder/$id"
              params={{ id: founder?.dotId ?? venture.userId }}
              className="font-display text-lg group-hover:text-primary"
            >
              {venture.name}
            </Link>
            {founder && (
              <Link
                to="/founder/$id"
                params={{ id: founder.dotId ?? venture.userId }}
                className="mt-0.5 block text-xs text-muted-foreground hover:text-foreground"
              >
                by {founder.name ?? "—"}
                {founder.dotId && <span className="ml-1 font-mono opacity-60">({founder.dotId})</span>}
              </Link>
            )}
          </div>
          <Link
            to="/founder/$id"
            params={{ id: founder?.dotId ?? venture.userId }}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {venture.industry && (
            <Badge variant="outline" className="text-[10px]">
              <Briefcase className="mr-1 size-3" />{venture.industry}
            </Badge>
          )}
          {venture.stage && (
            <Badge variant="secondary" className="text-[10px]">{venture.stage}</Badge>
          )}
          {venture.country && (
            <Badge variant="outline" className="text-[10px]">
              <MapPin className="mr-1 size-3" />{venture.country}
            </Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
          <Stat icon={Gauge} label="Vantage" value={Number(venture.vantagePoint ?? 0).toLocaleString()} />
          <Stat icon={TrendingUp} label="Fundability" value={`${Number(venture.fundability ?? 0)}%`} />
          <Stat icon={Vote} label="Votes" value={voteCount.toLocaleString()} />
        </div>

        {fundingGoal > 0 && (
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-xs text-muted-foreground">Funding goal</span>
            <span className="font-medium tabular-nums">{fundingGoal.toLocaleString()} DOT</span>
          </div>
        )}
      </CardContent>
    </Card>
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

function FilterChip({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v === "__any" ? "" : v)}>
      <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
        <SelectValue placeholder={`${label}: ${placeholder}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__any">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FilterInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-24 text-xs"
      />
    </div>
  );
}
