/**
 * Sessions — Live founder sessions, seminars, and expert talks.
 *
 * Sessions are live events created by Operators in /admin.
 * Each event can have:
 *   - A Whop URL (live stream on Whop)
 *   - An external URL (Zoom, Google Meet, YouTube Live)
 *   - A DOT cost to register
 *
 * Flow: Browse → Register (spend DOT) → Get join link
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck, User, Loader2, Check, Coins, ExternalLink,
  Video, Radio, Clock, MapPin, Users, ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EcosystemEmptyState } from "@/components/app/EcosystemEmptyState";
import { dotApi } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { formatDot } from "@/lib/constants";
import { isWhopConfigured } from "@/lib/whop";
import { createCheckout } from "@/api/academy";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Founder Sessions — DOT" },
      {
        name: "description",
        content: "Register for live founder sessions with operators and investors.",
      },
    ],
  }),
  ssr: false,
  component: SessionsPage,
});

function isUpcoming(dateStr: string | null) {
  if (!dateStr) return true;
  return new Date(dateStr) > new Date();
}

function isLive(dateStr: string | null) {
  if (!dateStr) return false;
  const start = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  // Consider "live" for 3 hours after start
  return diffMs >= 0 && diffMs < 3 * 60 * 60 * 1000;
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
}

function SessionsPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await dotApi.get<{ events: any[] }>("/api/events");
      return res?.events ?? [];
    },
    staleTime: 60_000,
  });

  const registrationsQ = useQuery({
    queryKey: ["event-registrations-me"],
    queryFn: async () => {
      const res = await dotApi.get<{ registrations: { eventId: string; attended: boolean }[] }>(
        "/api/events/registrations/me"
      );
      return res?.registrations ?? [];
    },
  });
  const registered = new Set<string>((registrationsQ.data ?? []).map((r) => r.eventId));
  
  // Split events into upcoming and past
  const upcoming = events.filter(e => isUpcoming(e.eventDate));
  const past = events.filter(e => !isUpcoming(e.eventDate));

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
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(cost > 0 ? `Registered! ${formatDot(cost)} DOT spent.` : "You're registered!");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not register");
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">Founder Sessions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live access to operators, experts and investors.
      </p>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-red-500">{error}</p>
      ) : (
        <>
          {/* Upcoming */}
          <section>
            <h2 className="font-display text-lg font-light tracking-tight mb-4 text-muted-foreground">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((e) => (
                  <SessionCard
                    key={e.id}
                    ev={e}
                    isReg={registered.has(e.id)}
                    onRegister={() => register(e.id, e.dot_cost)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-lg font-light tracking-tight mb-4 text-muted-foreground">
                Past sessions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((ev) => (
                  <SessionCard
                    key={ev.id}
                    ev={ev}
                    isReg={registered.has(ev.id)}
                    onRegister={() => {}}
                    isPast
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function SessionCard({ ev, isReg, onRegister, isPast = false }: {
  ev: any;
  isReg: boolean;
  onRegister: () => void;
  isPast?: boolean;
}) {
  const live = isLive(ev.eventDate);

  return (
    <article className={cn(
      "rounded-2xl border bg-card p-5 transition-colors",
      live ? "border-primary/40 bg-primary/5" : "border-border hover:border-foreground/20",
      isPast && "opacity-70"
    )}>
      {/* Live badge */}
      {live && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
          <span className="size-1.5 rounded-full bg-current animate-pulse" />
          Live now
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold leading-tight flex-1">{ev.title}</h3>
        {ev.dotCost > 0 ? (
          <Badge variant="default" className="shrink-0">
            <Coins className="size-2.5 mr-1" />{formatDot(ev.dotCost)} DOT
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">Free</Badge>
        )}
      </div>

      {ev.speaker && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="size-3" /> {ev.speaker}
        </p>
      )}

      {ev.eventDate && (
        <p className={cn(
          "mt-2 flex items-center gap-1.5 text-xs font-medium",
          live ? "text-primary" : "text-foreground"
        )}>
          <Clock className="size-3" />
          {formatEventDate(ev.eventDate)}
        </p>
      )}

      {ev.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
      )}

      {/* Action button */}
      <div className="mt-4">
        {isPast ? (
          <Button size="sm" variant="ghost" disabled className="w-full text-muted-foreground">
            Session ended
          </Button>
        ) : isReg ? (
          ev.whopUrl ? (
            <Button size="sm" variant="hero" asChild className="w-full">
              <a href={ev.whopUrl} target="_blank" rel="noopener noreferrer">
                <Video className="size-3.5 mr-1.5" />
                {live ? "Join live now" : "Join session"} <ExternalLink className="ml-1 size-3" />
              </a>
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              <Check className="size-4" /> Registered — join link coming soon
            </div>
          )
        ) : (
          <Button
            size="sm"
            variant={live ? "hero" : "default"}
            className="w-full"
            onClick={onRegister}
          >
            {ev.dotCost > 0
              ? <><Coins className="size-3.5 mr-1.5" /> Register · {formatDot(ev.dotCost)} DOT</>
              : live
                ? <><Video className="size-3.5 mr-1.5" /> Join live now</>
                : "Register free"
            }
          </Button>
        )}
      </div>

      {/* Session type indicator */}
      <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
        {ev.whopUrl ? "Live stream on Whop" : "Join link sent after registration"}
      </p>
    </article>
  );
}
