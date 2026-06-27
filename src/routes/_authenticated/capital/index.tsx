import { useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet, TrendingUp, Users, Building2, Target, BarChart3,
  Sparkles, Shield, Loader2, ChevronRight, DollarSign, Heart,
} from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dotApi } from "@/api/client";

/**
 * /capital — Capital Partner dashboard.
 *
 *   /capital            → Dashboard (KPIs, deployment tracker, featured ventures)
 *   /capital/portfolio  → My commitments + ventures funded
 *   /capital/discover   → Find ventures to deploy into
 *   /capital/featured   → Public featured ventures (anyone can browse)
 *
 * Capital Partners are different from Investors:
 *   - Investor: browses, saves, follows ventures, can vote
 *   - Capital Partner: commits DOT, funds ventures, sponsors events
 */

export const Route = createFileRoute("/_authenticated/capital/")({
  head: () => ({ meta: [{ title: "Capital — DOT" }] }),
  component: CapitalDashboardHome,
});

function CapitalDashboardHome() {
  const { roles } = useDotAuth();
  const isCp = roles.includes("capital_partner");
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["capital", "stats"],
    queryFn: () => dotApi.get<any>("/api/capital/stats"),
    enabled: isCp || isAdmin,
  });

  const { data: deployments } = useQuery({
    queryKey: ["capital", "deployments"],
    queryFn: () => dotApi.get<any>("/api/capital/deployments"),
    enabled: isCp || isAdmin,
  });

  const { data: featured } = useQuery({
    queryKey: ["capital", "featured"],
    queryFn: () => dotApi.get<{ featured: any[] }>("/api/capital/featured"),
  });

  if (!isCp && !isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-20 text-center">
          <Shield className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl">Capital Partner access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This dashboard is for Capital Partners — the entities that deploy DOT into ventures.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/investor">I'm an Investor →</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Apply for Capital Partner access</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const deployedDot = Number(deployments?.deployedDot ?? stats?.totalOutflowDot ?? 0);
  const venturesFunded = Number(deployments?.venturesFunded ?? stats?.venturesFunded ?? 0);
  const liquidDot = Number(deployments?.liquidDot ?? 0);
  const featuredList: any[] = (featured as any)?.featured ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl">Capital Partner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deploy DOT into ventures, sponsor Demo tracks, and earn from successful outcomes.
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Wallet}
            label="Liquid DOT"
            value={liquidDot.toLocaleString()}
            sub="Available to deploy"
            tone="primary"
          />
          <KpiCard
            icon={TrendingUp}
            label="Deployed"
            value={deployedDot.toLocaleString()}
            sub={`across ${venturesFunded} venture${venturesFunded === 1 ? "" : "s"}`}
            tone="success"
          />
          <KpiCard
            icon={Target}
            label="Sponsorships"
            value={Number(stats?.commitCount ?? 0).toLocaleString()}
            sub="Capital commits"
          />
          <KpiCard
            icon={Users}
            label="Venture outcomes"
            value={venturesFunded.toLocaleString()}
            sub="Distinct ventures funded"
          />
        </div>

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionCard
            to="/discover"
            icon={Sparkles}
            title="Find ventures"
            desc="Filter by stage, vantage, fundability, industry, country."
          />
          <ActionCard
            to="/capital/portfolio"
            icon={BarChart3}
            title="My portfolio"
            desc="Track commitments + capital deployed across ventures."
          />
          <ActionCard
            to="/events"
            icon={Building2}
            title="Sponsor events"
            desc="Fund Demo prizes, sponsor sessions, host Campus Challenges."
          />
        </div>

        {/* Featured ventures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Heart className="size-4 text-amber-500" /> Featured Ventures</span>
              <Link to="/discover" className="text-xs font-normal text-primary hover:underline">
                Browse all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {featuredList.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No ventures have received capital commitments yet. Be the first to deploy.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {featuredList.slice(0, 6).map((v: any) => (
                  <Link
                    key={v.id}
                    to="/founder/$id"
                    params={{ id: v.id }}
                    className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {v.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-medium group-hover:text-primary">{v.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{v.stage}</Badge>
                        {v.country && <span>{v.country}</span>}
                        <span className="ml-auto font-medium text-primary">
                          {Number(v.deployed_dot ?? 0).toLocaleString()} DOT
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deployment tracker — visual breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deployment tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Deployed</span>
                  <span className="font-medium tabular-nums">{deployedDot.toLocaleString()} DOT</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min((deployedDot / Math.max(deployedDot + liquidDot, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Liquid (available to deploy)</span>
                  <span className="font-medium tabular-nums">{liquidDot.toLocaleString()} DOT</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-muted-foreground/40 transition-all"
                    style={{ width: `${Math.min((liquidDot / Math.max(deployedDot + liquidDot, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Total wallet: <strong>{(deployedDot + liquidDot).toLocaleString()} DOT</strong> · {venturesFunded} distinct ventures funded
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone }: {
  icon: any; label: string; value: string; sub?: string; tone?: "primary" | "success";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <Icon className={cn("size-4", tone === "primary" ? "text-primary" : tone === "success" ? "text-emerald-500" : "text-muted-foreground")} />
        </div>
        <div className="mt-2 font-display text-3xl tabular-nums">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ActionCard({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="mt-1 size-4 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}
