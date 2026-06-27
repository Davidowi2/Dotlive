/**
 * /deals/$id — Investor Deal Room
 *
 * Full investor-facing snapshot of a venture: profile, founder,
 * valuation, recent activity, recent assessments. Investors only.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, TrendingUp, Activity, Award, Loader2, Bookmark,
  Send, Target,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app/AppShell";
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
    queryFn: async () => dotApi.get<any>(`/api/ventures/${id}/deal-room`),
  });

  async function toggleSave(founderId: string) {
    try {
      await dotApi.post("/api/investor/saves", { founderId });
      toast.success("Saved to pipeline");
    } catch (err: any) {
      // If already saved, try delete
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

  if (dealQ.isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const data = dealQ.data;
  const venture = data?.venture;
  const val = data?.valuation;
  const founder = data?.founder;

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
        {/* Left: valuation + venture */}
        <div className="lg:col-span-2 space-y-6">
          {/* Valuation card */}
          {val && (
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    DOT Venture Valuation
                  </div>
                  <div className="mt-2 font-display text-4xl font-bold text-primary">
                    {formatNaira(val.valuation_ngn)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Stage: <Badge variant="secondary">{val.stage ?? "Idea"}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Confidence</div>
                  <div className="mt-1 font-display text-2xl font-bold">{val.confidence}%</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <Metric label="Vantage" value={val.vantage} suffix="/100" />
                <Metric label="Fundability" value={val.fundability} suffix="/100" />
                <Metric label="Investment Readiness" value={val.investment_readiness} suffix="/100" />
              </div>
            </div>
          )}

          {/* Venture description */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-lg font-semibold">About</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {venture.description ?? "No description provided."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Field label="Stage" value={venture.stage ?? "Idea"} />
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
            {data?.recentActivity?.length ? (
              <ul className="mt-3 space-y-2">
                {data.recentActivity.slice(0, 8).map((a: any) => (
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
        </div>

        {/* Right: founder profile */}
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
            {data?.recentAssessments?.length ? (
              <ul className="mt-3 space-y-2">
                {data.recentAssessments.map((a: any) => (
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