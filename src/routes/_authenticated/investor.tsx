import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Bookmark } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { dotApi } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { INDUSTRIES, JOURNEY_STAGES } from "@/lib/constants";
import { FounderCard, type FounderShowcase } from "./demo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/investor")({
  head: () => ({
    meta: [
      { title: "Investor Portal — DOT" },
      { name: "description", content: "Browse, filter and connect with African ventures." },
    ],
  }),
  component: InvestorPage,
});

function InvestorPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const [industry, setIndustry] = useState("all");
  const [stage, setStage] = useState("all");
  const [minVantage, setMinVantage] = useState(0);
  const [savedOnly, setSavedOnly] = useState(false);

  /* Showcases (ventures from founder_profiles). */
  const { data: ventures = [], isLoading } = useQuery({
    queryKey: ["showcase"],
    queryFn: async () => {
      const res = await dotApi.get<{ ventures: FounderShowcase[] }>(
        "/api/founder-profiles",
      );
      return res?.ventures ?? [];
    },
  });

  const { data: saves = [] } = useQuery({
    queryKey: ["investor-saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await dotApi.get<{ saves: { founderId: string }[] }>(
        "/api/investor/saves",
      );
      return res?.saves ?? [];
    },
  });
  const saved = new Set(saves.map((s) => s.founderId));

  const filtered = useMemo(
    () =>
      ventures.filter((v) => {
        if (industry !== "all" && v.industry !== industry) return false;
        if (stage !== "all" && v.stage !== stage) return false;
        if ((v.vantage_point ?? 0) < minVantage) return false;
        if (savedOnly && !saved.has(v.user_id)) return false;
        return true;
      }),
    [ventures, industry, stage, minVantage, savedOnly, saved],
  );

  async function toggleSave(founderId: string) {
    if (!user) return;
    try {
      if (saved.has(founderId)) {
        await dotApi.delete(`/api/investor/saves/${encodeURIComponent(founderId)}`);
      } else {
        await dotApi.post("/api/investor/saves", { founderId });
      }
      qc.invalidateQueries({ queryKey: ["investor-saves", user.id] });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update");
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
        title="Investor Portal"
        subtitle="Discover and connect with vetted African ventures."
      />

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4 text-primary" /> Filters
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs text-muted-foreground">Industry</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Stage</label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {JOURNEY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Min Vantage: {minVantage}</label>
            <Slider className="mt-3" value={[minVantage]} onValueChange={([v]) => setMinVantage(v)} max={1000} step={50} />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setSavedOnly((s) => !s)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${savedOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              <Bookmark className="size-4" /> Saved only
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Badge variant="secondary">{filtered.length} ventures</Badge>
      </div>

      {isLoading ? (
        <PageSkeleton.CardGrid count={6} cols={3} />
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <FounderCard
              key={v.user_id}
              v={v}
              isInvestor
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
