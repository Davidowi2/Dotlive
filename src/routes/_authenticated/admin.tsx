import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Shield,
  Coins,
  Plus,
  BookOpen,
  CalendarCheck,
  Trophy,
  ShieldCheck,
  ShieldMinus,
  History,
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

function AdminPage() {
  const { roles, refresh } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isSuperAdmin = roles.includes("super_admin");

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <Shield className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Platform setup required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin access is restricted. Contact a super_admin to grant you access.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage members, credits and platform content.
      </p>
      <Tabs defaultValue="members" className="mt-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="roles">Roles & Audit</TabsTrigger>}
        </TabsList>
        <TabsContent value="members">
          <MembersTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
        <TabsContent value="systems">
          <SystemsTab />
        </TabsContent>
        <TabsContent value="moderation">
          <ModerationTab />
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
    queryFn: async () => {
      const res = await getAuditLog(200);
      return res as unknown[];
    },
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
            Grant or revoke admin access. You cannot change your own role.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-4 font-medium">Name</th>
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
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
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
                  <td className="p-4">
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
                              <ShieldCheck className="size-4" /> Make Super Admin
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <History className="size-5 text-primary" />
          <h3 className="font-display font-semibold">Role audit log</h3>
        </div>
        {audit.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No role changes recorded yet.</p>
        ) : (
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
                  <td className="p-4 text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <Badge variant={a.action === "revoked" ? "destructive" : "secondary"}>
                      {a.action}
                    </Badge>
                  </td>
                  <td className="p-4">{a.new_role}</td>
                  <td className="p-4 text-muted-foreground">{a.previous_role ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MembersTab() {
  const qc = useQueryClient();
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("Reward");
  const [busy, setBusy] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const res = await listAdminUsers({ limit: 200 });
      const map = new Map((await Promise.all(res.users.map((u) => getAdminUser(u.id)))).map((u) => [u.id, u.balance ?? u.wallet?.balance ?? 0]));
      return res.users.map((u) => ({ ...u, balance: Number(map.get(u.id) ?? 0) }));
    },
  });

  async function adjust() {
    if (!target) return;
    setBusy(true);
    try {
      await adjustBalance(target.id, amount, type);
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="p-4 font-medium">Name</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Balance</th>
            <th className="p-4 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((m) => (
            <tr key={m.id}>
              <td className="p-4 font-medium">{m.name ?? "—"}</td>
              <td className="p-4 text-muted-foreground">{m.email}</td>
              <td className="p-4">{formatDot(Number(m.balance))} DOT</td>
              <td className="p-4 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTarget({ id: m.id, name: m.name ?? m.email ?? "" })}
                >
                  <Coins className="size-4" /> Adjust
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust balance — {target?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {["Admin Credit", "Reward", "Admin Adjustment", "Refund"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-full border px-3 py-1 text-sm ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (DOT, use negative to deduct)</Label>
              <Input
                id="amt"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="hero" onClick={adjust} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentsTab() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const rows = await getPayments();
      // Backend does not join profiles here, so populate via users instead
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
        <Stat label="Successful payments" value={String(totals.count)} />
        <Stat label="DOT funded" value={`${formatDot(totals.dot)} DOT`} />
        <Stat label="Revenue" value={formatNaira(totals.naira)} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">DOT</th>
              <th className="p-4 font-medium">Amount</th>
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
      <p className="text-xs text-muted-foreground">
        Wallets are credited only after Paystack verifies the payment. To credit or refund manually,
        use the <strong>Members</strong> tab — every change is written permanently to the ledger.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

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
          { key: "whop_product_id", label: "Whop product ID" },
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
          { key: "whop_url", label: "Whop/external URL" },
          { key: "whop_product_id", label: "Whop product ID" },
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
          { key: "prize", label: "Prize" },
          { key: "start_date", label: "Start", type: "datetime-local" },
          { key: "end_date", label: "End", type: "datetime-local" },
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

function SystemsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await dotApi.get("/api/stats")) as Record<string, unknown>,
    staleTime: 30_000,
  });

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Users" value={String((stats?.users as number) ?? 0)} sub={`${String((stats?.bannedUsers as number) ?? 0)} banned`} />
      <StatCard title="Ventures" value={String((stats?.ventures as number) ?? 0)} sub={`${String((stats?.activeServices as number) ?? 0)} active services`} />
      <StatCard title="Transactions" value={String((stats?.transactions as number) ?? 0)} sub={`${String((stats?.wallets?.totalBalance as number) ?? 0)} total balance`} />
      <StatCard title="Communities" value="—" sub="Coming soon" />
    </div>
  );
}

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
        <StatCard title="Open reports" value={String((data?.open as number) ?? 0)} sub="Needs action" />
        <StatCard title="In review" value={String((data?.inReview as number) ?? 0)} sub="Assigned" />
        <StatCard title="Resolved today" value={String((data?.resolvedToday as number) ?? 0)} sub="Audited" />
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
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
