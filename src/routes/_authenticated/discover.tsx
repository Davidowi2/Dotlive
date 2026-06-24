import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Compass, Search, X, Filter, Sparkles, Building2, Users, MapPin,
  ArrowUpRight, Gauge, TrendingUp, Briefcase, Plus,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — DOT" }] }),
  component: DiscoverPage,
});

/* Discover page — real listings load from Supabase via discoverService
 * once the service is wired. Until then we show honest empty states
 * with clear "be the first" CTAs instead of fake founders. */
const INDUSTRIES = ["All", "Fintech", "Agriculture", "Commerce", "Health", "Energy", "Education"];
const STAGES = ["All", "Assess", "Learn", "Improve", "Validate", "Pitch", "Fund", "Scale"];

function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Network"
        title="Discover"
        subtitle="Browse ventures, founders and communities across the DOT network."
        action={
          <Button variant="hero" size="sm" asChild>
            <Link to="/vantage">
              List your venture <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {/* ─── Search + filters ──────────────────────────────────────── */}
      <section className="mt-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ventures, founders, communities…"
            className="h-12 pl-12 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Filter className="size-3" />
            Industry
          </span>
          {INDUSTRIES.map((i) => (
            <button
              key={i}
              onClick={() => setIndustry(i)}
              disabled
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                industry === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground opacity-60",
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Top Vantage this week ─────────────────────────────────── */}
      <section className="mt-10">
        <PageHeader
          variant="compact"
          title="Top Vantage this week"
          subtitle="Live leaderboard activates once enough ventures reach Stage: Improve."
          action={
            <Badge variant="secondary" className="text-[10px]">
              <Sparkles className="mr-1 size-3" />
              Coming soon
            </Badge>
          }
        />

        <div className="mt-5 rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TrendingUp className="size-7" />
          </div>
          <h3 className="mt-5 font-display text-xl font-light">No leaderboard yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Once founders complete Vantage assessments and reach Stage: Improve, the top 3 will appear here automatically.
          </p>
        </div>
      </section>

      <hr className="my-12 border-border" />

      {/* ─── Browse tabs ──────────────────────────────────────────── */}
      <section>
        <Tabs defaultValue="ventures">
          <div className="flex items-end justify-between gap-4">
            <TabsList>
              <TabsTrigger value="ventures">
                <Building2 className="mr-1.5 size-3.5" /> Ventures
              </TabsTrigger>
              <TabsTrigger value="communities">
                <Users className="mr-1.5 size-3.5" /> Communities
              </TabsTrigger>
              <TabsTrigger value="people">
                <Briefcase className="mr-1.5 size-3.5" /> Founders
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ventures" className="mt-4">
            <EmptyStateCategory
              icon={Building2}
              title="No ventures listed yet"
              body="The discover feed lights up as soon as founders complete Vantage and reach Stage: Improve. Be the first."
              cta={{ label: "Complete Vantage assessment", to: "/vantage" }}
            />
          </TabsContent>

          <TabsContent value="communities" className="mt-4">
            <EmptyStateCategory
              icon={Users}
              title="No communities listed yet"
              body="Community leaders can register their communities and surface to builders here."
              cta={{ label: "Register your community", to: "/community" }}
            />
          </TabsContent>

          <TabsContent value="people" className="mt-4">
            <EmptyStateCategory
              icon={Compass}
              title="No founder profiles yet"
              body="Public founder profiles appear here once they're at Stage: Improve or beyond."
              cta={{ label: "See your profile", to: "/profile" }}
            />
          </TabsContent>
        </Tabs>
      </section>

      <hr className="my-12 border-border" />

      {/* ─── How discover works ───────────────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-3">
        <InfoCard
          icon={Gauge}
          title="Filtered by Vantage"
          body="All listings are sorted by Vantage score. Investors filter by score range and stage."
        />
        <InfoCard
          icon={MapPin}
          title="Across 54 countries"
          body="Discover shows ventures from every African country. Filter by region, industry, or stage."
        />
        <InfoCard
          icon={Sparkles}
          title="Premium visibility"
          body="Verified ventures (Vantage 700+) get a gold dot and surface to the top of investor searches."
        />
      </section>
    </AppShell>
  );
}

/* Reusable empty state for each category tab */
function EmptyStateCategory({
  icon: Icon, title, body, cta,
}: {
  icon: typeof Building2;
  title: string;
  body: string;
  cta: { label: string; to: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <h3 className="mt-5 font-display text-xl font-light">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <Button variant="hero" size="sm" asChild className="mt-6">
        <Link to={cta.to}>
          {cta.label} <ArrowUpRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function InfoCard({
  icon: Icon, title, body,
}: {
  icon: typeof Gauge;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h4 className="mt-4 font-display text-base font-semibold">{title}</h4>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}