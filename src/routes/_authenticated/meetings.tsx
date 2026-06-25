import { createFileRoute } from "@tanstack/react-router";
import {
  Send,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  CalendarDays,
  Inbox,
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meeting Requests — DOT" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { user, roles } = useDotAuth();
  const qc = useQueryClient();
  const isInvestor = roles.includes("investor");
  const isFounder = roles.includes("founder");

  // Requests received by this founder from investors
  const { data: received = [], isLoading: rxLoading } = useQuery({
    queryKey: ["meetings-received", user?.id],
    enabled: !!user && isFounder,
    queryFn: async () => {
      // /api/investor/meetings returns meetings where the user is the INVESTOR.
      // For a founder, there's no equivalent endpoint yet, so return empty.
      const res = await dotApi.get<{ meetings: any[] }>("/api/investor/meetings?role=founder");
      const data = res?.meetings ?? [];
      return data.map((r) => ({ ...r, investor: null }));
    },
  });

  // Requests sent by this investor to founders
  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: ["meetings-sent", user?.id],
    enabled: !!user && isInvestor,
    queryFn: async () => {
      const res = await dotApi.get<{ meetings: any[] }>("/api/investor/meetings");
      const data = res?.meetings ?? [];
      return data.map((r) => ({ ...r, founder: null }));
    },
  });

  async function updateStatus(id: string, status: "accepted" | "declined") {
    try {
      await dotApi.patch(`/api/investor/meetings/${id}`, { status });
      qc.invalidateQueries({ queryKey: ["meetings-received", user?.id] });
      toast.success(status === "accepted" ? "Meeting accepted!" : "Request declined.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  }

  const pendingCount = received.filter((r) => r.status === "pending").length;
  const acceptedCount = received.filter((r) => r.status === "accepted").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Capital"
        title="Meeting Requests"
        subtitle={
          isFounder
            ? "Conversations requested by investors. Accept to share your Vantage and venture profile."
            : "Meeting requests you've sent to founders. Track status as they respond."
        }
        action={
          <Badge variant="outline" className="font-medium">
            <CalendarDays className="mr-1.5 size-3" />
            {pendingCount} pending
          </Badge>
        }
      />

      {/* ─── Quick stats strip ─────────────────────────────────────── */}
      <section className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile
            icon={Inbox}
            label="Received"
            value={String(received.length)}
            sub={pendingCount > 0 ? `${pendingCount} need a reply` : "all caught up"}
            accent="primary"
          />
          <SummaryTile
            icon={CheckCircle2}
            label="Accepted"
            value={String(acceptedCount)}
            sub={isFounder ? "ready to share Vantage" : "scheduled"}
            accent="gold"
          />
          <SummaryTile
            icon={Send}
            label="Sent"
            value={String(sent.length)}
            sub={isInvestor ? "founder outreach" : "investor view"}
            accent="muted"
          />
        </div>
      </section>

      {/* ─── Section divider ───────────────────────────────────────── */}
      <hr className="my-10 border-border" />

      {/* ─── Tabs: received / sent ─────────────────────────────────── */}
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            Received {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        {/* ── Received ── */}
        <TabsContent value="received" className="mt-6">
          {rxLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : received.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No meeting requests yet"
              description="When investors request meetings with you, they'll appear here."
              action={
                isFounder ? (
                  <Button variant="outline" size="sm">
                    <Sparkles className="size-4" />
                    Improve your Vantage to be discovered
                    <ArrowRight className="size-4" />
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {received.map((r) => (
                <article
                  key={r.id}
                  className="rounded-sm border border-border bg-card p-5 transition-all hover:border-foreground/20"
                >
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(r.investor?.name ?? "I").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{r.investor?.name ?? "Investor"}</p>
                        {r.investor?.email && (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{r.investor.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </header>

                  {r.message && (
                    <blockquote className="mt-4 rounded-sm border-l-2 border-primary/40 bg-muted/40 px-4 py-3 text-sm text-foreground/90">
                      "{r.message}"
                    </blockquote>
                  )}

                  {r.status === "pending" && (
                    <footer className="mt-4 flex gap-2 border-t border-border pt-4">
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => updateStatus(r.id, "accepted")}
                      >
                        <CheckCircle2 className="size-4" />
                        Accept meeting
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(r.id, "declined")}
                      >
                        <XCircle className="size-4" />
                        Decline
                      </Button>
                    </footer>
                  )}
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Sent ── */}
        <TabsContent value="sent" className="mt-6">
          {sentLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : sent.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No requests sent"
              description={
                isInvestor
                  ? "Browse ventures in DOT Demo to request meetings."
                  : "As a founder, you receive meeting requests — send is investor-only."
              }
            />
          ) : (
            <div className="space-y-3">
              {sent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 transition-all hover:border-foreground/20"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {r.founder?.venture_name ?? "Venture"}
                    </p>
                    <p className="flex items-center gap-3 text-xs text-muted-foreground">
                      {r.founder?.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {r.founder.country}
                        </span>
                      )}
                      {r.founder?.vantage_point != null && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="size-3" />
                          Vantage {r.founder.vantage_point}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <span className="hidden tabular text-xs text-muted-foreground sm:inline">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ─── Internal helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "accepted"
          ? "default"
          : status === "declined"
            ? "destructive"
            : "secondary"
      }
      className="text-[10px]"
    >
      {status}
    </Badge>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "gold" | "muted";
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center",
            accent === "primary" && "text-primary",
            accent === "gold" && "text-gold",
            accent === "muted" && "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-light leading-none tracking-tight tabular">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
