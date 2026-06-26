/**
 * Admin Dashboard — separate dedicated view for admins.
 *
 *   /admin                    Dashboard (KPIs, alerts, recent activity)
 *   /admin/members            All profiles (everyone in the DB, with search/filter)
 *   /admin/wallets            Wallet overview + admin transfer
 *   /admin/tokens             Token supply + cap visualization
 *   /admin/roles              Roles hierarchy + audit log
 *   /admin/content            Content management
 *
 * This is the new "admin has their own dashboard" — replaces the tabbed admin.tsx.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Users,
  Wallet as WalletIcon,
  Coins,
  ShieldAlert,
  BookOpen,
  ArrowLeft,
  Loader2,
  TrendingUp,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  UserPlus,
} from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  getRoleHierarchy, getTokenStats, getTokenOps,
  type RoleHierarchy, type TokenStats, type TokenOperation,
} from "@/api/admin-tools";
import { listAdminUsers, getAdminStats, type AdminUser } from "@/api/admin";
import { dotApi } from "@/api/client";

/* ============== ROUTE DEFINITION ============== */

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — DOT" }] }),
  component: AdminDashboardHome,
});

/* ============== DASHBOARD HOME ============== */

export function AdminDashboardHome() {
  const { roles } = useDotAuth();
  const isSuperAdmin = roles.includes("super_admin");

  const { data: hierarchy, isLoading: lh } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: getRoleHierarchy,
  });
  const { data: tokenStats, isLoading: lt } = useQuery({
    queryKey: ["admin", "token-stats"],
    queryFn: getTokenStats,
  });
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });
  const { data: ops } = useQuery({
    queryKey: ["admin", "token-ops", "recent"],
    queryFn: () => getTokenOps({ limit: 10 }),
    refetchInterval: 30_000,
  });
  const { data: members } = useQuery({
    queryKey: ["admin", "members-summary"],
    queryFn: () => listAdminUsers({ limit: 5 }),
  });

  if (lh || lt) {
    return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  const totalSuperAdmins = hierarchy?.stats.totalSuperAdmins ?? 0;
  const capPct = tokenStats?.capReachedPercent ?? 0;
  const recentOps = ops?.operations ?? [];
  const totalMembers = (stats as any)?.users?.total ?? 0;
  const totalRoles = (stats as any)?.roles?.total ?? 0;
  const totalBalance = (stats as any)?.wallets?.totalBalance ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Full platform control. Your actions are logged."
            : "Operational control. Super-admin actions are read-only for you."}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Members</div>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">{totalMembers.toLocaleString()}</div>
            <Link to="/admin/members" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ChevronRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Super Admins</div>
              <ShieldAlert className="size-4 text-amber-500" />
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">{totalSuperAdmins}</div>
            <div className="text-xs text-muted-foreground">
              Last cannot be removed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Circulating</div>
              <Coins className="size-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">
              {((tokenStats?.circulatingSupplyDot ?? 0) / 1e9).toFixed(2)}B
            </div>
            <div className="text-xs text-muted-foreground">
              {capPct.toFixed(4)}% of 100B cap
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Balance</div>
              <WalletIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">
              {Number(totalBalance).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">DOT across all wallets</div>
          </CardContent>
        </Card>
      </div>

      {/* Two columns: alerts + recent ops */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" /> Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {totalSuperAdmins === 0 && (
              <Alert severity="critical" title="No super admin exists" body="Promote a user to super_admin immediately." />
            )}
            {totalSuperAdmins === 1 && (
              <Alert severity="warn" title="Single super admin" body="Promote another user so you're not locked out." />
            )}
            {capPct > 90 && (
              <Alert severity="critical" title="Token cap nearly exhausted" body={`${capPct.toFixed(2)}% of 100B issued.`} />
            )}
            {capPct > 50 && capPct <= 90 && (
              <Alert severity="warn" title="Cap usage high" body={`${capPct.toFixed(2)}% issued. ${(100 - capPct).toFixed(2)}% remaining.`} />
            )}
            {totalSuperAdmins >= 2 && capPct < 50 && (
              <Alert severity="ok" title="All systems healthy" body="Multiple super admins exist. Token cap usage normal." />
            )}
            {totalMembers === 0 && (
              <Alert severity="info" title="No members yet" body="The platform is empty." />
            )}
          </CardContent>
        </Card>

        {/* Recent token operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" /> Recent token operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOps.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No operations yet.</div>
            ) : (
              <ul className="space-y-2">
                {recentOps.slice(0, 6).map((op) => (
                  <li key={op.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        op.operation === "mint" && "bg-primary/10 text-primary",
                        op.operation === "burn" && "bg-destructive/10 text-destructive",
                        op.operation === "admin_transfer" && "bg-amber-500/10 text-amber-700",
                      )}>
                        {op.operation}
                      </span>
                      <span className="tabular-nums">{Number(op.amountDot).toLocaleString()} DOT</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(op.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/tokens" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Full token history <ChevronRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <ActionLink to="/admin/members" icon={UserPlus} label="Manage members" sub="View all profiles, change roles" />
          <ActionLink to="/admin/wallets" icon={ArrowLeftRight} label="Admin transfer" sub="Move DOT between users" />
          <ActionLink to="/admin/tokens" icon={TrendingUp} label="Mint tokens" sub="Issue new DOT (up to 100B cap)" />
        </CardContent>
      </Card>
    </div>
  );
}

function Alert({ severity, title, body }: { severity: "critical" | "warn" | "ok" | "info"; title: string; body: string }) {
  const styles = {
    critical: "border-destructive/30 bg-destructive/5 text-destructive",
    warn: "border-amber-500/30 bg-amber-500/5 text-amber-700",
    ok: "border-primary/30 bg-primary/5 text-primary",
    info: "border-border bg-muted/30 text-muted-foreground",
  } as const;
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm", styles[severity])}>
      <div className="mt-0.5">
        {severity === "ok" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-xs opacity-80">{body}</div>
      </div>
    </div>
  );
}

function ActionLink({ to, icon: Icon, label, sub }: { to: string; icon: any; label: string; sub: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50">
      <div className="rounded-lg bg-muted/40 p-2 text-foreground group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
    </Link>
  );
}
