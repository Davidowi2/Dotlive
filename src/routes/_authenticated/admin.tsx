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
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  MessageSquare,
  FileText,
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
  DialogDescription,
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
  deleteAdminCourse,
} from "@/api/adminAcademy";
import { getPayments } from "@/api/payments";
import type { AdminCourse } from "@/api/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DOT" }] }),
  component: AdminPage,
});

/* ------------------------------------------------------------------ *
 *  SHARED UI HELPERS
 * ------------------------------------------------------------------ */

function StatCard({
  title,
  value,
  sub,
  accent = "default",
}: {
  title: string;
  value: string;
  sub: string;
  accent?: "default" | "secondary" | "destructive" | "outline";
}) {
  const accentClasses = {
    default: "border-border",
    secondary: "border-secondary/30",
    destructive: "border-destructive/30",
    outline: "border-border",
  };

  return (
    <div className={`rounded-xl border ${accentClasses[accent]} bg-card p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function ActionButton({
  children,
  variant = "outline",
  size = "sm",
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <Button
      variant={variant}
      size={size}
      className={`rounded-lg ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Delete",
  confirmVariant = "destructive",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmVariant?: "destructive" | "outline" | "default";
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof FileText; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted/50 p-3">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  DASHBOARD
 * ------------------------------------------------------------------ */

function DashboardTab() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await dotApi.get("/api/stats")) as Record<string, unknown>,
    staleTime: 30_000,
  });
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-payments-dashboard"],
    queryFn: async () => (await getPayments()) as any[],
    staleTime: 60_000,
  });
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-moderation-queue-dashboard"],
    queryFn: async () => (await dotApi.get("/api/admin/queue")) as Record<string, unknown>,
    staleTime: 60_000,
  });

  const successCount = payments.filter((p: any) => p.credited_at).length;
  const totalRevenue = payments.reduce((acc: number, p: any) => acc + Number(p.naira_amount || 0), 0);
  const openReports = (reports as any)?.open ?? 0;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total users"
          value={String((stats?.users as number) ?? "—")}
          sub={`${String((stats?.bannedUsers as number) ?? 0)} banned`}
          accent="default"
        />
        <StatCard
          title="Ventures"
          value={String((stats?.ventures as number) ?? "—")}
          sub={`${String((stats?.activeServices as number) ?? 0)} active`}
          accent="secondary"
        />
        <StatCard
          title="Revenue"
          value={formatNaira(totalRevenue)}
          sub={`${successCount} payments`}
          accent="default"
        />
        <StatCard
          title="Open reports"
          value={String(openReports)}
          sub="Needs review"
          accent={openReports > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="font-display font-semibold">Recent payments</h3>
            <p className="text-xs text-muted-foreground">Last verified transactions</p>
          </div>
          {paymentsLoading ? (
            <div className="p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin text-primary" /></div>
          ) : payments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments yet" description="Transactions will appear here once verified." />
          ) : (
            <div className="divide-y divide-border">
              {payments.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{p.profile?.name ?? p.userId}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatNaira(Number(p.naira_amount))}</p>
                    <Badge variant={p.credited_at ? "default" : "secondary"} className="text-[10px]">
                      {p.credited_at ? "credited" : p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="font-display font-semibold">Moderation queue</h3>
            <p className="text-xs text-muted-foreground">Latest reports requiring action</p>
          </div>
          {reportsLoading ? (
            <div className="p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin text-primary" /></div>
          ) : openReports === 0 ? (
            <EmptyState icon={CheckCircle2} title="All clear" description="No open reports right now." />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              {openReports} open report{openReports !== 1 ? "s" : ""} — visit Moderation tab for details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  MEMBERS
 * ------------------------------------------------------------------ */

function MembersTab() {
  const qc = useQueryClient();
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string } | null>(null);
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

  async function adjustBalance_(id: string) {
    if (!adjustTarget) return;
    setBusy(true);
    try {
      await adjustBalance(id, amount, "Admin Adjustment");
      toast.success("Balance updated");
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      setAdjustTarget(null);
      setAmount(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Loader2 className="mt-6 size-6 animate-spin text-primary" />;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total members" value={String(members.length)} sub={`${members.filter((m) => m.banned).length} banned`} />
        <StatCard title="Admin+" value={String(members.filter((m) => m.isAdmin || m.isSuperAdmin).length)} sub="Admins & super admins" accent="secondary" />
        <StatCard title="Total wallet" value={formatDot(members.reduce((a, m) => a + (Number(m.balance) || 0), 0))} sub="Combined DOT balance" />
        <StatCard title="New today" value="—" sub="Coming soon" accent="outline" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Members</h3>
          <p className="text-xs text-muted-foreground">Manage balances and access.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium text-right">Balance</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-muted/20">
                  <td className="p-4">
                    <div className="font-medium">{m.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{m.dotId}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">{m.email}</td>
                  <td className="p-4 text-right font-mono">{formatDot(Number(m.balance))} DOT</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <ActionButton
                        size="icon"
                        variant="ghost"
                        onClick={() => setAdjustTarget({ id: m.id, name: m.name ?? m.email })}
                        title="Adjust balance"
                      >
                        <Coins className="size-4" />
                      </ActionButton>
                      {m.banned ? (
                        <ActionButton
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            await unbanUser(m.id, "Unbanned by admin");
                            toast.success("User unbanned");
                            qc.invalidateQueries({ queryKey: ["admin-members"] });
                          }}
                          title="Unban"
                        >
                          <CheckCircle2 className="size-4 text-green-500" />
                        </ActionButton>
                      ) : (
                        <ActionButton
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            await banUser(m.id, "Banned by admin");
                            toast.success("User banned");
                            qc.invalidateQueries({ queryKey: ["admin-members"] });
                          }}
                          title="Ban"
                        >
                          <XCircle className="size-4 text-destructive" />
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Adjust balance</DialogTitle>
            <DialogDescription>
              {adjustTarget?.name ? `Adjust DOT balance for ${adjustTarget.name}` : "Adjust DOT balance"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (DOT)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Use negative to deduct"
              />
              <p className="text-xs text-muted-foreground">Positive = credit, negative = debit. Example: 100 = 100 DOT</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button variant="hero" onClick={() => adjustTarget && adjustBalance_(adjustTarget.id)} disabled={busy}>
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
 *  FINANCE
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
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Payments" value={String(totals.count)} sub="Verified transactions" accent="default" />
        <StatCard title="DOT funded" value={`${formatDot(totals.dot)} DOT`} sub="Purchased via Paystack" accent="secondary" />
        <StatCard title="Revenue" value={formatNaira(totals.naira)} sub="Naira credited" accent="default" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">Payment history</h3>
        <Badge variant="secondary" className="text-xs">{payments.length} records</Badge>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                <tr key={p.id} className="transition-colors hover:bg-muted/10">
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
        Wallets are credited after Paystack verifies the payment. Use Members tab for manual credits or refunds.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  CONTENT
 * ------------------------------------------------------------------ */

function ContentTab() {
  const qc = useQueryClient();

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
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
            toast.success("Course created");
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
            toast.success("Session created");
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
            toast.success("Pitchathon created");
          }}
        />
      </div>

      <ContentManagementSection />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  CONTENT MANAGEMENT — delete-enabled courses/events/posts
 * ------------------------------------------------------------------ */

function ContentManagementSection() {
  const [activeSubTab, setActiveSubTab] = useState<"courses" | "events" | "posts">("courses");
  const qc = useQueryClient();

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-courses-management"],
    queryFn: async () => (await listAdminCourses()) as AdminCourse[],
    staleTime: 30_000,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-events-management"],
    queryFn: async () => (await dotApi.get<any[]>("/api/admin/events")) as any[],
    staleTime: 30_000,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["admin-feed-posts-management"],
    queryFn: async () => (await listFeedPosts({ limit: 50 })) as any,
    staleTime: 30_000,
  });
  const posts = (postsData?.posts || postsData || []) as any[];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-1 border-b border-border p-1 bg-muted/30">
        {[
          { key: "courses" as const, label: "Courses", icon: BookOpen, count: courses.length },
          { key: "events" as const, label: "Events", icon: CalendarCheck, count: events.length },
          { key: "posts" as const, label: "Feed posts", icon: MessageSquare, count: posts.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all ${
              activeSubTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
            <Badge variant="secondary" className="text-[10px]">{tab.count}</Badge>
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeSubTab === "courses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">DOT</th>
                  <th className="p-4 font-medium">Boost</th>
                  <th className="p-4 font-medium">Whop</th>
                  <th className="p-4 font-medium">Updated</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">No courses yet.</td>
                  </tr>
                )}
                {courses.map((c) => (
                  <CourseRow key={c.id} course={c} qc={qc} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === "events" && (
          <EventsTable events={events} eventsLoading={eventsLoading} qc={qc} />
        )}

        {activeSubTab === "posts" && (
          <PostsTable posts={posts} postsLoading={postsLoading} qc={qc} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  INLINE CONTENT TABLES — avoids generic-crawl edge case while keeping
 *  delete actions real.
 * ------------------------------------------------------------------ */

function CourseRow({ course, qc }: { course: AdminCourse; qc: any }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await deleteAdminCourse(deleteId);
      toast.success("Course deleted");
      qc.invalidateQueries({ queryKey: ["admin-courses-management"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
      setDeleteId(null);
    }
  }

  return (
    <>
      <tr className="transition-colors hover:bg-muted/10">
        <td className="p-4">
          <div className="font-medium">{course.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{course.description}</div>
        </td>
        <td className="p-4"><Badge variant="outline">{course.category || "—"}</Badge></td>
        <td className="p-4">{formatDot(course.dotReward)}</td>
        <td className="p-4">{course.vantageBoost || 0}</td>
        <td className="p-4 text-xs text-muted-foreground truncate max-w-[200px]">{course.whopUrl || "—"}</td>
        <td className="p-4 text-xs text-muted-foreground">{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : "—"}</td>
        <td className="p-4 text-right">
          <ActionButton
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={() => setDeleteId(course.id)}
            title="Delete course"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
          </ActionButton>
        </td>
      </tr>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete course?"
        description="This action cannot be undone. This will permanently remove this course."
        onConfirm={confirmDelete}
      />
    </>
  );
}

function EventsTable({ events, eventsLoading, qc }: { events: any[]; eventsLoading: boolean; qc: any }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteId) return;
    setBusyId(deleteId);
    try {
      await dotApi.delete(`/api/admin/events/${deleteId}`);
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["admin-events-management"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Speaker</th>
              <th className="p-4 font-medium">DOT cost</th>
              <th className="p-4 font-medium">Capacity</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {eventsLoading && (
              <tr>
                <td colSpan={7} className="p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin text-primary" /></td>
              </tr>
            )}
            {!eventsLoading && events.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">No events yet.</td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-muted/10">
                <td className="p-4">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{e.description}</div>
                </td>
                <td className="p-4">{e.speaker || "—"}</td>
                <td className="p-4">{formatDot(e.dot_cost || e.dotCost || 0)}</td>
                <td className="p-4">{e.capacity || "—"}</td>
                <td className="p-4 text-xs text-muted-foreground">
                  {e.event_date || e.eventDate ? new Date(e.event_date || e.eventDate).toLocaleDateString() : "—"}
                </td>
                <td className="p-4"><Badge variant="outline">{e.status || "open"}</Badge></td>
                <td className="p-4 text-right">
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    disabled={busyId === e.id}
                    onClick={() => setDeleteId(e.id)}
                    title="Delete event"
                  >
                    {busyId === e.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete event?"
        description="This action cannot be undone. This will permanently remove this event."
        onConfirm={confirmDelete}
      />
    </>
  );
}

function PostsTable({ posts, postsLoading, qc }: { posts: any[]; postsLoading: boolean; qc: any }) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteId) return;
    setBusyId(deleteId);
    try {
      await deleteFeedPost(deleteId);
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin-feed-posts-management"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4 font-medium">Author</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Body</th>
              <th className="p-4 font-medium">Likes</th>
              <th className="p-4 font-medium">Comments</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {postsLoading && (
              <tr>
                <td colSpan={7} className="p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin text-primary" /></td>
              </tr>
            )}
            {!postsLoading && posts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">No posts yet.</td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/10">
                <td className="p-4">
                  <div className="font-medium">{p.author_name || p.authorId}</div>
                  <div className="text-xs text-muted-foreground">{p.author_dot_id || ""}</div>
                </td>
                <td className="p-4"><Badge variant="secondary">{p.type}</Badge></td>
                <td className="p-4 text-xs text-muted-foreground max-w-[300px] truncate">{p.body}</td>
                <td className="p-4">{p.likes_count || 0}</td>
                <td className="p-4">{p.comments_count || 0}</td>
                <td className="p-4 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <ActionButton
                    size="icon"
                    variant="ghost"
                    disabled={busyId === p.id}
                    onClick={() => setDeleteId(p.id)}
                    title="Delete post"
                  >
                    {busyId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete post?"
        description="This action cannot be undone. This will permanently remove this post."
        onConfirm={confirmDelete}
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 *  MODERATION
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
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Open reports" value={String((data?.open as number) ?? 0)} sub="Needs action" accent="destructive" />
        <StatCard title="In review" value={String((data?.inReview as number) ?? 0)} sub="Assigned" accent="secondary" />
        <StatCard title="Resolved today" value={String((data?.resolvedToday as number) ?? 0)} sub="Audited" accent="default" />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Report queue</h3>
          <p className="text-xs text-muted-foreground">Latest community reports, newest first.</p>
        </div>
        {reportsLoading ? (
          <div className="p-8 text-center"><Loader2 className="mx-auto size-5 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No reports yet" description="All clear." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium">Target</th>
                  <th className="p-4 font-medium">Reason</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/10">
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
 *  ROLES
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
    <div className="mt-6 space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display font-semibold">Admin assignment</h3>
          <p className="text-xs text-muted-foreground">Grant or revoke admin and super_admin access. You cannot change your own role.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                  <tr key={m.id} className="transition-colors hover:bg-muted/10">
                    <td className="p-4">
                      <div className="font-medium">{m.name ?? "—"}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{m.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {m.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {m.roles.map((r) => (
                          <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"}>{ROLE_LABELS[r] ?? r}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">Your account</span>
                        ) : (
                          <>
                            {!isMemberSuper && (
                              <ActionButton size="sm" onClick={() => doElevate(m.id, "super_admin")}>
                                <ShieldCheck className="size-4" /> Super Admin
                              </ActionButton>
                            )}
                            {!isMemberAdmin && !isMemberSuper && (
                              <ActionButton size="sm" onClick={() => doElevate(m.id, "admin")}>
                                <ShieldCheck className="size-4" /> Make Admin
                              </ActionButton>
                            )}
                            {isMemberSuper && (
                              <ActionButton size="sm" variant="outline" onClick={() => doRevoke(m.id, "super_admin")}>
                                <ShieldMinus className="size-4" /> Revoke Super
                              </ActionButton>
                            )}
                            {isMemberAdmin && (
                              <ActionButton size="sm" variant="outline" onClick={() => doRevoke(m.id, "admin")}>
                                <ShieldMinus className="size-4" /> Revoke Admin
                              </ActionButton>
                            )}
                            {!m.banned ? (
                              <ActionButton size="sm" variant="destructive" onClick={() => doBan(m.id)}>
                                <XCircle className="size-4" /> Ban
                              </ActionButton>
                            ) : (
                              <ActionButton size="sm" variant="outline" onClick={() => doUnban(m.id)}>
                                <CheckCircle2 className="size-4" /> Unban
                              </ActionButton>
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

      <div className="overflow-hidden rounded-xl border border-border bg-card">
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
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-medium">When</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audit.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-muted/10">
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
 *  MAIN ADMIN PAGE
 * ------------------------------------------------------------------ */

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
      setValues({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
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
                className="rounded-lg"
              />
            ) : (
              <Input
                type={f.type ?? (f.number ? "number" : "text")}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
      <Button type="submit" variant="hero" className="mt-4 w-full rounded-lg" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create
      </Button>
    </form>
  );
}

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
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Shield className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Command center</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Platform operations</p>
          </div>
        </div>
      </div>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabIcon icon={BarChart3} value="dashboard" label="Dashboard" />
          <TabIcon icon={Users} value="members" label="Members" />
          <TabIcon icon={Wallet} value="finance" label="Finance" />
          <TabIcon icon={Globe} value="content" label="Content" />
          <TabIcon icon={Activity} value="moderation" label="Moderation" />
          {isSuperAdmin && <TabIcon icon={Shield} value="roles" label="Roles & Audit" requiresSuperAdmin />}
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="members"><MembersTab /></TabsContent>
        <TabsContent value="finance"><FinanceTab /></TabsContent>
        <TabsContent value="content"><ContentTab /></TabsContent>
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
      className="rounded-xl border border-transparent bg-muted/50 px-4 py-2.5 text-sm transition-all data-[state=active]:border-primary/20 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none"
    >
      <Icon className="mr-2 size-4" />
      {label}
      {requiresSuperAdmin && (
        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
          Super
        </span>
      )}
    </TabsTrigger>
  );
}
