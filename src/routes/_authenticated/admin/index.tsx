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
  head: () => ({ meta: [{ title: "Admin Dashboard — DOT" }] }),
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of platform health, users, and recent admin actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              statsQ.refetch();
              opsQ.refetch();
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error banner — non-blocking */}
      {isError && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200">
          Could not load stats. Pull-to-refresh or click Refresh to retry.
        </div>
      )}

      {/* 8-card stat grid (2 cols on mobile, 4 on lg) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Users total"
          value={u.toLocaleString()}
          sub={`${admins + superAdmins} admin · ${superAdmins} super`}
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
          sub="see Communities page"
        />
        <StatCard
          icon={TrendingUp}
          label="Challenges"
          value={"—"}
          sub="see Challenges page"
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink to="/admin/members" icon={Users} label="Members" />
        <QuickLink to="/admin/wallets" icon={Wallet} label="Wallets" />
        <QuickLink to="/admin/tokens" icon={Coins} label="Tokens" />
        <QuickLink to="/admin/permissions" icon={Shield} label="Permissions" />
      </div>

      {/* Two-column row: recent activity + system health */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {value}
            </p>
            {sub && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {sub}
              </p>
            )}
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
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
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link to={to}>
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">Manage →</p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
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
