import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import { Users, Loader2, Copy, Plus, Gauge, CheckCircle2, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { DataTable } from "@/components/app/DataTable";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community OS — DOT" }] }),
  component: CommunityPage,
});

interface FounderInfo {
  user_id: string;
  venture_name: string | null;
  vantage_point: number | null;
  stage: string | null;
}

interface MemberRow {
  id: string;
  community_id: string;
  founder_id: string;
  status: string;
  joined_at: string;
  founder_profiles: FounderInfo | null;
}


function CommunityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: community, isLoading } = useQuery({
    queryKey: ["my-community", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("id, name, description, category, region, leader_id, created_at, updated_at")
        .eq("leader_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: code } = await supabase.rpc("get_my_referral_code");
      return { ...data, referral_code: (code as string | null) ?? "" };
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["community-members", community?.id],
    enabled: !!community,
    queryFn: async (): Promise<MemberRow[]> => {
      const { data: rows, error } = await supabase
        .from("community_members")
        .select("*")
        .eq("community_id", community!.id);
      if (error) throw error;
      const list = rows ?? [];
      if (list.length === 0) return [];
      const ids = list.map((r) => r.founder_id);
      const { data: profiles } = await supabase
        .from("founder_profiles")
        .select("user_id, venture_name, vantage_point, stage")
        .in("user_id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return list.map((r) => ({
        ...r,
        founder_profiles: map.get(r.founder_id) ?? null,
      }));
    },
  });

  async function createCommunity(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("communities").insert({
        name,
        description,
        region,
        category,
        leader_id: user.id,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-community", user.id] });
      toast.success("Community created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.StatCards count={4} />
        <PageSkeleton.TableRows rows={5} cols={4} />
      </AppShell>
    );
  }

  if (!community) {
    return (
      <AppShell>
        <PageHeader
          title="Create your community"
          subtitle="Launch your community and start onboarding founders."
        />
        <form onSubmit={createCommunity} className="mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Community name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lagos Builders" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Lagos, Nigeria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat">Category</Label>
              <Input id="cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Tech / Agric" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <Button type="submit" variant="hero" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create community
          </Button>
        </form>
      </AppShell>
    );
  }

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${community.referral_code}`;
  const activeCount = members.filter((m) => m.status === "active").length;
  const withVantage = members.filter((m) => (m.founder_profiles as { vantage_point?: number } | null)?.vantage_point).length;
  const avgVantage = members.length
    ? Math.round(
        members.reduce((s, m) => s + ((m.founder_profiles as { vantage_point?: number } | null)?.vantage_point ?? 0), 0) /
          members.length,
      )
    : 0;

  return (
    <AppShell>
      <PageHeader
        title={community.name}
        subtitle={community.description ?? undefined}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={String(members.length)} icon={Users} accent="primary" />
        <StatCard label="Active founders" value={String(activeCount)} icon={TrendingUp} accent="primary" />
        <StatCard label="Vantage completed" value={String(withVantage)} icon={CheckCircle2} accent="gold" />
        <StatCard label="Avg Vantage" value={String(avgVantage)} sub="/ 1000" icon={Gauge} accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Members</h2>
          <DataTable
            columns={[
              {
                key: "venture",
                header: "Venture",
                cell: (m) => {
                  const fp = m.founder_profiles as { venture_name?: string } | null;
                  return <span className="font-medium">{fp?.venture_name ?? "—"}</span>;
                },
              },
              {
                key: "stage",
                header: "Stage",
                hideOnMobile: true,
                cell: (m) => {
                  const fp = m.founder_profiles as { stage?: string } | null;
                  return <span className="text-muted-foreground">{fp?.stage ?? "—"}</span>;
                },
              },
              {
                key: "vantage",
                header: "Vantage",
                align: "right",
                cell: (m) => {
                  const fp = m.founder_profiles as { vantage_point?: number } | null;
                  return <span className="tabular">{fp?.vantage_point ?? 0}</span>;
                },
              },
              {
                key: "joined",
                header: "Joined",
                align: "right",
                hideOnMobile: true,
                cell: (m) => (
                  <span className="text-muted-foreground">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </span>
                ),
              },
            ]}
            rows={members}
            getRowKey={(m) => m.id}
            emptyState={
              <EmptyState
                variant="inline"
                icon={Users}
                title="No members yet"
                description="Share your referral link or QR code to onboard founders."
              />
            }
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Invite founders</h2>
          <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
            <QRCodeCanvas value={joinUrl} size={140} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Referral code</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium">{community.referral_code}</code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(joinUrl);
                toast.success("Invite link copied!");
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="mt-2 break-all text-xs text-muted-foreground">{joinUrl}</p>
        </div>
      </div>
    </AppShell>
  );
}


