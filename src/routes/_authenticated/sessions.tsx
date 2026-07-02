import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, User, Loader2, Check, Coins, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { EcosystemEmptyState } from "@/components/app/EcosystemEmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dotApi } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { formatDot } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Founder Sessions — DOT" },
      { name: "description", content: "Register for live founder sessions with operators and investors." },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await dotApi.get<{ events: any[] }>("/api/events");
      return res?.events ?? [];
    },
  });

  // Registrations: fetch the user's registered event IDs from the API
  // so the "Register" button reflects real state across reloads.
  const registrationsQ = useQuery({
    queryKey: ["event-registrations-me"],
    queryFn: async () => {
      const res = await dotApi.get<{
        registrations: { eventId: string; attended: boolean }[];
      }>("/api/events/registrations/me");
      return res?.registrations ?? [];
    },
  });
  const registered = new Set<string>(
    (registrationsQ.data ?? []).map((r) => r.eventId)
  );

  async function register(eventId: string, cost: number) {
    if (!user) return;
    try {
      if (cost > 0) {
        await dotApi.post("/api/wallet/spend", {
          amount: cost,
          description: "Session registration",
          type: "Event Registration",
        });
      }
      await dotApi.post(`/api/events/${eventId}/register`, {});
      qc.invalidateQueries({ queryKey: ["event-registrations-me"] });
      qc.invalidateQueries({ queryKey: ["my-registrations"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(cost > 0 ? `Registered! ${formatDot(cost)} DOT spent.` : "Registered!");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not register");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Founder Sessions"
        subtitle="Live access to operators, experts and investors. Pay with DOT."
      />

      {isLoading ? (
              <PageSkeleton.CardGrid count={4} cols={2} />
            ) : events.length === 0 ? (
              <EcosystemEmptyState
                icon={CalendarCheck}
                title="No founder sessions scheduled"
                subtitle="Live access to operators, experts and investors. Sessions are paid with DOT — register to claim a seat."
                postedBy="Admins and Capital Partners"
                requiredRole={["admin", "capital_partner"]}
                accent="teal"
                secondaryAction={{ label: "Browse the network", href: "/discover" }}
              />
            ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((ev: any) => {
            const isReg = registered.has(ev.id);
            return (
              <article
                key={ev.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {ev.title}
                  </h3>
                  {ev.dotCost > 0 ? (
                    <Badge variant="default">
                      <Coins className="size-3" /> {formatDot(ev.dotCost)}
                    </Badge>
                  ) : (
                    <Badge>Free</Badge>
                  )}
                </div>
                {ev.speaker && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="size-3" /> {ev.speaker}
                  </p>
                )}
                {ev.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{ev.description}</p>
                )}
                {ev.eventDate && (
                  <p className="mt-3 text-xs font-medium text-foreground">
                    {new Date(ev.eventDate).toLocaleString()}
                  </p>
                )}
                <Button
                  className="mt-4 w-full"
                  variant={isReg ? "outline" : "hero"}
                  size="sm"
                  disabled={isReg && !ev.whopUrl}
                  onClick={() => !isReg && register(ev.id, ev.dotCost ?? 0)}
                >
                  {isReg ? (
                    ev.whopUrl ? (
                      <a href={ev.whopUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 w-full justify-center">
                        <Check className="size-4" /> Join on Whop
                      </a>
                    ) : (
                      <><Check className="size-4" /> Registered</>
                    )
                  ) : ev.dotCost > 0 ? (
                    <><Coins className="size-4" /> Pay {formatDot(ev.dotCost)} DOT</>
                  ) : (
                    "Register free"
                  )}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
