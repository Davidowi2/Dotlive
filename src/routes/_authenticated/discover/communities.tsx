/**
 * /discover/communities — Browse all communities on DOT.
 *
 * Filters: tier, region, category.
 * Search by name/description.
 * Beautiful card grid with leader info, member count, tier badge.
 */

import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Search, MapPin, ChevronRight, Sparkles,
  Award, Loader2, Building2, GraduationCap, Briefcase, Globe,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { cn } from "@/lib/utils";

import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/discover/communities")({
  head: () => ({ meta: [{ title: "Communities — DOT" }] }),
  component: DiscoverCommunitiesPage,
});

interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tier: string;
  region: string | null;
  memberCount: number;
  createdAt: string;
  leader: { name: string | null; dotId: string } | null;
}

const TIER_META: Record<string, { label: string; className: string; icon: any }> = {
  free:        { label: "Free",        className: "bg-muted text-muted-foreground",          icon: Globe },
  verified:    { label: "Verified",    className: "bg-emerald-500/10 text-emerald-500",      icon: Award },
  campus:      { label: "Campus",      className: "bg-blue-500/10 text-blue-500",            icon: GraduationCap },
  enterprise:  { label: "Enterprise",  className: "bg-purple-500/10 text-purple-500",        icon: Briefcase },
};

const CATEGORY_ICONS: Record<string, any> = {
  founders: Sparkles,
  builders: Building2,
  campus: GraduationCap,
  investors: Award,
  community: Users,
};

const FILTERS = [
  { value: "all", label: "All communities" },
  { value: "verified", label: "Verified" },
  { value: "enterprise", label: "Enterprise" },
  { value: "campus", label: "Campus" },
  { value: "free", label: "Free" },
];

function DiscoverCommunitiesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const communitiesQ = useQuery({
    queryKey: ["discover", "communities"],
    queryFn: () => dotApi.get<{ communities: Community[] }>("/api/communities"),
  });

  const communities = communitiesQ.data?.communities ?? [];

  const filtered = useMemo(() => {
    return communities.filter((c) => {
      // Tier filter
      if (filter !== "all" && c.tier !== filter) return false;
      // Search filter
      if (search) {
        const s = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(s) &&
          !(c.description?.toLowerCase().includes(s) ?? false) &&
          !(c.region?.toLowerCase().includes(s) ?? false)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [communities, search, filter]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Discover · Communities
          </p>
          <h1 className="mt-1 font-display text-4xl">
            Where Africa's founders gather
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Browse {communities.length} active communities across the continent.
            Each one has its own referral code, dashboard, and DOT-based leader rewards.
          </p>
        </div>

        {/* ── Search + filters ── */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        {communitiesQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No communities match"
            description={search ? "Try a different search term or remove a filter." : "Be the first to start one."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        )}

        {/* ── CTA strip ── */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg">Run your own community?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Spin up a community in minutes. Referral links, member tracking,
                and DOT-based rewards all included.
              </p>
            </div>
            <Button variant="hero">Start a community</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function CommunityCard({ community }: { community: Community }) {
  const tierMeta = TIER_META[community.tier] ?? TIER_META.free;
  const TierIcon = tierMeta.icon;
  const CategoryIcon = CATEGORY_ICONS[community.category ?? ""] ?? Users;

  // Initials from name
  const initials = community.name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Top: avatar + tier badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 font-display text-lg font-bold text-primary">
            {initials || "•"}
          </div>
          <Badge className={cn("shrink-0 gap-1 text-[10px]", tierMeta.className)}>
            <TierIcon className="size-3" />
            {tierMeta.label}
          </Badge>
        </div>

        {/* Title + description */}
        <div className="space-y-1">
          <h3 className="font-display text-lg leading-tight">{community.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {community.description ?? "A DOT community."}
          </p>
        </div>

        {/* Meta: region + category + member count */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {community.region && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {community.region}
            </span>
          )}
          {community.category && (
            <span className="inline-flex items-center gap-1">
              <CategoryIcon className="size-3" />
              {community.category.replace(/_/g, " ")}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {community.memberCount} members
          </span>
        </div>

        {/* Footer: leader + arrow */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-xs">
            <p className="text-muted-foreground">Led by</p>
            <p className="font-medium">
              {community.leader?.name ?? "Unknown"}
              {community.leader?.dotId && (
                <span className="ml-1 text-muted-foreground">· {community.leader.dotId.slice(0, 8)}…</span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            View
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
