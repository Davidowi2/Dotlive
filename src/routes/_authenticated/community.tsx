import { useEffect, useState, useNavigate } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Loader2, Copy, Plus, Gauge, CheckCircle2, TrendingUp, Send, RefreshCw, MessageSquare, ArrowRight, Key } from "lucide-react";
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
  getMyAllCommunities,
  listMembers,
  getReferralCode,
  createCommunity,
  leaveCommunity,
  regenerateInviteCode,
  updateMemberStatus,
  type CommunityMember,
} from "@/api/community";
import { dotApi } from "@/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community OS — DOT" }] }),
  ssr: false,
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

interface ChatMessage {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  author_id: string;
}

function CommunityPage() {
  const { user, roles } = useDotAuth();
  const navigate = useNavigate();
  const safeRoles = roles ?? [];
  const canCreateCommunity = safeRoles.some((r) => r === "community_leader" || r === "admin" || r === "super_admin");
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const busy = false;
  const [chatTab, setChatTab] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && myCommunities.length > 0) {
      setSelectedId(myCommunities[0].id);
    }
  }, [myCommunities, selectedId]);

  // Load ALL communities the user is part of (led + member)
  const { data: myCommunities = [], isLoading } = useQuery({
    queryKey: ["my-communities"],
    queryFn: getMyAllCommunities,
    enabled: !!user,
    staleTime: 60_000,
  });

  // Pick the selected community — default to first one (usually the one they lead)
  const community = myCommunities.find((c) => c.id === selectedId) ?? myCommunities[0] ?? null;
  const communityId = community?.id;

  const { data: members = [] } = useQuery({
    queryKey: ["community-members", communityId],
    queryFn: () => listMembers(communityId!),
    enabled: !!communityId,
    staleTime: 60_000,
  });

  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", communityId],
    queryFn: getReferralCode,
    enabled: !!communityId,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; region: string; category: string }) =>
      createCommunity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-communities"] });
      toast.success("Community created!");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not create");
    },
  });

  const { data: communityChat } = useQuery({
    queryKey: ["community-chat", community?.id],
    enabled: !!community?.id,
    queryFn: async () => {
      return listCommunityChat(community!.id, 50);
    },
  });

  async function createCommunity(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    await createMutation.mutateAsync({ name, description, region, category });
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !community?.id || !chatInput.trim()) return;
    setChatSending(true);
    try {
      await sendCommunityChat(community.id, chatInput.trim());
      setChatInput("");
      qc.invalidateQueries({ queryKey: ["community-chat", community.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Message failed");
    } finally {
      setChatSending(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <Loader2 className="size-6 animate-spin text-primary" />
      </AppShell>
    );
  }

  if (!community) {
    return (
      <AppShell>
        <h1 className="font-display text-3xl font-bold">Create your community</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Launch your community and start onboarding founders.
        </p>
        <form
          onSubmit={createCommunity}
          className="mt-6 max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6"
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
            />
          </div>
          <Button type="submit" variant="hero" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create community
          </Button>
        </form>
      </AppShell>
    );
  }

  async function regenerateCode() {
    if (!community?.id) return;
    await regenerateInviteCode(community.id);
    toast.success("Invite code regenerated");
    qc.invalidateQueries({ queryKey: ["referral-code", community.id] });
  }

  async function leave() {
    if (!community?.id) return;
    await leaveCommunity(community.id);
    toast.success("Left community");
    setSelectedId(null);
  }

  const code = referralCode ?? community.referralCode;
  const joinUrl = `https://dotlive.cv/join/${code}`;
  const activeCount = members.filter((m) => m.status === "active").length;
  const withVantage = members.filter(
    (m) => (m.founder_profiles as { vantage_point?: number } | null)?.vantage_point,
  ).length;
  const avgVantage = members.length
    ? Math.round(
        members.reduce(
          (s, m) =>
            s + ((m.founder_profiles as { vantage_point?: number } | null)?.vantage_point ?? 0),
          0,
        ) / members.length,
      )
    : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{community.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{community.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setChatTab((v) => !v)}>
            {chatTab ? "Hide chat" : "Open chat"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Members" value={members.length} icon={Users} />
        <Stat label="Active founders" value={activeCount} icon={TrendingUp} />
        <Stat label="Vantage completed" value={withVantage} icon={CheckCircle2} />
        <Stat label="Avg Vantage" value={avgVantage} icon={Gauge} />
      </div>

      <div className={`grid gap-6 lg:grid-cols-3 ${chatTab ? "mt-6" : "mt-6"}`}>
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Members</h2>
          {members.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No members yet. Share your referral link to onboard founders.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 font-medium">Venture</th>
                    <th className="py-2 font-medium">Stage</th>
                    <th className="py-2 font-medium">Vantage</th>
                    <th className="py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const fp = m.founder_profiles as {
                      venture_name?: string;
                      vantage_point?: number;
                      stage?: string;
                    } | null;
                    return (
                      <tr key={m.id}>
                        <td className="py-2.5 font-medium">{fp?.venture_name ?? "—"}</td>
                        <td className="py-2.5 text-muted-foreground">{fp?.stage ?? "—"}</td>
                        <td className="py-2.5">{fp?.vantage_point ?? 0}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {new Date(m.joined_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Community / referral panel */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Community</h2>
          {(community as any).role === "leader" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={regenerateCode}>
                <RefreshCw className="size-4" /> Regenerate invite code
              </Button>
              <Button variant="destructive" size="sm" onClick={leave}>
                Leave community
              </Button>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Referral code</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
              {community.referral_code}
            </code>
            <Button asChild variant="hero" size="lg" className="mt-6">
              <Link to="/community/channels">
                <MessageSquare className="size-4" />
                Open Channels
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-2 break-all text-xs text-muted-foreground">{joinUrl}</p>
        </div>
      </div>

      {chatTab && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Community chat</h2>
          <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto">
            {(communityChat ?? []).map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {m.author_name ? m.author_name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="rounded-xl bg-muted/60 px-3 py-2">
                  <p className="text-xs font-medium">
                    {m.author_name ?? "User"} {m.author_id === user?.id ? "(you)" : ""}
                  </p>
                  <p className="text-sm">{m.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="mt-4 flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message the community"
            />
            <Button type="submit" variant="hero" disabled={chatSending}>
              {chatSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      )}
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
      await dotApi.post("/api/communities/join", { referralCode: code.trim().toUpperCase() });
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
