/**
 * /community/dashboard — Community OS dashboard
 *
 * Shows leader-only metrics for a community they manage:
 *   - members, active, average valuation
 *   - open challenges in ecosystem
 *   - member roster
 */

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRoleGate } from "@/hooks/use-role-gate";
import { Users, Activity, Trophy, Target, Copy, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dotApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatNaira } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/community/dashboard")({
  head: () => ({ meta: [{ title: "Community Dashboard — DOT" }] }),
  component: CommunityDashboardPage,
});

function CommunityDashboardPage() {
  const gate = useRoleGate(["community_leader", "admin"], { redirect: "/dashboard" });
  
  // For v1, fetch the first community the user leads. Multi-community support is a future enhancement.
  const dashboardQ = useQuery({
    queryKey: ["community_dashboard"],
    queryFn: async () => {
      // First, list communities I might lead
      const res = await dotApi.get<{ communities: any[] }>("/api/communities");
      if (!res.communities?.length) return null;
      // Try to fetch dashboard for each; return the first one that works
      for (const c of res.communities) {
        try {
          const d = await dotApi.get<any>(`/api/communities/${c.id}/dashboard`);
          return d;
        } catch {}
      }
      return null;
    },
  });

  const data = dashboardQ.data;
  const comm = data?.community;
  const metrics = data?.metrics;

  return (
    <AppShell>
   
  if (!gate.allowed) return null;
   <PageHeader
        title="Community OS"
        subtitle="Distribute users, accelerate member growth, track valuation impact."
        actions={
          comm?.referralCode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/join/${comm.referralCode}`;
                navigator.clipboard.writeText(url);
                toast.success("Referral link copied");
              }}
            >
              <Copy className="mr-2 size-4" /> Copy invite link
            </Button>
          ) : null
        }
      />

      {dashboardQ.isLoading ? (
        <PageSkeleton.CardGrid count={4} cols={4} />
      ) : !comm ? (
        <EmptyState
          icon={Users}
          title="No community yet"
          description="Apply for the Community Leader role to start your community."
          action={
            <Button asChild variant="hero">
              <Link to="/onboarding">Become a Community Leader</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Community header */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">{comm.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{comm.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Code: {comm.referralCode}</Badge>
                  <span>·</span>
                  <span>Created {new Date(comm.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/c/${comm.id}`}>
                  <ExternalLink className="mr-2 size-4" /> Public hub
                </Link>
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Members" value={metrics?.members ?? 0} />
            <StatCard icon={Activity} label="Active" value={metrics?.active ?? 0} hint={`${Math.round(((metrics?.active ?? 0) / Math.max(1, metrics?.members ?? 1)) * 100)}% activation`} />
            <StatCard
              icon={Trophy}
              label="Avg Valuation"
              value={formatNaira(metrics?.avgValuationNgn ?? 0)}
              hint="across member ventures"
            />
            <StatCard
              icon={Target}
              label="Open Challenges"
              value={data?.openChallenges ?? 0}
              hint="in ecosystem"
            />
          </div>

          {/* Member roster placeholder */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-base font-semibold">Member Activity</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Member roster, recent challenges, and engagement trends will appear here as your community grows.
              Invite members with your referral code to see real-time activity.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/arena">Browse Challenges</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}