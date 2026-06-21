import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin, Globe, Gauge, TrendingUp, Target, BookOpen, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/founder/$id")({
  head: () => ({ meta: [{ title: "Founder Profile — DOT" }] }),
  component: PublicFounderProfile,
});

// Mock — replace with real Supabase query when backend is wired
const MOCK = {
  name: "Amara Okafor",
  venture: "PayAfrika",
  bio: "Building Africa's first cross-border micro-payment infrastructure for gig workers and informal traders.",
  industry: "Fintech",
  country: "Lagos, Nigeria",
  stage: "Validate",
  vantage: 720,
  fundability: 68,
  investmentReadiness: 72,
  website: "payafrika.io",
  fundingGoal: "₦5,000,000",
  courses: ["LEAPFROG Foundations", "Venture Design Thinking", "Customer Discovery"],
  pitchathons: ["Lagos Startup Battle — #3", "West Africa Demo Day — Finalist"],
};

function PublicFounderProfile() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl [background-image:var(--gradient-primary)] font-display text-3xl font-bold text-primary-foreground shadow-glow">
              {MOCK.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-bold">{MOCK.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="size-3.5" />{MOCK.venture}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><MapPin className="size-3.5" />{MOCK.country}</span>
                {MOCK.website && (
                  <>
                    <span>·</span>
                    <a href={`https://${MOCK.website}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="size-3.5" />{MOCK.website}
                    </a>
                  </>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{MOCK.industry}</Badge>
                <Badge variant="secondary">{MOCK.stage}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground max-w-xl">{MOCK.bio}</p>
              {MOCK.fundingGoal && (
                <p className="mt-2 text-sm font-medium">Raising <span className="text-primary">{MOCK.fundingGoal}</span></p>
              )}
              <Button variant="hero" size="sm" className="mt-4">Request meeting</Button>
            </div>
          </div>

          {/* Vantage scores */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Vantage Point", value: `${MOCK.vantage}`, sub: "/ 1000", icon: Gauge },
              { label: "Fundability", value: `${MOCK.fundability}%`, sub: "ready to raise", icon: TrendingUp },
              { label: "Investment Ready", value: `${MOCK.investmentReadiness}%`, sub: "score", icon: Target },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <s.icon className="size-4 text-primary" />
                </div>
                <p className="mt-3 font-display text-3xl font-bold tabular">
                  {s.value}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">{s.sub}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Academy & Pitchathons */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="size-4 text-primary" />
                <h2 className="font-display font-semibold">Academy ({MOCK.courses.length})</h2>
              </div>
              <ul className="space-y-2">
                {MOCK.courses.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />{c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="size-4 text-gold" />
                <h2 className="font-display font-semibold">Pitchathons ({MOCK.pitchathons.length})</h2>
              </div>
              <ul className="space-y-2">
                {MOCK.pitchathons.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-gold shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
