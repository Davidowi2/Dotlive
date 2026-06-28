import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeCanvas } from "qrcode.react";
import {
  Users,
  Loader2,
  Copy,
  Plus,
  Gauge,
  CheckCircle2,
  TrendingUp,
  Share2,
  QrCode,
  UserPlus,
  ArrowRight,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { BackButton } from "@/components/app/BackButton";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { DataTable } from "@/components/app/DataTable";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  const { user, roles } = useDotAuth();
  const canCreateCommunity = roles.some((r) => r === "community_leader" || r === "admin" || r === "super_admin");
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
        <div className="mb-3">
          <BackButton label="Back" fallback="/discover/communities" />
        </div>
        <PageHeader
          eyebrow="Community OS"
          title="Start a community"
          subtitle={
            canCreateCommunity
              ? "Launch a hub for founders in your region and start onboarding."
              : "Communities are owned by Community Leaders. Builders join them; leaders run them."
          }
          action={
            <Badge variant="outline" className="font-medium">
              <UserPlus className="mr-1.5 size-3" />
              Community OS
            </Badge>
          }
        />

        {!canCreateCommunity ? (
          // ─── Gate screen for non-leaders ───
          <section className="mt-8 max-w-xl rounded-sm border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15">
              <Lock className="size-6 text-primary" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">
              Becoming a Community Leader is a 1,000 DOT commitment
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Builders join communities. Leaders <em>run</em> them. Leaders set
              the on-shore rules, host sessions, and earn a referral share when
              founders in their community raise capital.
            </p>

            <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">Earn</p>
                <p className="mt-1 font-display text-sm font-semibold">5% referral share</p>
                <p className="text-xs text-muted-foreground">on every raise in your community</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">Reach</p>
                <p className="mt-1 font-display text-sm font-semibold">Regional founders</p>
                <p className="text-xs text-muted-foreground">your member list, your events</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">Status</p>
                <p className="mt-1 font-display text-sm font-semibold">Leader badge</p>
                <p className="text-xs text-muted-foreground">on every community page</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild variant="hero">
                <Link to="/settings">
                  Become a Community Leader
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/discover/communities">
                  Browse existing communities
                </Link>
              </Button>
            </div>
          </section>
        ) : (
        <form
          onSubmit={handleCreate}
          className="mt-8 max-w-xl space-y-5 rounded-sm border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Community name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lagos Builders"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Lagos, Nigeria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat">Category</Label>
              <Input
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Tech / Agric"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What kind of founders belong here?"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              You become the community leader and receive a referral code.
            </p>
            <Button type="submit" variant="hero" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create community
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
        )}
      </AppShell>
    );
  }

  const code = referralCode ?? community.referralCode;
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${code}`;
  const activeCount = members.filter((m) => m.status === "active").length;

  /* Honest: vantage completed / avg vantage aren't computed yet —
   * show placeholders that don't pretend to be a number. */
  const vantageDone = members.filter((m) => m.founder).length;

  return (
      <AppShell>
        <div className="mb-3">
          <BackButton label="Back to communities" fallback="/discover/communities" />
        </div>
        <PageHeader
          eyebrow="Community OS"
          title={community.name}
              subtitle={community.description ?? `Active in ${community.region ?? "your region"}.`}
              action={
                <Button variant="outline" size="sm">
                  <Share2 className="size-4" />
                  Share invite
                </Button>
              }
            />

      {/* ─── Stats ─────────────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Members"
            value={String(members.length)}
            icon={Users}
            accent="primary"
          />
          <StatCard
            label="Active founders"
            value={String(activeCount)}
            icon={TrendingUp}
            accent="primary"
          />
          <StatCard
            label="Onboarded"
            value={String(vantageDone)}
            icon={CheckCircle2}
            accent="gold"
          />
          <StatCard
            label="Avg Vantage"
            value="—"
            sub="per member"
            icon={Gauge}
            accent="muted"
          />
        </div>
      </section>

      {/* ─── Section divider ───────────────────────────────────────── */}
      <hr className="my-10 border-border" />

      {/* ─── Roster + invite ───────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-border bg-card lg:col-span-2">
          <PageHeader
            variant="compact"
            title="Members"
            subtitle="Founders who joined via your referral code."
            action={<Badge variant="outline">{members.length}</Badge>}
          />
          <div className="p-2 pt-0">
            <DataTable
              columns={[
                {
                  key: "founder",
                  header: "Founder",
                  cell: (m: CommunityMember) => (
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(m.founder?.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium">{m.founder?.name ?? "—"}</span>
                    </div>
                  ),
                },
                {
                  key: "dotId",
                  header: "DOT ID",
                  hideOnMobile: true,
                  cell: (m: CommunityMember) => (
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.founder?.dotId ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  align: "right",
                  cell: (m: CommunityMember) => (
                    <Badge
                      variant={m.status === "active" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {m.status}
                    </Badge>
                  ),
                },
                {
                  key: "joined",
                  header: "Joined",
                  align: "right",
                  hideOnMobile: true,
                  cell: (m: CommunityMember) => (
                    <span className="tabular text-xs text-muted-foreground">
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
        </div>

        {/* Invite panel */}
        <div className="rounded-sm border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <QrCode className="size-4" />
            </span>
            <h2 className="font-display text-lg font-light tracking-tight">Invite founders</h2>
          </div>

          <div className="mt-5 flex justify-center rounded-sm border border-border bg-background p-5">
            <QRCodeCanvas value={joinUrl} size={140} />
          </div>

          <div className="mt-5 space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Referral code
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-sm border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
                {code}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy invite link"
                onClick={() => {
                  navigator.clipboard.writeText(joinUrl);
                  toast.success("Invite link copied!");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="break-all text-xs text-muted-foreground">{joinUrl}</p>
          </div>

          <div className="mt-6 rounded-sm border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            Members join via this code. Once onboarded, their Vantage assessments
            feed into your community's stats here.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
