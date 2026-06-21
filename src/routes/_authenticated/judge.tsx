import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Star, FileText, CheckCircle2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/judge")({
  head: () => ({ meta: [{ title: "Judge Portal — DOT" }] }),
  component: JudgePage,
});

const MOCK_APPLICATIONS = [
  { id: "1", venture: "PayAfrika", founder: "Amara Okafor", ask: "₦5,000,000", deck: true, scored: false, vantage: 720 },
  { id: "2", venture: "AgriConnect", founder: "Oghenetega Efe", ask: "₦2,500,000", deck: true, scored: true, avgScore: 7.8, vantage: 680 },
  { id: "3", venture: "KoboPay", founder: "Kwame Asante", ask: "₦10,000,000", deck: false, scored: false, vantage: 810 },
  { id: "4", venture: "MamaList", founder: "Chisom Nwosu", ask: "₦1,500,000", deck: true, scored: true, avgScore: 8.4, vantage: 650 },
];

function JudgePage() {
  const [scoring, setScoring] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState("");

  const pending = MOCK_APPLICATIONS.filter((a) => !a.scored).length;

  return (
    <AppShell>
      <PageHeader
        title="Judge Portal"
        subtitle="Score pitchathon applications and help surface the best ventures."
        action={<Badge variant="secondary"><Trophy className="mr-1 size-3" />{pending} to score</Badge>}
      />

      {MOCK_APPLICATIONS.length === 0 ? (
        <EmptyState icon={Trophy} title="No applications assigned" description="You haven't been assigned as a judge for any pitchathons yet." />
      ) : (
        <div className="mt-6 space-y-4">
          {MOCK_APPLICATIONS.map((app) => (
            <div key={app.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{app.venture}</h3>
                    <Badge variant={app.scored ? "default" : "secondary"}>
                      {app.scored ? `Scored ${app.avgScore}` : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {app.founder} · Raising {app.ask} · Vantage {app.vantage}
                  </p>
                </div>
                <div className="flex gap-2">
                  {app.deck && (
                    <Button variant="outline" size="sm">
                      <FileText className="size-4" /> Pitch deck
                    </Button>
                  )}
                  {!app.scored && (
                    <Button variant="hero" size="sm" onClick={() => { setScoring(app.id); setScore(5); setFeedback(""); }}>
                      <Star className="size-4" /> Score
                    </Button>
                  )}
                </div>
              </div>

              {scoring === app.id && (
                <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">Score (1–10)</p>
                    <div className="flex gap-2 flex-wrap">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <button
                          key={n}
                          onClick={() => setScore(n)}
                          className={cn(
                            "flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-all",
                            score === n ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Feedback (optional)</p>
                    <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What stood out? What needs work?" rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="hero" onClick={() => setScoring(null)}>
                      <CheckCircle2 className="size-4" /> Submit score
                    </Button>
                    <Button variant="outline" onClick={() => setScoring(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
