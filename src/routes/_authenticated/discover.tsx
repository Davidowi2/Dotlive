import { createFileRoute } from "@tanstack/react-router";
import { Search, Building2, Users, BookOpen, Trophy, Gauge, MapPin, TrendingUp } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — DOT" }] }),
  component: DiscoverPage,
});

const VENTURES = [
  { id: "1", name: "PayAfrika", founder: "Amara Okafor", location: "Lagos", industry: "Fintech", vantage: 720, stage: "Validate" },
  { id: "2", name: "AgriConnect", founder: "Oghenetega Efe", location: "Abuja", industry: "Agriculture", vantage: 680, stage: "Improve" },
  { id: "3", name: "MamaList", founder: "Chisom Nwosu", location: "Enugu", industry: "Commerce", vantage: 650, stage: "Assess" },
  { id: "4", name: "KoboPay", founder: "Kwame Asante", location: "Accra", industry: "Fintech", vantage: 810, stage: "Fund" },
  { id: "5", name: "HealthBridge", founder: "Fatima Diallo", location: "Nairobi", industry: "Health", vantage: 590, stage: "Learn" },
  { id: "6", name: "SolarGrid Africa", founder: "Tendai Moyo", location: "Cape Town", industry: "Energy", vantage: 740, stage: "Scale" },
];

const COMMUNITIES = [
  { id: "1", name: "Lagos Builders", leader: "Bola Adeyemi", members: 48, region: "Lagos, Nigeria" },
  { id: "2", name: "Nairobi Tech Founders", leader: "Grace Wanjiku", members: 62, region: "Nairobi, Kenya" },
  { id: "3", name: "Accra Startup Hub", leader: "Kwesi Mensah", members: 35, region: "Accra, Ghana" },
];

function DiscoverPage() {
  const [query, setQuery] = useState("");

  const filteredVentures = VENTURES.filter(
    (v) => !query || v.name.toLowerCase().includes(query.toLowerCase()) || v.founder.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell>
      <PageHeader title="Discover" subtitle="Search ventures, communities, and opportunities across the DOT network." />

      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ventures, founders, communities…"
          className="h-12 pl-12 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="ventures" className="mt-6">
        <TabsList>
          <TabsTrigger value="ventures">Ventures ({filteredVentures.length})</TabsTrigger>
          <TabsTrigger value="communities">Communities ({COMMUNITIES.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ventures" className="mt-4">
          {filteredVentures.length === 0 ? (
            <EmptyState icon={Building2} title="No ventures found" description="Try a different search term." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVentures.map((v) => (
                <div key={v.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </span>
                    <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      <Gauge className="size-3 text-primary" /> {v.vantage}
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">{v.name}</h3>
                  <p className="text-sm text-muted-foreground">{v.founder}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{v.industry}</Badge>
                    <Badge variant="secondary">{v.stage}</Badge>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MapPin className="size-3" />{v.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communities" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITIES.map((c) => (
              <div key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.leader}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><TrendingUp className="size-3" />{c.members} members</span>
                  <span className="flex items-center gap-1"><MapPin className="size-3" />{c.region}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
