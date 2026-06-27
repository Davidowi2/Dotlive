/**
 * /admin — Admin dashboard home.
 *
 * Overview stats: users today/week, total admins, DOT in circulation,
 * recent admin actions, system alerts.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, Users, Shield, Coins, AlertTriangle, ArrowRight,
  TrendingUp, Clock, Wallet as WalletIcon, FileText, CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — DOT" }] }),
  component: AdminDashboardPage,
});

interface AdminStats {
  users: {
    total: number;
    today: number;
    week: number;
    admins: number;
    banned: number;
  };
  ventures: { total: number };
  wallets: {
    total: number;
    totalDot: number;
  };
  communities: { total: number };
  challenges: { total: number };
  tokenOps: {
    total: number;
    recent: Array<{
      id: string;
      type: string;
      amount: number | string;
      actor: string;
      reason: string | null;
      created_at: string;
    }>;
  };
  timestamp: string;
}

function AdminDashboardPage() {
  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => dotApi.get<AdminStats>("/api/admin/stats"),
  });
  const stats = statsQ.data;

  const stat = (label: string, value: number | string, sublabel?: string, Icon?: any) => (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
            {sublabel && <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>}
          </div>
          {Icon && (
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of platform health, users, and recent admin actions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => statsQ.refetch()}>
          <Activity className="size-4" /> Refresh
        </Button>
      </div>

      {statsQ.isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !stats ? (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="mx-auto size-8 text-destructive" />
          <p className="mt-2 font-medium">Could not load stats</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {statsQ.error instanceof Error ? statsQ.error.message : "Unknown error"}
          </p>
        </div>
      ) : (
        <>
          {/* ── Stat grid ── */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stat("Users total", stats.users.total.toLocaleString(),
              `${stats.users.today} new today · ${stats.users.week} this week`, Users)}
            {stat("Admins", stats.users.admins, "admin + super_admin", Shield)}
            {stat("Ventures", stats.ventures.total, "all statuses", FileText)}
            {stat("DOT in circulation", Number(stats.wallets.totalDot).toLocaleString(),
              `${stats.wallets.total} wallets`, Coins)}
            {stat("Communities", stats.communities.total, undefined, Users)}
            {stat("Challenges", stats.challenges.total, undefined, TrendingUp)}
            {stat("Token ops", stats.tokenOps.total, "all-time mint/burn/transfer", Activity)}
            {stat("Banned users", stats.users.banned, "currently banned", AlertTriangle)}
          </div>

          {/* ── Recent ops + quick links ── */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Recent token ops */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-4" />
                    Recent admin actions
                  </CardTitle>
                  <Link
                    to="/admin/tokens"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View all <ArrowRight className="size-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats.tokenOps.recent.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No admin actions yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {stats.tokenOps.recent.map((op) => (
                      <li key={op.id} className="flex items-center justify-between py-2.5 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                            op.type === "mint" ? "bg-emerald-500/10 text-emerald-500" :
                            op.type === "burn" ? "bg-red-500/10 text-red-500" :
                            "bg-blue-500/10 text-blue-500"
                          }`}>
                            <Coins className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {op.type} · {Number(op.amount).toLocaleString()} DOT
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              by {op.actor} · {op.reason ?? "no reason"}
                            </p>
                          </div>
                        </div>
                        <span className="ml-2 text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                          {new Date(op.created_at).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Admin tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <QuickLink to="/admin/members" icon={Users} label="Manage members" sub="Promote, demote, ban" />
                <QuickLink to="/admin/wallets" icon={WalletIcon} label="Wallets" sub="Transfer, balance overview" />
                <QuickLink to="/admin/tokens" icon={Coins} label="Token supply" sub="Mint, burn, audit" />
                <QuickLink to="/admin/roles" icon={Shield} label="Roles & permissions" sub="Super-admin only" />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function QuickLink({ to, icon: Icon, label, sub }: { to: any; icon: any; label: string; sub: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/50"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
