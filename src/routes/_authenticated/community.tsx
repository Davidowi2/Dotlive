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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getMyCommunity,
  listMembers,
  getReferralCode,
  createCommunity,
  type CommunityMember,
} from "@/api/community";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community OS — DOT" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");

  const { data: community, isLoading } = useQuery({
    queryKey: ["my-community"],
    queryFn: getMyCommunity,
    enabled: !!user,
  });

  const communityId = community?.id;

  const { data: members = [] } = useQuery({
    queryKey: ["community-members", communityId],
    queryFn: () => listMembers(communityId!),
    enabled: !!communityId,
  });

  const { data: referralCode } = useQuery({
    queryKey: ["referral-code"],
    queryFn: getReferralCode,
    enabled: !!communityId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; region: string; category: string }) =>
      createCommunity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-community"] });
      toast.success("Community created!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create");
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    await createMutation.mutateAsync({ name, description, region, category });
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
        <form onSubmit={handleCreate} className="mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
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
          <Button type="submit" variant="hero" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create community
          </Button>
        </form>
      </AppShell>
    );
  }

  const code = referralCode ?? community.referralCode;
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${code}`;
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <AppShell>
      <PageHeader
        title={community.name}
        subtitle={community.description ?? undefined}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={String(members.length)} icon={Users} accent="primary" />
        <StatCard label="Active founders" value={String(activeCount)} icon={TrendingUp} accent="primary" />
        <StatCard label="Vantage completed" value={String(0)} icon={CheckCircle2} accent="gold" />
        <StatCard label="Avg Vantage" value={String(0)} sub="/ 1000" icon={Gauge} accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Members</h2>
          <DataTable
            columns={[
              {
                key: "founder",
                header: "Founder",
                cell: (m: CommunityMember) => (
                  <span className="font-medium">{m.founder?.name ?? "—"}</span>
                ),
              },
              {
                key: "dotId",
                header: "DOT ID",
                hideOnMobile: true,
                cell: (m: CommunityMember) => (
                  <span className="text-muted-foreground">{m.founder?.dotId ?? "—"}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right",
                cell: (m: CommunityMember) => (
                  <span className="tabular">{m.status}</span>
                ),
              },
              {
                key: "joined",
                header: "Joined",
                align: "right",
                hideOnMobile: true,
                cell: (m: CommunityMember) => (
                  <span className="text-muted-foreground">
                    {new Date(m.joinedAt).toLocaleDateString()}
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
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium">{code}</code>
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
