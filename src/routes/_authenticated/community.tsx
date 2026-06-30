import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  MessageSquare,
  Hash,
  Globe,
  Shield,
  Key,
  Eye,
  EyeOff,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getMyCommunity,
  listMembers,
  getReferralCode,
  createCommunity,
  type CommunityMember,
} from "@/api/community";
import { dotApi } from "@/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community OS — DOT" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  const { user, roles } = useDotAuth();
  const navigate = useNavigate();
  const canCreateCommunity = roles.some((r) => r === "community_leader" || r === "admin" || r === "super_admin");
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinTab, setJoinTab] = useState<"create" | "join">("create");

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
          // ─── Gate + Join by code for non-leaders ───
          <section className="mt-8 max-w-xl space-y-4">
            {/* Join by code */}
            <JoinByCodPanel />

            <div className="rounded-sm border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15">
                <Lock className="size-6 text-primary" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold">
                Becoming a Community Leader is a 1,000 DOT commitment
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Builders join communities. Leaders <em>run</em> them. Leaders set
                the rules, host sessions, and earn a referral share when founders raise capital.
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
                  <Link to="/settings">Become a Community Leader <ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/discover/communities">Browse existing communities</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <div className="mt-8 max-w-xl space-y-4">
            {/* Toggle: Create or Join */}
            <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
              <button
                onClick={() => setJoinTab("create")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                  joinTab === "create" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Plus className="size-3.5" /> Create community
              </button>
              <button
                onClick={() => setJoinTab("join")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                  joinTab === "join" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Key className="size-3.5" /> Join by code
              </button>
            </div>

            {joinTab === "join" ? (
              <JoinByCodPanel />
            ) : (
            <form
              onSubmit={handleCreate}
              className="space-y-5 rounded-sm border border-border bg-card p-6"
            >
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
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What kind of founders belong here?" />
              </div>

              {/* Privacy toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2.5">
                  {isPrivate ? <Lock className="size-4 text-amber-500" /> : <Globe className="size-4 text-emerald-500" />}
                  <div>
                    <p className="text-sm font-medium">{isPrivate ? "Private community" : "Public community"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPrivate
                        ? "Members join via unique invite code only — not listed publicly"
                        : "Listed on Discover — anyone can request to join"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate((p) => !p)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isPrivate ? "bg-amber-500" : "bg-emerald-500",
                  )}
                >
                  <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", isPrivate ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">You become the leader and receive a referral code.</p>
                <Button type="submit" variant="hero" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Create community
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
            )}
          </div>
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

      {/* ─── Tabs for Overview and Channels ─────────────────────── */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Users className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <MessageSquare className="size-4" />
            Channels
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-6">
      {/* ─── Stats ─────────────────────────────────────────────────── */}
      <section>
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
            <QRCodeCanvas value={joinUrl} size={140} className="max-w-full h-auto" />
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
        </TabsContent>

        {/* ─── Channels Tab ─────────────────────────────────────── */}
        <TabsContent value="channels" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Hash className="size-8 text-primary" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">
              Community Channels
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Join live conversations with your community members. Discuss ideas, share updates, and collaborate in real-time.
            </p>
            <Button
              asChild
              variant="hero"
              size="lg"
              className="mt-6"
            >
              <Link to="/community/channels">
                <MessageSquare className="size-4" />
                Open Channels
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ─── Join by code panel ─────────────────────────────────────────── */
function JoinByCodPanel() {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const qc = useQueryClient();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    try {
      await dotApi.post("/api/communities/join", { code: code.trim().toUpperCase() });
      qc.invalidateQueries({ queryKey: ["my-community"] });
      toast.success("You've joined the community!");
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid or expired code");
    } finally {
      setJoining(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Key className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Join a private community</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Have an invite code from a community leader? Enter it below to join instantly.
      </p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. LAGOS-2024"
          className="font-mono uppercase tracking-widest"
          maxLength={20}
        />
        <Button type="submit" disabled={!code.trim() || joining}>
          {joining ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Join
        </Button>
      </div>
    </form>
  );
}
