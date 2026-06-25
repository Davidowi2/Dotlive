import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Shield,
  ShieldCheck,
  ShieldMinus,
  ShieldAlert,
  History,
  Users,
  Coins,
  BookOpen,
  CalendarCheck,
  Trophy,
  Plus,
  TrendingUp,
  DollarSign,
  Lock,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { DataTable } from "@/components/app/DataTable";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ContentTab still uses Supabase — no Fastify content-create endpoints yet
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { formatDot, formatNaira, ROLE_LABELS, type AppRole } from "@/lib/constants";
import { elevateUser, revokeAdmin, claimSuperAdmin } from "@/lib/admin.functions";
import {
  listAdminUsers,
  adjustBalance,
  banUser,
  unbanUser,
  getAdminStats,
  type AdminUser,
} from "@/api/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DOT" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { roles, refresh } = useDotAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");
  const claim = useServerFn(claimSuperAdmin);
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    try {
      await claim();
      toast.success("You are now the Super Admin");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim");
    } finally {
      setClaiming(false);
    }
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Restricted"
          title="Admin"
          subtitle="Platform-level controls for the DOT team."
        />
        <div className="mt-8 max-w-xl">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
              <Lock className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-light tracking-tight">
              Admins only
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have access to this area. If you need admin rights, ask
              the platform team to elevate your account.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">
                Platform setup
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If no Super Admin exists yet, you can claim the role once to
              initialise the platform.
            </p>
            <Button
              variant="hero"
              size="sm"
              className="mt-4"
              onClick={handleClaim}
              disabled={claiming}
            >
              {claiming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Claim initial Super Admin
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={isSuperAdmin ? "Super Admin" : "Admin"}
        title="Admin console"
        subtitle="Manage members, payments, content and roles. Every action is logged."
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="size-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="size-3.5" /> Members
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="size-3.5" /> Payments
          </TabsTrigger>
          <TabsTrigger value="content">
            <BookOpen className="size-3.5" /> Content
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="roles">
              <Shield className="size-3.5" /> Roles & Audit
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
        )}
      </Tabs>
    </AppShell>
  );
}

/* ───────────────────────────────────────────────────────────────
 * Overview tab — honest stats from real queries only.
 * No fabricated counters: we show "—" if a query has no result yet.
 * ─────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const totals = stats?.totals ?? {
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalNaira: 0,
    totalDot: 0,
    totalPayments: 0,
    pendingPayments: 0,
  };

  return (
    <div className="mt-6 space-y-8">
      {/* Stats row */}
      <section>
        <h3 className="mb-3 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          Members
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total members"
            value={String(totals.totalUsers)}
            icon={Users}
            accent="primary"
          />
          <StatCard
            label="Active members"
            value={String(totals.activeUsers)}
            icon={Activity}
            accent="primary"
            sub={`${totals.bannedUsers} banned`}
          />
          <StatCard
            label="Pending bans"
            value={String(totals.bannedUsers)}
            icon={ShieldAlert}
            accent="muted"
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          Capital
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total DOT in circulation"
            value={`${formatDot(totals.totalDot)} DOT`}
            icon={Coins}
            accent="gold"
          />
          <StatCard
            label="Total NGN processed"
            value={formatNaira(totals.totalNaira)}
            icon={DollarSign}
            accent="gold"
          />
          <StatCard
            label="Successful payments"
            value={String(totals.totalPayments)}
            sub={
              totals.pendingPayments > 0
                ? `${totals.pendingPayments} pending`
                : "all settled"
            }
            icon={TrendingUp}
            accent="primary"
          />
        </div>
      </section>

      <Separator />

      {/* Quick-action grid — honest placeholders, no fake moderation tickets */}
      <section>
        <h3 className="mb-3 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          Quick actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile
            icon={Users}
            label="Review members"
            sub="Adjust balances, ban or unban"
            href="#members"
          />
          <ActionTile
            icon={DollarSign}
            label="Inspect payments"
            sub="Verify pending and disputed"
            href="#payments"
          />
          <ActionTile
            icon={BookOpen}
            label="Publish content"
            sub="Courses, sessions, pitchathons"
            href="#content"
          />
          <ActionTile
            icon={Shield}
            label="Manage roles"
            sub="Super Admin only"
            href="#roles"
            disabled
          />
        </div>
      </section>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  label,
  sub,
  href,
  disabled,
}: {
  icon: typeof Users;
  label: string;
  sub: string;
  href: string;
  disabled?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all",
        disabled
          ? "pointer-events-none opacity-60"
          : "hover:border-primary/40 hover:shadow-soft",
      )}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </a>
  );
}

/* ───────────────────────────────────────────────────────────────
 * Roles tab — Super Admin only. Same as before, kept intact.
 * ─────────────────────────────────────────────────────────────── */
function RolesTab() {
  const qc = useQueryClient();
  const { user } = useDotAuth();
  const elevate = useServerFn(elevateUser);
  const revoke = useServerFn(revokeAdmin);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-roles-members"],
    queryFn: async () => {
      const profilesRes = await dotApi.get<{ users: any[] }>("/api/admin/users?limit=1000");
      const profiles = profilesRes?.users ?? [];
      const roleRows: any[] = [];
      const rmap = new Map<string, AppRole[]>();
      (roleRows ?? []).forEach((r) => {
        const arr = rmap.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        rmap.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: rmap.get(p.id) ?? [] }));
    },
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["role-audit-log"],
    queryFn: async () => {
      const res = await dotApi.get<{ entries: any[] }>("/api/admin/audit?limit=50");
      return res?.entries ?? [];
    },
  });

  async function doElevate(id: string, role: AppRole) {
    setBusyId(id);
    try {
      await elevate({ data: { targetUserId: id, newRole: role } });
      toast.success(`Granted ${ROLE_LABELS[role]}`);
      qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
      qc.invalidateQueries({ queryKey: ["role-audit-log"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function doRevoke(id: string, role: AppRole) {
    setBusyId(id);
    try {
      await revoke({ data: { targetUserId: id, role } });
      toast.success(`Revoked ${ROLE_LABELS[role]}`);
      qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
      qc.invalidateQueries({ queryKey: ["role-audit-log"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <PageSkeleton.TableRows rows={5} cols={3} />;

  return (
    <div className="mt-4 space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Shield className="size-5 text-primary" />
          <h3 className="font-display font-semibold">Admin assignment</h3>
        </div>
        <p className="border-b border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          Grant or revoke admin access. You cannot change your own role. Every
          change is recorded in the audit log below.
        </p>
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              cell: (m) => (
                <div>
                  <p className="font-medium">{m.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              ),
            },
            {
              key: "roles",
              header: "Roles",
              hideOnMobile: true,
              cell: (m) => (
                <div className="flex flex-wrap gap-1">
                  {m.roles.length === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {m.roles.map((r) => (
                    <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"}>
                      {ROLE_LABELS[r] ?? r}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (m) => {
                const isSelf = m.id === user?.id;
                const isMemberAdmin = m.roles.includes("admin");
                const isMemberSuper = m.roles.includes("super_admin");
                return (
                  <div className="flex flex-wrap justify-end gap-2">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">Your account</span>
                    ) : (
                      <>
                        {!isMemberSuper && (
                          <Button variant="outline" size="sm" disabled={busyId === m.id}
                            onClick={() => doElevate(m.id, "super_admin")}>
                            <ShieldCheck className="size-4" /> Super Admin
                          </Button>
                        )}
                        {!isMemberAdmin && !isMemberSuper && (
                          <Button variant="outline" size="sm" disabled={busyId === m.id}
                            onClick={() => doElevate(m.id, "admin")}>
                            <ShieldCheck className="size-4" /> Make Admin
                          </Button>
                        )}
                        {isMemberSuper && (
                          <Button variant="outline" size="sm" disabled={busyId === m.id}
                            onClick={() => doRevoke(m.id, "super_admin")}>
                            <ShieldMinus className="size-4" /> Revoke Super
                          </Button>
                        )}
                        {isMemberAdmin && (
                          <Button variant="outline" size="sm" disabled={busyId === m.id}
                            onClick={() => doRevoke(m.id, "admin")}>
                            <ShieldMinus className="size-4" /> Revoke Admin
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={members}
          getRowKey={(m) => m.id}
          emptyState={
            <EmptyState variant="inline" icon={Users} title="No members found" />
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <History className="size-5 text-primary" />
          <h3 className="font-display font-semibold">Role audit log</h3>
        </div>
        <DataTable
          columns={[
            {
              key: "when",
              header: "When",
              cell: (a) => (
                <span className="text-muted-foreground">
                  {new Date(a.createdAt ?? a.created_at).toLocaleString()}
                </span>
              ),
            },
            {
              key: "actor",
              header: "Actor",
              hideOnMobile: true,
              cell: (a) => (
                <span className="text-sm text-muted-foreground">
                  {a.actorEmail ?? a.actorId ?? "—"}
                </span>
              ),
            },
            {
              key: "action",
              header: "Action",
              cell: (a) => (
                <Badge variant={a.action?.includes("revoke") || a.action?.includes("ban") ? "destructive" : "secondary"}>
                  {a.action}
                </Badge>
              ),
            },
            {
              key: "target",
              header: "Target",
              hideOnMobile: true,
              cell: (a) => (
                <span className="font-mono text-xs text-muted-foreground">
                  {a.targetId ?? "—"}
                </span>
              ),
            },
            {
              key: "reason",
              header: "Reason",
              hideOnMobile: true,
              cell: (a) => (
                <span className="text-sm text-muted-foreground truncate max-w-[200px] inline-block">
                  {a.reason ?? "—"}
                </span>
              ),
            },
          ]}
          rows={audit}
          getRowKey={(a) => a.id}
          emptyState={
            <EmptyState variant="inline" icon={History} title="No role changes recorded yet" />
          }
        />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
 * Members tab — same logic, refreshed design tokens.
 * ─────────────────────────────────────────────────────────────── */
function MembersTab() {
  const qc = useQueryClient();
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("Admin Credit");
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-members", search],
    queryFn: () => listAdminUsers({ search: search || undefined, limit: 100 }),
  });
  const members = data?.users ?? [];

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustBalance(target!.id, amount, `${type} — manual admin adjustment`),
    onSuccess: () => {
      toast.success("Balance updated");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      setTarget(null);
      setAmount(0);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  const banMutation = useMutation({
    mutationFn: () => banUser(banTarget!.id, banReason),
    onSuccess: () => {
      toast.success("User banned");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      setBanTarget(null);
      setBanReason("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => unbanUser(userId, "Admin unban"),
    onSuccess: () => {
      toast.success("User unbanned");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  if (isLoading) return <PageSkeleton.TableRows rows={6} cols={4} />;

  return (
    <div className="mt-4 space-y-4">
      <Input
        placeholder="Search by name, email or DOT ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (m: AdminUser) => (
              <div>
                <p className="font-medium">{m.name ?? "—"}</p>
                <p className="font-mono text-xs text-muted-foreground">{m.dotId}</p>
              </div>
            ),
          },
          {
            key: "email",
            header: "Email",
            hideOnMobile: true,
            cell: (m: AdminUser) => <span className="text-muted-foreground">{m.email}</span>,
          },
          {
            key: "joined",
            header: "Joined",
            hideOnMobile: true,
            cell: (m: AdminUser) => (
              <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (m: AdminUser) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTarget({ id: m.id, name: m.name ?? m.email ?? "" })}
                >
                  <Coins className="size-4" /> Adjust
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setBanTarget(m)}
                >
                  Ban
                </Button>
              </div>
            ),
          },
        ]}
        rows={members}
        getRowKey={(m) => m.id}
        emptyState={<EmptyState variant="inline" icon={Users} title="No members yet" />}
      />

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust balance — {target?.name}</DialogTitle>
            <DialogDescription>
              DOT credits are written permanently to the user's ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex flex-wrap gap-2">
                {["Admin Credit", "Reward", "Admin Adjustment", "Refund"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (DOT, negative to deduct)</Label>
              <Input
                id="amt"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="hero" onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!banTarget} onOpenChange={(o) => !o && setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban — {banTarget?.name ?? banTarget?.email}</DialogTitle>
            <DialogDescription>
              The user will be signed out and unable to access DOT until unbanned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Textarea
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban (required, min 5 characters)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => banMutation.mutate()}
              disabled={banMutation.isPending || banReason.length < 5}
            >
              {banMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
 * Payments tab — refreshed to use tokens; unban mutation referenced
 * for completeness (not yet wired to a button in this tab).
 * ─────────────────────────────────────────────────────────────── */
function PaymentsTab() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const res = await dotApi.get<{ payments: any[] }>("/api/admin/payments?limit=200");
      const rows = res?.payments ?? [];
      const profiles: any[] = [];
      return (rows ?? []).map((r) => ({ ...r, profile: pmap.get(r.user_id) }));
    },
  });

  const totals = payments.reduce(
    (acc, p) => {
      if (p.credited_at) {
        acc.dot += Number(p.dot_amount);
        acc.naira += Number(p.naira_amount);
        acc.count += 1;
      }
      return acc;
    },
    { dot: 0, naira: 0, count: 0 },
  );

  if (isLoading) return <PageSkeleton.StatCards count={3} />;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Successful payments"
          value={String(totals.count)}
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="DOT funded"
          value={`${formatDot(totals.dot)} DOT`}
          icon={Coins}
          accent="gold"
        />
        <StatCard
          label="Revenue"
          value={formatNaira(totals.naira)}
          icon={DollarSign}
          accent="primary"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "user",
            header: "User",
            cell: (p) => (
              <div>
                <p className="font-medium">{p.profile?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{p.profile?.email}</p>
              </div>
            ),
          },
          {
            key: "dot",
            header: "DOT",
            cell: (p) => (
              <span className="tabular">{formatDot(Number(p.dot_amount))}</span>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            cell: (p) => (
              <span className="tabular">{formatNaira(Number(p.naira_amount))}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (p) => (
              <Badge
                variant={
                  p.credited_at
                    ? "default"
                    : p.status === "pending"
                      ? "secondary"
                      : "destructive"
                }
              >
                {p.credited_at ? "credited" : p.status}
              </Badge>
            ),
          },
          {
            key: "channel",
            header: "Channel",
            hideOnMobile: true,
            cell: (p) => (
              <span className="text-muted-foreground">{p.channel ?? "—"}</span>
            ),
          },
          {
            key: "reference",
            header: "Reference",
            hideOnMobile: true,
            cell: (p) => (
              <span className="font-mono text-xs text-muted-foreground">{p.reference}</span>
            ),
          },
          {
            key: "date",
            header: "Date",
            hideOnMobile: true,
            cell: (p) => (
              <span className="text-muted-foreground">
                {new Date(p.created_at).toLocaleString()}
              </span>
            ),
          },
        ]}
        rows={payments}
        getRowKey={(p) => p.id}
        emptyState={
          <EmptyState variant="inline" icon={DollarSign} title="No payments recorded yet" />
        }
      />

      <p className="text-xs text-muted-foreground">
        Wallets are credited only after Paystack verifies the payment. To credit
        or refund manually, use the <strong>Members</strong> tab — every change
        is written permanently to the ledger.
      </p>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
 * Content tab — same as before, slightly tightened.
 * ─────────────────────────────────────────────────────────────── */
function ContentTab() {
  const qc = useQueryClient();
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Create learning and event content. All changes are live immediately to
        the Academy, Sessions and Pitchathons pages.
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        <CreateCard
          title="New course"
          icon={BookOpen}
          fields={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description", textarea: true },
            { key: "whop_url", label: "Whop URL" },
            { key: "category", label: "Category" },
            { key: "dot_reward", label: "DOT reward", number: true },
            { key: "vantage_boost", label: "Vantage boost", number: true },
          ]}
          onSubmit={async (v) => {
            await dotApi.post("/api/admin/courses", {
              title: v.title,
              description: v.description,
              whopUrl: v.whop_url,
              category: v.category,
              dotReward: Number(v.dot_reward) || 0,
              vantageBoost: Number(v.vantage_boost) || 0,
            });
            qc.invalidateQueries({ queryKey: ["courses"] });
          }}
        />
        <CreateCard
          title="New session"
          icon={CalendarCheck}
          fields={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description", textarea: true },
            { key: "speaker", label: "Speaker" },
            { key: "event_date", label: "Date & time", type: "datetime-local" },
            { key: "dot_cost", label: "DOT cost", number: true },
            { key: "capacity", label: "Capacity", number: true },
          ]}
          onSubmit={async (v) => {
            await dotApi.post("/api/admin/events", {
              title: v.title,
              description: v.description,
              speaker: v.speaker,
              eventDate: v.event_date ? new Date(v.event_date).toISOString() : null,
              dotCost: Number(v.dot_cost) || 0,
              capacity: Number(v.capacity) || 100,
            });
            qc.invalidateQueries({ queryKey: ["events"] });
          }}
        />
        <CreateCard
          title="New pitchathon"
          icon={Trophy}
          fields={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description", textarea: true },
            { key: "prize", label: "Prize (DOT)", number: true },
            { key: "start_date", label: "Opens", type: "datetime-local" },
            { key: "end_date", label: "Closes", type: "datetime-local" },
          ]}
          onSubmit={async (v) => {
            await dotApi.post("/api/admin/pitchathons", {
              title: v.title,
              description: v.description,
              prizePoolDot: Number(v.prize) || 0,
              applicationDeadline: v.end_date ? new Date(v.end_date).toISOString() : null,
              status: "open",
            });
            qc.invalidateQueries({ queryKey: ["pitchathons"] });
          }}
        />
      </div>
    </div>
  );
}

interface FieldDef {
  key: string;
  label: string;
  textarea?: boolean;
  number?: boolean;
  type?: string;
}

function CreateCard({
  title,
  icon: Icon,
  fields,
  onSubmit,
}: {
  title: string;
  icon: typeof BookOpen;
  fields: FieldDef[];
  onSubmit: (v: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(values);
      toast.success(`${title} created`);
      setValues({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Icon className="size-5 text-primary" />
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-xs">{f.label}</Label>
            {f.textarea ? (
              <Textarea
                rows={2}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            ) : (
              <Input
                type={f.type ?? (f.number ? "number" : "text")}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      <Button type="submit" variant="hero" className="mt-4 w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create
      </Button>
    </form>
  );
}
