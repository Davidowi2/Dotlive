import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Loader2, Upload, Medal, FileText, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useFounderProfile } from "@/hooks/use-dot-data";
import { uploadDocument, getSignedUrl } from "@/lib/upload";
import { formatNaira } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pitchathons")({
  head: () => ({
    meta: [
      { title: "Pitchathons — DOT" },
      { name: "description", content: "Compete in DOT Pitchathons and get in front of investors." },
    ],
  }),
  component: PitchathonsPage,
});

function PitchathonsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: founder } = useFounderProfile();
  const [active, setActive] = useState<string | null>(null);
  const [ventureName, setVentureName] = useState("");
  const [fundingAsk, setFundingAsk] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: pitchathons = [], isLoading } = useQuery({
    queryKey: ["pitchathons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pitchathons").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: myApps = [] } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pitchathon_applications")
        .select("*")
        .eq("founder_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const appliedTo = new Set(myApps.map((a) => a.pitchathon_id));

  async function submitApplication() {
    if (!user || !active) return;
    setBusy(true);
    try {
      let deckPath: string | null = null;
      if (file) deckPath = await uploadDocument(user.id, "pitch-decks", file);
      const { error } = await supabase.from("pitchathon_applications").insert({
        pitchathon_id: active,
        founder_id: user.id,
        venture_name: ventureName || founder?.venture_name,
        funding_ask: fundingAsk ? Number(fundingAsk) : null,
        pitch_deck_url: deckPath,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-applications", user.id] });
      toast.success("Application submitted!");
      setActive(null);
      setVentureName("");
      setFundingAsk("");
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Pitchathons"
        subtitle="Submit your venture, get scored by judges, and climb the leaderboard."
      />

      {isLoading ? (
        <PageSkeleton.CardGrid count={3} cols={1} />
      ) : pitchathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No pitchathons yet"
          description="Check back soon — upcoming competitions will appear here."
        />
      ) : (
        <div className="mt-6 space-y-6">
          {pitchathons.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-gold" />
                    <h2 className="font-display text-xl font-semibold">{p.title}</h2>
                    <Badge variant={p.status === "open" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{p.description}</p>
                  {p.prize && <p className="mt-2 text-sm font-medium text-gold">Prize: {p.prize}</p>}
                </div>
                {appliedTo.has(p.id) ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Applied</Badge>
                    <ViewDeckButton pitchathonId={p.id} founderId={user?.id ?? ""} />
                  </div>
                ) : p.status === "open" ? (
                  <Button variant="hero" onClick={() => { setActive(p.id); setVentureName(founder?.venture_name ?? ""); }}>
                    Apply
                  </Button>
                ) : null}
              </div>
              <Leaderboard pitchathonId={p.id} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to pitchathon</DialogTitle>
            <DialogDescription>Submit your venture details and pitch deck.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vn">Venture name</Label>
              <Input id="vn" value={ventureName} onChange={(e) => setVentureName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ask">Funding ask (₦)</Label>
              <Input id="ask" type="number" value={fundingAsk} onChange={(e) => setFundingAsk(e.target.value)} placeholder="5000000" />
              {fundingAsk && <p className="text-xs text-muted-foreground">{formatNaira(Number(fundingAsk))}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck">Pitch deck (PDF)</Label>
              <Input id="deck" type="file" accept=".pdf,.ppt,.pptx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file && <p className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="size-3" /> {file.name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="hero" onClick={submitApplication} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Submit application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Leaderboard({ pitchathonId }: { pitchathonId: string }) {
  const { data } = useQuery({
    queryKey: ["leaderboard", pitchathonId],
    queryFn: async () => {
      // Uses a security-definer RPC that returns only venture name + average
      // score, so individual judge scores and applications stay private.
      const { data: rows, error } = await supabase.rpc("get_pitchathon_leaderboard", {
        _pitchathon_id: pitchathonId,
      });
      if (error) throw error;
      return (rows ?? [])
        .map((r) => ({
          id: r.application_id,
          name: r.venture_name ?? "Unnamed",
          avg: Number(r.avg_score),
          count: Number(r.score_count),
        }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.avg - a.avg);
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-5 rounded-xl border border-border">
      <p className="border-b border-border px-4 py-2 text-sm font-medium">Leaderboard</p>
      <ul className="divide-y divide-border">
        {data.map((row, i) => (
          <li key={row.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs font-bold",
              i === 0 ? "bg-gold/20 text-gold" : i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              {i < 3 ? <Medal className="size-4" /> : i + 1}
            </span>
            <span className="flex-1 text-sm font-medium">{row.name}</span>
            <span className="text-sm text-muted-foreground">
              {row.count > 0 ? `${row.avg.toFixed(1)} (${row.count})` : "Not scored"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * ViewDeckButton — fetches a signed URL for the founder's uploaded pitch deck
 * and opens it in a new tab. Renders nothing if no deck was uploaded.
 */
function ViewDeckButton({ pitchathonId, founderId }: { pitchathonId: string; founderId: string }) {
  const [loading, setLoading] = useState(false);

  async function openDeck() {
    if (!founderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pitchathon_applications")
        .select("pitch_deck_url")
        .eq("pitchathon_id", pitchathonId)
        .eq("founder_id", founderId)
        .maybeSingle();

      if (error || !data?.pitch_deck_url) {
        toast.error("No pitch deck found for this application.");
        return;
      }

      const signedUrl = await getSignedUrl(data.pitch_deck_url);
      if (!signedUrl) {
        toast.error("Could not generate a download link. Please try again.");
        return;
      }

      window.open(signedUrl, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open deck");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={openDeck} disabled={loading}>
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ExternalLink className="size-3.5" />
      )}
      View deck
    </Button>
  );
}
