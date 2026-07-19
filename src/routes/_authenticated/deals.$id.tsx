/**
 * /deals/$id — Investor Deal Room
 *
 * Tier 2 / Connection 3 — deal room snapshot for investors and founders.
 *
 * Visible only to:
 *   - the venture owner/founder
 *   - investors with access to the deal
 *   - admins
 *
 * Sections:
 *   - Overview + deal status + valuation
 *   - Documents
 *   - Cap Table
 *   - Milestones
 *   - Communication
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  Award,
  Loader2,
  Bookmark,
  Send,
  Target,
  FileText,
  Users2,
  Flag,
  MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app/AppShell";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { dotApi } from "@/api/client";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { formatNaira, formatDot } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/deals/$id")({
  head: () => ({ meta: [{ title: "Deal Room — DOT" }] }),
  component: DealRoomPage,
});

function DealRoomPage() {
  const { id } = Route.useParams();
  const { user } = useDotAuth();

  const dealQ = useQuery({
    queryKey: ["deal_room", id],
    queryFn: async () =>
      dotApi.get<any>(`/api/ventures/${id}/deal-room`),
  });

  const valuationQ = useQuery({
    queryKey: ["deal_valuation", id],
    queryFn: async () =>
      dotApi.get<any>(`/api/ventures/${id}/valuation`),
    enabled: !!id,
  });

  const milestonesQ = useQuery({
    queryKey: ["deal_milestones", id],
    queryFn: async () =>
      dotApi.get<any>(`/api/ventures/${id}/milestones`),
    enabled: !!id,
  });

  if (dealQ.isLoading || valuationQ.isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const data = dealQ.data;
  const valuation = valuationQ.data;
  const milestones = milestonesQ.data?.milestones ?? [];

  const venture = data?.venture;
  const founder = data?.founder;
  const recentActivity = data?.recentActivity ?? [];
  const recentAssessments = data?.recentAssessments ?? [];

  if (!venture) {
    return (
      <AppShell>
        <PageHeader title="Deal Room" subtitle="Venture not found or you don't have access." />
        <Button variant="outline" asChild className="mt-6">
          <Link to="/investor"><ArrowLeft className="mr-2 size-4" /> Back to pipeline</Link>
        </Button>
      </AppShell>
    );
  }

  const isOwner = Boolean(user && founder && user.id === founder.id);
  const isAdmin = Boolean(user && user.roles?.includes("admin"));
  const hasAccess = isOwner || isAdmin;

  if (!hasAccess) {
    return (
      <AppShell>
        <PageHeader
          title="Deal Room"
          subtitle="Access limited to the founder and investors on this deal."
        />
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Request access or save this deal to your pipeline, then contact the founder directly.
        </div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/investor"><ArrowLeft className="mr-2 size-4" /> Back to pipeline</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const stage = venture.stage ?? "Idea";
  const roundLabel =
    stage.toLowerCase().includes("series a") ? "Series A"
      : stage.toLowerCase().includes("series b") ? "Series B"
      : stage.toLowerCase().includes("seed") ? "Seed"
      : stage;

  const amountLabel = formatDot(Number(venture.fundingGoal ?? 0));

  async function toggleSave(founderId: string) {
    try {
      await dotApi.post("/api/investor/saves", { founderId });
      toast.success("Saved to pipeline");
    } catch (err: any) {
      try {
        await dotApi.delete(`/api/investor/saves/${encodeURIComponent(founderId)}`);
        toast.success("Removed from pipeline");
      } catch {
        toast.error(err?.message ?? "Could not update");
      }
    }
  }

  async function requestMeeting(founderId: string) {
    try {
      await dotApi.post("/api/investor/meetings", {
        founderId,
        topic: "Deal Room: introduction",
        message: "I'd like to discuss your venture.",
      });
      toast.success("Meeting request sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title={venture.name}
        subtitle={`${venture.industry ?? ""} · ${venture.country ?? ""}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => founder && toggleSave(founder.id)}>
              <Bookmark className="mr-2 size-4" /> Save
            </Button>
            <Button variant="hero" size="sm" onClick={() => founder && requestMeeting(founder.id)}>
              <Send className="mr-2 size-4" /> Request meeting
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList>
              <TabsTrigger value="overview" icon={<Activity className="size-4" />}>Overview</TabsTrigger>
              <TabsTrigger value="documents" icon={<FileText className="size-4" />}>Documents</TabsTrigger>
              <TabsTrigger value="cap-table" icon={<Users2 className="size-4" />}>Cap Table</TabsTrigger>
              <TabsTrigger value="milestones" icon={<Flag className="size-4" />}>Milestones</TabsTrigger>
              <TabsTrigger value="communication" icon={<MessageSquare className="size-4" />}>Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Status + round + amount */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{stage}</Badge>
                <Badge variant="outline">{roundLabel}</Badge>
                <Badge variant="default">{amountLabel} target</Badge>
              </div>

              {/* Valuation card */}
              {valuation && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">DOT Venture Valuation</div>
                      <div className="mt-2 font-display text-4xl font-bold text-primary">
                        {formatNaira(valuation.valuation_ngn)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Stage: <Badge variant="secondary">{valuation.stage ?? stage}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Confidence</div>
                      <div className="mt-1 font-display text-2xl font-bold">{valuation.confidence}%</div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <Metric label="Vantage" value={valuation.vantage} suffix="/100" />
                    <Metric label="Fundability" value={valuation.fundability} suffix="/100" />
                    <Metric label="Investment Readiness" value={valuation.investment_readiness} suffix="/100" />
                  </div>
                </div>
              )}

              {/* About */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg font-semibold">About</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {venture.description ?? "No description provided."}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Field label="Stage" value={stage} />
                  <Field label="Funding Goal" value={formatNaira(venture.fundingGoal ?? 0)} />
                  <Field label="Industry" value={venture.industry ?? "—"} />
                  <Field label="Country" value={venture.country ?? "—"} />
                </div>
                {venture.website && (
                  <a href={venture.website} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-primary hover:underline">
                    {venture.website} ↗
                  </a>
                )}
              </div>

              {/* Recent activity */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Activity className="size-4" /> Founder activity
                </h3>
                {recentActivity.length ? (
                  <ul className="mt-3 space-y-2">
                    {recentActivity.slice(0, 8).map((a: any) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">{a.title}</span>
                        {a.pointsDelta ? (
                          <Badge variant={a.pointsDelta > 0 ? "default" : "outline"}>
                            {a.pointsDelta > 0 ? "+" : ""}{a.pointsDelta}
                          </Badge>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold flex items-center gap-2">
                  <FileText className="size-4" /> Deal documents
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">Founders can upload term sheets, pitch decks, and supporting docs here.</p>
                {isOwner && (
                  <Button className="mt-4" variant="outline" size="sm">Upload document</Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cap-table" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold flex items-center gap-2">
                  <Users2 className="size-4" /> Cap table
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">Ownership breakdown for this deal.</p>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold flex items-center gap-2">
                  <Flag className="size-4" /> Milestones
                </h3>
                {milestones.length ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {milestones.slice(0, 20).map((m: any) => (
                      <li key={m.id} className="flex items-center justify-between gap-2">
                        <span>{m.title ?? "Milestone"}</span>
                        <Badge variant="secondary">{m.status ?? "planned"}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No milestones released yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="communication" className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="size-4" /> Communication
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deal notes and threads live in DOT Connect. Use the request-meeting action above to start a conversation.
                </p>
                <Button className="mt-4" variant="hero" size="sm" asChild>
                  <Link to={`/connect?thread=${encodeURIComponent(venture.id)}`}>Open Connect</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-base font-semibold">Founder</h3>
            {founder ? (
              <div className="mt-3">
                <div className="font-display text-lg">{founder.name ?? "—"}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{founder.dotId}</div>
                {data?.builderLevel && (
                  <Badge className="mt-3" variant="secondary">
                    <Award className="mr-1 size-3" />
                    Level {data.builderLevel.level} · {data.builderLevel.label}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Unknown</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Target className="size-4" /> Vantage history
            </h3>
            {recentAssessments.length ? (
              <ul className="mt-3 space-y-2">
                {recentAssessments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-display font-bold">{Number(a.score).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No Vantage history.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-background p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
