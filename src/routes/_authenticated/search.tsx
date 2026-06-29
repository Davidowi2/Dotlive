/**
 * /search — Reddit-style unified search.
 *
 * Returns mixed results across:
 *   - Ventures (founder businesses)
 *   - Builders (talent)
 *   - Communities
 *   - Jobs / Open roles
 *
 * One input, one results page. No tiers, no categories required.
 * Inspired by Reddit's universal search: every result is a card with
 * vertical, type badge, name, and key signal.
 */
import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search as SearchIcon,
  Building2,
  Hammer,
  Users,
  Briefcase,
  X,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { dotApi } from "@/api/client";
import { listJobs } from "@/api/marketplace";
import { formatDot } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — DOT" }] }),
  component: SearchPage,
});

interface SearchHit {
  id: string;
  vertical: "venture" | "builder" | "community" | "job";
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

function SearchPage() {
  const [q, setQ] = useState("");

  // Use a single combined "global search" endpoint if backend has it,
  // otherwise just disable the query when empty.
  const { data: combined = { ventures: [], builders: [], communities: [], jobs: [] } } =
    useQuery({
      queryKey: ["global-search", q],
      queryFn: async (): Promise<{
        ventures: any[];
        builders: any[];
        communities: any[];
        jobs: any[];
      }> => {
        if (q.trim().length < 2) {
          return { ventures: [], builders: [], communities: [], jobs: [] };
        }
        try {
          // Run all four in parallel — graceful degradation if some fail.
          const [ventures, builders, communities, jobs] = await Promise.allSettled([
            dotApi
              .get(`/api/founders?search=${encodeURIComponent(q)}`)
              .then((r: any) => r?.founders ?? [])
              .catch(() => []),
            dotApi
              .get(`/api/builders?search=${encodeURIComponent(q)}`)
              .then((r: any) => r?.builders ?? [])
              .catch(() => []),
            dotApi
              .get(`/api/communities?search=${encodeURIComponent(q)}`)
              .then((r: any) => r?.communities ?? [])
              .catch(() => []),
            listJobs({ search: q }).catch(() => []),
          ]);
          return {
            ventures:
              ventures.status === "fulfilled" ? ventures.value : [],
            builders:
              builders.status === "fulfilled" ? builders.value : [],
            communities:
              communities.status === "fulfilled" ? communities.value : [],
            jobs: jobs.status === "fulfilled" ? jobs.value : [],
          };
        } catch {
          return { ventures: [], builders: [], communities: [], jobs: [] };
        }
      },
      staleTime: 30 * 1000,
    });

  const hits: SearchHit[] = useMemo(() => {
    const out: SearchHit[] = [];
    for (const v of combined.ventures) {
      out.push({
        id: v.id ?? v.dotId ?? v.founderId,
        vertical: "venture",
        title: v.name ?? v.ventureName ?? "Venture",
        subtitle: v.bio ?? v.tagline ?? "",
        meta: v.stage ?? "",
        href: `/founder/${v.dotId ?? v.id}`,
      });
    }
    for (const b of combined.builders) {
      out.push({
        id: b.id ?? b.userId ?? b.dotId,
        vertical: "builder",
        title: b.name ?? b.headline ?? "Builder",
        subtitle: b.headline ?? b.bio ?? "",
        meta: b.skills?.slice(0, 4).join(" · "),
        href: `/builder/${b.dotId ?? b.id ?? b.userId}`,
      });
    }
    for (const c of combined.communities) {
      out.push({
        id: c.id ?? c.slug,
        vertical: "community",
        title: c.name ?? c.title ?? "Community",
        subtitle: c.description ?? c.tagline ?? "",
        meta: c.category ?? "",
        href: `/community/${c.id ?? c.slug}`,
      });
    }
    for (const j of combined.jobs) {
      out.push({
        id: j.id,
        vertical: "job",
        title: j.title,
        subtitle: j.description ?? "",
        meta: `${formatDot(j.salaryDot)} DOT`,
        href: `/discover/open-roles/${j.id}`,
      });
    }
    return out;
  }, [combined]);

  const totals = {
    venture: hits.filter((h) => h.vertical === "venture").length,
    builder: hits.filter((h) => h.vertical === "builder").length,
    community: hits.filter((h) => h.vertical === "community").length,
    job: hits.filter((h) => h.vertical === "job").length,
  };

  return (
    <AppShell>
      <PageHeader
        title="Search"
        subtitle="Find ventures, builders, communities, and open roles across DOT."
      />

      <div className="mt-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search DOT — try a founder name, skill, role, or community…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-14 rounded-2xl pl-12 pr-12 text-base"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {q.trim().length >= 2 ? (
          <div className="mt-6 space-y-6">
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Chip count={hits.length} label="All" active />
              {totals.venture > 0 && <Chip count={totals.venture} label="Ventures" />}
              {totals.builder > 0 && <Chip count={totals.builder} label="Builders" />}
              {totals.community > 0 && <Chip count={totals.community} label="Communities" />}
              {totals.job > 0 && <Chip count={totals.job} label="Open roles" />}
            </div>

            {hits.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center">
                  <p className="font-display text-lg font-light">No results</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a shorter or different query, or browse{" "}
                    <Link to="/discover" className="text-primary hover:underline">
                      ventures
                    </Link>{" "}
                    or{" "}
                    <Link to="/discover/communities" className="text-primary hover:underline">
                      communities
                    </Link>{" "}
                    directly.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {hits.map((h) => (
                  <SearchHitCard key={`${h.vertical}-${h.id}`} hit={h} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <SuggestionCard
              to="/discover"
              icon={Building2}
              label="Ventures"
              description="Browse all founder ventures by stage, industry, vantage."
            />
            <SuggestionCard
              to="/discover/communities"
              icon={Users}
              label="Communities"
              description="Find communities by region, category, or leader."
            />
            <SuggestionCard
              to="/builder"
              icon={Hammer}
              label="Builders"
              description="Find builders by skill or availability."
            />
            <SuggestionCard
              to="/discover?tab=open-roles"
              icon={Briefcase}
              label="Open roles"
              description="Find jobs posted by founders."
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ count, label, active }: { count: number; label: string; active?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {label} ({count})
    </span>
  );
}

function SearchHitCard({ hit }: { hit: SearchHit }) {
  const iconMap: Record<SearchHit["vertical"], LucideIcon> = {
    venture: Building2,
    builder: Hammer,
    community: Users,
    job: Briefcase,
  };
  const Icon = iconMap[hit.vertical];
  return (
    <Link
      to={hit.href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <span className="rounded-lg bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{hit.title}</span>
          <Badge variant="muted" className="text-[10px] uppercase">
            {hit.vertical}
          </Badge>
        </div>
        {hit.subtitle && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hit.subtitle}</p>
        )}
        {hit.meta && (
          <p className="mt-1 text-[11px] text-muted-foreground/70">{hit.meta}</p>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SuggestionCard({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-5 transition-colors hover:border-primary/40 hover:bg-card"
    >
      <span className="rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}
