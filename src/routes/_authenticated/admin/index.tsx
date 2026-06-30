/**
 * /admin — Admin dashboard home.
 *
 * Layout: a single 4-column stat grid + a recent admin actions list
 * + a system health panel. All stats come from /api/admin/stats
 * and are rendered with safe defaults when fields are missing.
 *
 * The backend returns a flat shape:
 *   { users, bannedUsers, ventures, activeServices, activeJobs,
 *     transactions, activeFeatureFlags, roles:{total,superAdmins,admins},
 *     wallets:{totalBalance} }
 * Plus /api/admin/token-ops (recent ops list) — fetched separately.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Coins,
  FileText,
  ListChecks,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Operator Dashboard — DOT" }] }),
  component: AdminDashboardPage,
});

/** Backend response shape (flat). */
interface AdminStats {
  users: number;
  bannedUsers: number;
  ventures: number;
  activeServices: number;
  activeJobs: number;
  transactions: number;
  activeFeatureFlags: number;
  roles: { total: number; superAdmins: number; admins: number };
  wallets: { totalBalance: number | string };
}

interface TokenOp {
  id: string;
  operation?: string;
  type?: string;
  amountDot?: number | string;
  amount?: number | string;
  actorEmail?: string | null;
  actor?: string;
  actorId?: string;
  reason: string | null;
  createdAt?: string;
  created_at?: string;
}

const safeNum = (n: any): number => Number(n ?? 0);
const safeStr = (n: any): string => String(n ?? "0");

function AdminDashboardPage() {
  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => dotApi.get<AdminStats>("/api/admin/stats"),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const opsQ = useQuery({
    queryKey: ["admin", "token-ops", { limit: 8 }],
    queryFn: () =>
      dotApi.get<{ operations: TokenOp[]; ops?: TokenOp[]; items?: TokenOp[] }>(
        "/api/admin/token-ops?limit=8",
      ),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // CRITICAL: use safe defaults so a 200 with the wrong shape still renders.
  // Each helper returns 0 (not undefined) so .toLocaleString() never throws.
  const s = statsQ.data;
  const u = safeNum(s?.users);
  const banned = safeNum(s?.bannedUsers);
  const ventures = safeNum(s?.ventures);
  const services = safeNum(s?.activeServices);
  const jobs = safeNum(s?.activeJobs);
  const txs = safeNum(s?.transactions);
  const flags = safeNum(s?.activeFeatureFlags);
  const admins = safeNum(s?.roles?.admins);
  const superAdmins = safeNum(s?.roles?.superAdmins);
  const dotCirculation = safeNum(s?.wallets?.totalBalance);

  // Recent ops — backend may return {operations}, {ops}, {items}, or []
  const opsRaw = opsQ.data as any;
  const recentOps: TokenOp[] = Array.isArray(opsRaw)
    ? opsRaw
    : Array.isArray(opsRaw?.operations)
      ? opsRaw.operations
      : Array.isArray(opsRaw?.ops)
        ? opsRaw.ops
        : Array.isArray(opsRaw?.items)
          ? opsRaw.items
          : [];

  const isLoading = statsQ.isLoading || opsQ.isLoading;
  const isError = statsQ.isError || opsQ.isError;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Operator Console
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of platform health, users, and recent admin actions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            statsQ.refetch();
            opsQ.refetch();
          }}
          disabled={isLoading}
          className="shrink-0"
        >
          <RefreshCw
            className={`size-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Error banner — non-blocking */}
      {isError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
          Could not load stats. Click Refresh to retry.
        </div>
      )}

      {/* 8-card stat grid (1 col mobile, 2 col sm, 4 col xl) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Users total"
          value={u.toLocaleString()}
          sub={`${admins + superAdmins} admin staff`}
        />
        <StatCard
          icon={Shield}
          label="Admins"
          value={(admins + superAdmins).toLocaleString()}
          sub={`${admins} admin · ${superAdmins} super_admin`}
        />
        <StatCard
          icon={FileText}
          label="Ventures"
          value={ventures.toLocaleString()}
          sub="all statuses"
        />
        <StatCard
          icon={Coins}
          label="DOT in circulation"
          value={dotCirculation.toLocaleString()}
          sub="across all wallets"
        />
        <StatCard
          icon={Users}
          label="Communities"
          value={"—"}
          sub="view Communities page"
        />
        <StatCard
          icon={TrendingUp}
          label="Challenges"
          value={"—"}
          sub="view Challenges page"
        />
        <StatCard
          icon={Activity}
          label="Token ops"
          value={txs.toLocaleString()}
          sub="all-time transactions"
        />
        <StatCard
          icon={AlertTriangle}
          label="Banned users"
          value={banned.toLocaleString()}
          sub="currently banned"
        />
      </div>

      {/* Quick links row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink to="/admin/members" icon={Users} label="Members" desc="Manage roles & bans" />
        <QuickLink to="/admin/wallets" icon={Wallet} label="Wallets" desc="Transfer DOT between users" />
        <QuickLink to="/admin/tokens" icon={Coins} label="Tokens" desc="Mint, burn, view supply" />
        <QuickLink to="/admin/permissions" icon={Shield} label="Permissions" desc="Role + permission matrix" />
      </div>

      {/* Two-column row: recent activity + system health */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
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
            {recentOps.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No admin actions yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentOps.map((op) => {
                  const opType = op.operation || op.type || "transfer";
                  const opAmount = op.amountDot ?? op.amount ?? "0";
                  const opActor = op.actorEmail || op.actor || "system";
                  const opWhen = op.createdAt || op.created_at;
                  return (
                    <li
                      key={op.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                            opType === "mint"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : opType === "burn"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {opType === "mint" ? (
                            <Coins className="size-3.5" />
                          ) : opType === "burn" ? (
                            <AlertTriangle className="size-3.5" />
                          ) : (
                            <ArrowRight className="size-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium capitalize">
                            {opType.replace(/_/g, " ")}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            by {opActor}
                            {op.reason ? ` — ${op.reason}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm">{safeStr(opAmount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {opWhen
                            ? new Date(opWhen).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="size-4" />
              System health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <HealthRow label="Active services" value={services} />
            <HealthRow label="Active jobs" value={jobs} />
            <HealthRow label="Transactions" value={txs} />
            <HealthRow label="Feature flags on" value={flags} />
            <HealthRow label="Roles granted" value={safeNum(s?.roles?.total)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────── Sub-components ────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums sm:text-2xl">
              {value}
            </p>
            {sub && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {sub}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc?: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full transition-colors hover:bg-muted/40 hover:border-primary/40">
        <CardContent className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{label}</p>
            {desc && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {desc}
              </p>
            )}
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

function HealthRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}
