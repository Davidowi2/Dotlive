/**
 * /marketplace — browse open gigs (service listings).
 * Founders post gigs; builders apply.
 *
 * Filters: category, min budget, max delivery
 * Search by title
 * Card grid with builder avatar, rating, budget in DOT
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Briefcase, Star, Coins, Clock, MapPin,
  ArrowUpRight, Loader2, Plus,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { PostJobWizard } from "@/components/marketplace/PostJobWizard";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useWallet } from "@/hooks/use-dot-data";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — Open Gigs · DOT" }] }),
  component: MarketplacePage,
});

interface Service {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priceDot: number;
  nairaEquivalent?: number;
  deliveryDays: number | null;
  builderId: string;
  builderName?: string | null;
  builderAvatar?: string | null;
  builderRating?: number | null;
  createdAt: string;
}

async function listServices(): Promise<Service[]> {
  const res = await dotApi.get<{ services: Service[] }>("/api/services");
  return res.services ?? [];
}

function MarketplacePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [showPostJob, setShowPostJob] = useState(false);
  const { user } = useDotAuth();
  const { data: walletBalance = 0 } = useWallet();
  const isFounder = user?.roles?.includes("founder");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: listServices,
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [services]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return services.filter((s) => {
      if (category && s.category !== category) return false;
      if (!needle) return true;
      return (
        s.title.toLowerCase().includes(needle) ||
        (s.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [services, q, category]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Marketplace"
        title="Open gigs"
        subtitle="Builders post services. Hire them, fund escrow, ship it."
        action={
          isFounder ? (
            <Button onClick={() => setShowPostJob(true)} size="sm">
              <Plus className="size-4" />
              Post a Gig
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search gigs"
            className="pl-9"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <Button asChild variant="outline">
          <Link to="/discover">
            <Search className="mr-2 size-4" /> Browse all
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<Briefcase className="size-7" />}
          title={services.length === 0 ? "No gigs posted yet" : "No matches"}
          description={
            services.length === 0
              ? "When builders post services, they show up here."
              : "Try clearing your filters or searching for something else."
          }
          action={
            services.length === 0 ? (
              <Button asChild>
                <Link to="/work">
                  <Briefcase className="mr-2 size-4" />
                  Open your DOT Work dashboard
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <GigCard key={s.id} service={s} />
          ))}
        </div>
      )}
      
      {/* Post Job Wizard */}
      <PostJobWizard
        open={showPostJob}
        onClose={() => setShowPostJob(false)}
        walletBalance={walletBalance}
      />
    </AppShell>
  );
}

function GigCard({ service }: { service: Service }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-display text-lg font-light tracking-tight">
            {service.title}
          </h3>
          {service.category && (
            <Badge variant="outline" className="text-[10px]">{service.category}</Badge>
          )}
        </div>
        {service.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {service.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 font-semibold tabular">
            <Coins className="size-4 text-primary" />
            {service.priceDot}
            <span className="text-xs font-normal text-muted-foreground">DOT</span>
            {service.nairaEquivalent != null && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (₦{Math.round(service.nairaEquivalent).toLocaleString()})
              </span>
            )}
          </div>
          {service.deliveryDays != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" /> {service.deliveryDays}d
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <Link
            to="/builder/$id"
            params={{ id: service.builderId }}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              {(service.builderName ?? "?").slice(0, 1)}
            </div>
            <span className="font-medium">{service.builderName ?? "Builder"}</span>
            {service.builderRating != null && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500">
                <Star className="size-3 fill-current" /> {service.builderRating.toFixed(1)}
              </span>
            )}
          </Link>
          <Button asChild size="sm" variant="ghost">
            <Link to="/builder/$id" params={{ id: service.builderId }}>
              Hire <ArrowUpRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
