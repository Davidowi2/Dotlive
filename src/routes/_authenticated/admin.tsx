import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Shield,
  ShieldCheck,
  ShieldMinus,
  Coins,
  Plus,
  BookOpen,
  CalendarCheck,
  Trophy,
  History,
  Settings2,
  Globe,
  Wallet,
  Users,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDot, formatNaira, ROLE_LABELS, type AppRole } from "@/lib/constants";
import { elevateUser, revokeAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  listAdminUsers,
  getAdminUser,
  adjustBalance,
  banUser,
  unbanUser,
  getAuditLog,
  listFeedPosts,
  deleteFeedPost,
} from "@/api/admin";
import {
  listAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
} from "@/api/adminAcademy";
import { getPayments } from "@/api/payments";
import type { AdminCourse } from "@/api/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DOT" }] }),
  component: AdminPage,
});

/* ------------------------------------------------------------------ *
 *  TOOL ITEM CONFIG
 * ------------------------------------------------------------------ */

interface ToolItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Shield;
  accent: "default" | "secondary" | "destructive" | "outline";
  requiresSuperAdmin?: boolean;
  action?: () => void;
  href?: string;
}

function ToolCard({ item }: { item: ToolItem }) {
  const Icon = item.icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold">{item.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
          </div>
        </div>
        {item.requiresSuperAdmin && (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
            Super Admin
          </Badge>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        {item.href && (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={item.href}>Open</a>
          </Button>
        )}
        {item.action && (
          <Button
            variant="hero"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              item.action?.();
            }}
          >
            Launch
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  MEMBERS TAB
 * ------------------------------------------------------------------ */

function MembersTab() {
  const qc = useQueryClient();
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const res = await listAdminUsers({ limit: 200 });
      const map = new Map((await Promise.all(res.users.map((u) => getAdminUser(u.id)))).map((u) => [u.id, u.balance ?? u.wallet?.balance ?? 0]));
      return res.users.map((u) => ({ ...u, balance: Number(map.get(u.id) ?? 0) }));
    },
  });

  async function adjustBalance_(id: string, delta: number, label: string) {
    if (!target) return;
    setBusy(true);
    try {
      await adjustBalance(id, delta, label);
      toast.success("Balance updated");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      setTarget(null);
      setAmount(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Loader2 className="mt-6 size-6 animate-spin text-primary" />;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total members" value={String(members.length)} accent="default" />
        <Stat label="Active today" value="—" accent="default" />
        <Stat label="Banned" value={String(members.filter((m) => m.banned).length)} accent="destructive" />
        <Stat label="Total wallet" value={formatDot(members.reduce((a, m) => a + (Number(m.balance) || 0), 0))} accent="default" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Members</h3>
          <p className="text-sm text-muted-foreground">
            Adjust balances or ban users. All changes are audit-logged.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium text-right">Balance</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="p-4">
                    <div className="font-medium">{m.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="p-4 text-right font-mono">{formatDot(Number(m.balance))} DOT</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTarget({ id: m.id, name: m.name ?? m.email })}
                      >
                        <Coins className="size-4" /> Adjust
                      </Button>
                      {!m.banned ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            await banUser(m.id, "Banned by admin");
                            toast.success("User banned");
                            qc.invalidateQueries({ queryKey: ["admin-members"] });
                          }}
                        >
                          Ban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await unbanUser(m.id, "Unbanned by admin");
                            toast.success("User unbanned");
                            qc.invalidateQueries({ queryKey: ["admin-members"] });
                          }}
                        >
                          Unban
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust balance — {target?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (DOT)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Use unit amount: 100 = 100 DOT</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
            <Button variant="hero" onClick={() => target && adjustBalance_(target.id, amount, "Admin Adjustment")} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  FINANCE TAB
 * ------------------------------------------------------------------ */

function FinanceTab() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const rows = await getPayments();
      const userIds = [...new Set(rows.map((p) => p.userId))];
      const profiles: Record<string, { name?: string; email: string }> = {};
      await Promise.all(
        userIds.map(async (id) => {
          try {
            const u = await getAdminUser(id);
            profiles[id] = { name: u.name ?? undefined, email: u.email };
          } catch {
            profiles[id] = { email: id };
          }
        }),
      );
      return rows.map((r) => ({ ...r, profile: profiles[r.userId] }));
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

  if (isLoading) return <Loader2 className="mt-6 size-6 animate-spin text-primary" />;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Successful payments" value={String(totals.count)} accent="default" />
        <Stat label="DOT funded" value={`${formatDot(totals.dot)} DOT`} accent="default" />
        <Stat label="Naira revenue" value={formatNaira(totals.naira)} accent="secondary" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Payment history</h3>
          <p className="text-sm text-muted-foreground">Verified and pending transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">DOT</th>
                <th className="p-4 font-medium">NGN</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Channel</th>
                <th className="p-4 font-medium">Reference</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-4">
                    <div className="font-medium">{p.profile?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.profile?.email}</div>
                  </td>
                  <td className="p-4">{formatDot(Number(p.dot_amount))}</td>
                  <td className="p-4">{formatNaira(Number(p.naira_amount))}</td>
                  <td className="p-4">
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
                  </td>
                  <td className="p-4 text-muted-foreground">{p.channel ?? "—"}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{p.reference}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Wallets are credited after Paystack verifies the payment. To credit or refund manually,
        use the Members tab.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  CONTENT TAB
 * ------------------------------------------------------------------ */

function ContentTab() {
  const qc = useQueryClient();

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-3">
      <CreateCard
        title="New course"
        icon={BookOpen}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", textarea: true },
          { key: "whop_url", label: "Whop URL" },
          { key: "whop_product_id", label: "Product ID" },
          { key: "category", label: "Category" },
          { key: "dot_reward", label: "DOT reward", number: true },
          { key: "vantage_boost", label: "Vantage boost", number: true },
        ]}
        onSubmit={async (v) => {
          await createAdminCourse({
            title: v.title,
            description: v.description,
            whopUrl: v.whop_url,
            whopProductId: v.whop_product_id,
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
          { key: "whop_url", label: "Product URL" },
          { key: "whop_product_id", label: "Product ID" },
          { key: "capacity", label: "Capacity", number: true },
        ]}
        onSubmit={async (v) => {
          await dotApi.post("/api/admin/events", {
            title: v.title,
            description: v.description,
            speaker: v.speaker,
            eventDate: v.event_date ? new Date(v.event_date).toISOString() : null,
            dotCost: Number(v.dot_cost) || 0,
            whopUrl: v.whop_url,
            whopProductId: v.whop_product_id,
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
          { key: "prize", label: "Prize pool" },
          { key: "end_date", label: "Deadline", type: "datetime-local" },
        ]}
        onSubmit={async (v) => {
          await dotApi.post("/api/admin/pitchathons", {
            title: v.title,
            description: v.description,
            prizePoolDot: v.prize,
            applicationDeadline: v.end_date ? new Date(v.end_date).toISOString() : null,
            status: "open",
          });
          qc.invalidateQueries({ queryKey: ["pitchathons"] });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  SYSTEMS TAB
 * ------------------------------------------------------------------ */

function SystemsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await dotApi.get("/api/stats")) as Record<string, unknown>,
    staleTime: 30_000,
  });

  if (isLoading) return <Loader2 className="mt-6 size-6 animate-spin text-primary" />;

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={String((stats?.users as number) ?? 0)} sub={`${String((stats?.bannedUsers as number) ?? 0)} banned`} accent="default" />
        <Stat label="Ventures" value={String((stats?.ventures as number) ?? 0)} sub={`${String((stats?.activeServices as number) ?? 0)} active`} />
        <Stat label="Transactions" value={String((stats?.transactions as number) ?? 0)} sub={`${formatDot((stats?.wallets?.totalBalance as number) ?? 0)} balance`} accent="secondary" />
        <Stat label="Communities" value="—" sub="Coming soon" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  MODERATION TAB
 * ------------------------------------------------------------------ */

function ModerationTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-moderation-queue"],
    queryFn: async () => (await dotApi.get("/api/admin/queue")) as Record<string, unknown>,
    staleTime: 60_000,
  });
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-moderation-reports"],
    queryFn: async () => (await dotApi.get("/api/admin/queue/reports")) as { reports: any[]; nextCursor: string | null },
    staleTime: 30_000,
  });

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open reports" value={String((data?.open as number) ?? 0)} sub="Needs action" accent="destructive" />
        <Stat label="In review" value={String((data?.inReview as number) ?? 0)} sub="Assigned" accent="secondary" />
        <Stat label="Resolved today" value={String((data?.resolvedToday as number) ?? 0)} sub="Audited" accent="default" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Report queue</h3>
          <p className="text-sm text-muted-foreground">Latest community reports, newest first.</p>
        </div>
        {reportsLoading ? (
          <div className="p-4"><Loader2 className="size-5 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No reports yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium">Target</th>
                  <th className="p-4 font-medium">Reason</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="p-4 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="font-medium">{r.targetType}</div>
                      <div className="text-xs text-muted-foreground">{r.targetId}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{r.reason || "—"}</td>
                    <td className="p-4">
                      <Badge variant={r.status === "open" ? "destructive" : r.status === "resolved" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  ROLES TAB
 * ------------------------------------------------------------------ */

function RolesTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const elevate = useServerFn(elevateUser);
  const revoke = useServerFn(revokeAdmin);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-roles-members"],
    queryFn: async () => {
      const res = await listAdminUsers({ limit: 200 });
      const roles = await Promise.all(res.users.map(u => getUserRolesInfo(u.id)));
      const roleMap = new Map(roles.map(r => [r.user.id, r.roles]));
      return res.users.map(u => ({ ...u, roles: roleMap.get(u.id) ?? [] }));
    },
  });

  const { data: audit = [] } = useQuery({
    queryKey: ["role-audit-log"],
    queryFn: async () => (await getAuditLog(200)) as unknown[],
  });

  async function doElevate(id: string, role: AppRole) {
    setBusyId(id);
    try {
      await elevate({ data: { targetUserId: id, newRole: role } });
      toast.success(`Granted ${ROLE_LABELS[role]}`);
      await refresh?.();
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
      await refresh?.();
      qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
      qc.invalidateQueries({ queryKey: ["role-audit-log"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function doBan(id: string) {
    setBusyId(id);
    try {
      await banUser(id, "Banned by admin");
      toast.success("User banned");
      qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function doUnban(id: string) {
    setBusyId(id);
    try {
      await unbanUser(id, "Unbanned by admin");
      toast.success("User unbanned");
      qc.invalidateQueries({ queryKey: ["admin-roles-members"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <Loader2 className="mt-6 size-6 animate-spin text-primary" />;

  return (
    <div className="mt-4 space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Admin assignment</h3>
          <p className="text-sm text-muted-foreground">
            Grant or revoke admin and super_admin access. You cannot change your own role.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Roles</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => {
                const isSelf = m.id === user?.id;
                const isMemberAdmin = m.roles.includes("admin");
                const isMemberSuper = m.roles.includes("super_admin");
                return (
                  <tr key={m.id}>
                    <td className="p-4">
                      <div className="font-medium">{m.name ?? "—"}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{m.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {m.roles.length === 0 && <span className="text-muted-foreground">—</span>}
                        {m.roles.map((r) => (
                          <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"}>
                            {ROLE_LABELS[r] ?? r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">Your account</span>
                        ) : (
                          <>
                            {!isMemberSuper && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === m.id}
                                onClick={() => doElevate(m.id, "super_admin")}
                              >
                                <ShieldCheck className="size-4" /> Super Admin
                              </Button>
                            )}
                            {!isMemberAdmin && !isMemberSuper && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === m.id}
                                onClick={() => doElevate(m.id, "admin")}
                              >
                                <ShieldCheck className="size-4" /> Make Admin
                              </Button>
                            )}
                            {isMemberSuper && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === m.id}
                                onClick={() => doRevoke(m.id, "super_admin")}
                              >
                                <ShieldMinus className="size-4" /> Revoke Super
                              </Button>
                            )}
                            {isMemberAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === m.id}
                                onClick={() => doRevoke(m.id, "admin")}
                              >
                                <ShieldMinus className="size-4" /> Revoke Admin
                              </Button>
                            )}
                            {!m.banned ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={busyId === m.id}
                                onClick={() => doBan(m.id)}
                              >
                                Ban
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === m.id}
                                onClick={() => doUnban(m.id)}
                              >
                                Unban
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <History className="size-5 text-primary" />
          <h3 className="font-display font-semibold">Role audit log</h3>
        </div>
        {audit.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No role changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">When</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td className="p-4 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={a.action === "revoked" ? "destructive" : "secondary"}>{a.action}</Badge>
                    </td>
                    <td className="p-4">{a.new_role}</td>
                    <td className="p-4 text-muted-foreground">{a.previous_role ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  SHARED UI HELPERS
 * ------------------------------------------------------------------ */

function Stat({ label, value, accent = "default" }: { label: string; value: string; accent?: "default" | "secondary" | "destructive" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
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
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>
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

/* ------------------------------------------------------------------ *
 *  MAIN ADMIN PAGE
 * ------------------------------------------------------------------ */

function AdminPage() {
  const { roles, refresh } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="rounded-2xl border border-border bg-card p-8">
            <Shield className="mx-auto size-12 text-muted-foreground" />
            <h1 className="mt-4 font-display text-2xl font-bold">Platform access restricted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You need admin or super_admin permissions to access this area.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Command center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage members, finance, content, systems, moderation, and permissions.
        </p>
      </div>
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabIcon icon={Users} value="members" label="Members" />
          <TabIcon icon={Wallet} value="finance" label="Finance" />
          <TabIcon icon={Globe} value="content" label="Content" />
          <TabIcon icon={Settings2} value="systems" label="Systems" />
          <TabIcon icon={Activity} value="moderation" label="Moderation" />
          {isSuperAdmin && <TabIcon icon={Shield} value="roles" label="Roles & Audit" requiresSuperAdmin />}
        </TabsList>
        <TabsContent value="members"><MembersTab /></TabsContent>
        <TabsContent value="finance"><FinanceTab /></TabsContent>
        <TabsContent value="content"><ContentTab /></TabsContent>
        <TabsContent value="systems"><SystemsTab /></TabsContent>
        <TabsContent value="moderation"><ModerationTab /></TabsContent>
        {isSuperAdmin && <TabsContent value="roles"><RolesTab /></TabsContent>}
      </Tabs>
    </AppShell>
  );
}

function TabIcon({
  icon: Icon,
  value,
  label,
  requiresSuperAdmin,
}: {
  icon: typeof Shield;
  value: string;
  label: string;
  requiresSuperAdmin?: boolean;
}) {
  return (
    <TabsTrigger
      value={value}
      className="rounded-xl border border-transparent bg-muted/50 px-4 py-2 text-sm transition-all data-[state=active]:border-primary/20 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none"
    >
      <Icon className="mr-2 size-4" />
      {label}
      {requiresSuperAdmin && (
        <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
          Super
        </span>
      )}
    </TabsTrigger>
  );
}
