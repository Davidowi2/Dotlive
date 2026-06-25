/**
 * /c/$id — Public community hub
 *
 * Anyone can view a community's public page. Shows name, description,
 * member count, and invite code. Marketing-friendly, no auth required.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { dotApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/c/$id")({
  head: () => ({ meta: [{ title: "Community Hub — DOT" }] }),
  component: CommunityHubPage,
});

function CommunityHubPage() {
  const { id } = Route.useParams();
  const hubQ = useQuery({
    queryKey: ["community_hub", id],
    queryFn: async () => {
      return dotApi.get<any>(`/api/communities/${id}/hub`);
    },
  });

  const data = hubQ.data;
  const comm = data?.community;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={comm?.name ?? "Community"} subtitle={comm?.description ?? ""} />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">{comm?.name ?? "Loading…"}</h1>
              <p className="text-sm text-muted-foreground">{comm?.description}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Members</div>
              <div className="mt-1 font-display text-2xl font-bold">{data?.memberCount ?? 0}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Referral</div>
              <div className="mt-1 font-mono text-lg">{comm?.referralCode ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Founded</div>
              <div className="mt-1 font-display text-lg">
                {comm?.createdAt ? new Date(comm.createdAt).toLocaleDateString() : "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="hero" asChild>
              <Link to={`/join/${comm?.referralCode ?? ""}`}>
                Join <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/discover">Browse communities</Link>
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Sparkles className="mr-2 inline size-4 text-primary" />
            Community rankings, top ventures, and recent events will populate as the community grows.
          </div>
        </div>
      </div>
    </div>
  );
}