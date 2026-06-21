import { createFileRoute } from "@tanstack/react-router";
import { Send, Building2, MapPin, Clock, CheckCircle2, XCircle, MessageSquare, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meeting Requests — DOT" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const isInvestor = roles.includes("investor");
  const isFounder = roles.includes("founder");

  // Requests received by this founder from investors
  const { data: received = [], isLoading: rxLoading } = useQuery({
    queryKey: ["meetings-received", user?.id],
    enabled: !!user && isFounder,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_requests")
        .select("id, message, status, created_at, investor_id")
        .eq("founder_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      // Fetch investor profiles
      const ids = [...new Set(data.map((r) => r.investor_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", ids);
      const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return data.map((r) => ({ ...r, investor: pmap.get(r.investor_id) }));
    },
  });

  // Requests sent by this investor to founders
  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: ["meetings-sent", user?.id],
    enabled: !!user && isInvestor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_requests")
        .select("id, message, status, created_at, founder_id")
        .eq("investor_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const ids = [...new Set(data.map((r) => r.founder_id))];
      const { data: fps } = await supabase
        .from("founder_profiles")
        .select("user_id, venture_name, vantage_point, country")
        .in("user_id", ids);
      const fpmap = new Map((fps ?? []).map((p) => [p.user_id, p]));
      return data.map((r) => ({ ...r, founder: fpmap.get(r.founder_id) }));
    },
  });

  async function updateStatus(id: string, status: "accepted" | "declined") {
    try {
      const { error } = await supabase
        .from("meeting_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["meetings-received", user?.id] });
      toast.success(status === "accepted" ? "Meeting accepted!" : "Request declined.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  }

  const pendingCount = received.filter((r) => r.status === "pending").length;

  return (
    <AppShell>
      <PageHeader
        title="Meeting Requests"
        subtitle="Manage your investor conversations and founder connections."
      />

      <Tabs defaultValue="received" className="mt-6">
        <TabsList>
          <TabsTrigger value="received">
            Received {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        {/* ── Received ── */}
        <TabsContent value="received" className="mt-4">
          {rxLoading ? (
            <Loader2 className="mt-8 size-6 animate-spin text-primary" />
          ) : received.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No meeting requests yet"
              description="When investors request meetings with you, they'll appear here."
            />
          ) : (
            <div className="space-y-4">
              {received.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {(r.investor?.name ?? "I").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{r.investor?.name ?? "Investor"}</p>
                        <p className="text-sm text-muted-foreground">{r.investor?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {r.message && (
                    <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                      "{r.message}"
                    </p>
                  )}
                  {r.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="hero" size="sm" onClick={() => updateStatus(r.id, "accepted")}>
                        <CheckCircle2 className="size-4" /> Accept
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(r.id, "declined")}>
                        <XCircle className="size-4" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Sent ── */}
        <TabsContent value="sent" className="mt-4">
          {sentLoading ? (
            <Loader2 className="mt-8 size-6 animate-spin text-primary" />
          ) : sent.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No requests sent"
              description="Browse ventures in DOT Demo to request meetings."
            />
          ) : (
            <div className="space-y-3">
              {sent.map((r) => (
                <div key={r.id} className={cn(
                  "flex items-center gap-4 rounded-2xl border border-border bg-card p-5",
                )}>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{r.founder?.venture_name ?? "Venture"}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.founder?.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />{r.founder.country}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "accepted" ? "default" : r.status === "declined" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
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
