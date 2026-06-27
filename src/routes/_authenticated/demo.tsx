import { dotApi } from "@/api/client";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Loader2, Gauge, MapPin, Bookmark, BookmarkCheck, Send } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatNaira } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/demo")({
  head: () => ({
    meta: [
      { title: "DOT Demo — DOT" },
      { name: "description", content: "Discover investable African ventures on DOT Demo." },
    ],
  }),
  component: DemoPage,
});

export interface FounderShowcase {
  user_id: string;
  venture_name: string | null;
  industry: string | null;
  stage: string | null;
  country: string | null;
  bio: string | null;
  funding_goal: number | null;
  vantage_point: number | null;
  fundability: number | null;
}

function DemoPage() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const isInvestor = roles.includes("investor");

  const { data: ventures = [], isLoading } = useQuery({
    queryKey: ["showcase"],
    queryFn: async () => {
      const res = await dotApi.get<{ ventures: FounderShowcase[] }>("/api/founder-profiles");
      return res?.ventures ?? [];
    },
  });

  const { data: saves = [] } = useQuery({
    queryKey: ["investor-saves", user?.id],
    enabled: !!user && isInvestor,
    queryFn: async () => {
      const res = await dotApi.get<{ saves: { founderId: string }[] }>("/api/investor/saves");
      return res?.saves ?? [];
    },
  });
  const saved = new Set(saves.map((s) => s.founderId));

  async function toggleSave(founderId: string) {
    if (!user) return;
    try {
      if (saved.has(founderId)) {
        await dotApi.delete(`/api/investor/saves/${encodeURIComponent(founderId)}`);
      } else {
        await dotApi.post("/api/investor/saves", { founderId });
      }
      qc.invalidateQueries({ queryKey: ["investor-saves", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  }

  async function requestMeeting(founderId: string) {
    if (!user) return;
    try {
      await dotApi.post("/api/investor/meetings", {
        founderId,
        topic: "Intro chat",
        message: "I'd like to learn more about your venture.",
      });
      toast.success("Meeting request sent!");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send request");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="DOT Demo"
        subtitle={isInvestor ? "Investable ventures, ranked by Vantage. Save and request meetings." : "Investable ventures, ranked by Vantage. Boost your Vantage to rank higher."}
      />

      {isLoading ? (
        <PageSkeleton.CardGrid count={6} cols={3} />
      ) : ventures.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No ventures listed yet"
          description="Founders with completed Vantage assessments will appear here."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ventures.map((v) => (
            <FounderCard
              key={v.user_id}
              v={v}
              isInvestor={isInvestor}
              isSaved={saved.has(v.user_id)}
              isSelf={v.user_id === user?.id}
              onSave={() => toggleSave(v.user_id)}
              onMeet={() => requestMeeting(v.user_id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export function FounderCard({
  v,
  isInvestor,
  isSaved,
  isSelf,
  onSave,
  onMeet,
}: {
  v: FounderShowcase;
  isInvestor: boolean;
  isSaved: boolean;
  isSelf: boolean;
  onSave: () => void;
  onMeet: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-5" />
        </span>
        <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
          <Gauge className="size-3 text-primary" /> {v.vantage_point ?? 0}
        </div>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{v.venture_name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {v.industry && <Badge variant="outline">{v.industry}</Badge>}
        {v.stage && <Badge variant="secondary">{v.stage}</Badge>}
        {v.country && (
          <span className="flex items-center gap-0.5">
            <MapPin className="size-3" /> {v.country}
          </span>
        )}
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-3">{v.bio}</p>
      {v.funding_goal ? (
        <p className="mt-3 text-sm font-medium">
          Raising <span className="text-primary">{formatNaira(Number(v.funding_goal))}</span>
        </p>
      ) : null}
      {isInvestor && !isSelf && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSave}>
            {isSaved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="hero" size="sm" className="flex-1" onClick={onMeet}>
            <Send className="size-4" /> Meet
          </Button>
        </div>
      )}
    </div>
  );
}
