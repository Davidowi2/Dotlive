import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Trophy, Vote, Loader2, Sparkles, ArrowRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dotApi } from "@/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo/")({
  head: () => ({ meta: [{ title: "DOT Demo Events — DOT" }] }),
  component: DemoEventsPage,
});

interface DemoEvent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startDate: string | Date;
  endDate: string | Date;
  registrationDeadline: string | Date | null;
  votingOpensAt: string | Date | null;
  votingClosesAt: string | Date | null;
  tracks: string[];
  sponsors: any[];
  judges: any[];
  prizePoolDot: string | null;
  status: string;
  livestreamUrl: string | null;
  registrationFeeDot: string | null;
}

function statusColor(status: string) {
  return status === "live" ? "bg-red-500/10 text-red-600"
    : status === "voting_open" ? "bg-blue-500/10 text-blue-700"
    : status === "registration_open" ? "bg-primary/10 text-primary"
    : status === "completed" ? "bg-muted text-muted-foreground"
    : "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  return status === "live" ? "LIVE NOW"
    : status === "voting_open" ? "VOTING OPEN"
    : status === "registration_open" ? "REGISTRATION OPEN"
    : status === "completed" ? "COMPLETED"
    : "UPCOMING";
}

function useCountdown(target: string | Date | null) {
  if (!target) return null;
  const t = new Date(target).getTime();
  const now = Date.now();
  const diff = t - now;
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Countdown({ to, label }: { to: string | Date | null; label: string }) {
  const c = useCountdown(to);
  if (!c) return null;
  if (c.expired) return <span className="text-xs text-muted-foreground">{label}: ended</span>;
  return (
    <div className="flex items-center gap-2 text-xs">
      <Clock className="size-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium tabular-nums">
        {c.days}d {c.hours}h {c.minutes}m
      </span>
    </div>
  );
}

function DemoEventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["demo-events"],
    queryFn: async () => {
      const res = await dotApi.get<{ events: DemoEvent[] }>("/api/demo/events");
      return res.events ?? [];
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="DOT Demo Events" subtitle="Loading events..." />
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }

  const now = Date.now();
  const live = events.filter(e => e.status === "live" || (new Date(e.startDate).getTime() <= now && new Date(e.endDate).getTime() >= now));
  const open = events.filter(e => e.status === "registration_open" || e.status === "voting_open");
  const upcoming = events.filter(e => e.status === "upcoming" && new Date(e.startDate).getTime() > now);
  const past = events.filter(e => e.status === "completed" || new Date(e.endDate).getTime() < now);

  return (
    <AppShell>
      <PageHeader
        title="DOT Demo"
        subtitle="Pitch. Vote. Get funded. Live venture competitions across Africa."
      />

      {/* Marquee / Hero */}
      {live[0] && (
        <Card className="mb-8 overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-gold/10">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4 animate-pulse" />
              LIVE NOW
            </div>
            <Link to="/demo/$slug" params={{ slug: live[0].slug }}>
              <h2 className="mt-2 text-3xl font-bold">{live[0].name}</h2>
              <p className="mt-2 text-muted-foreground line-clamp-2">{live[0].description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Trophy className="size-4 text-gold" />
                  {live[0].prizePoolDot ? `${Number(live[0].prizePoolDot).toLocaleString()} DOT prize pool` : ""}
                </div>
                <div className="flex items-center gap-1.5">
                  <Vote className="size-4 text-primary" />
                  {live[0].sponsors?.length ?? 0} sponsors · {live[0].judges?.length ?? 0} judges
                </div>
              </div>
              <Button className="mt-5">Watch live <ArrowRight className="size-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Open + Voting */}
      {open.length > 0 && (
        <section className="mb-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open now</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {open.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Past events</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="size-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No events scheduled</h3>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon.</p>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function EventCard({ event }: { event: DemoEvent }) {
  return (
    <Link to="/demo/$slug" params={{ slug: event.slug }} className="group">
      <Card className="h-full transition group-hover:border-primary/50 group-hover:shadow-soft">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 group-hover:text-primary transition">{event.name}</CardTitle>
            <Badge className={cn("shrink-0 text-[10px] uppercase tracking-wider", statusColor(event.status))}>
              {statusLabel(event.status)}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
            {event.prizePoolDot && (
              <div className="flex items-center gap-1 text-gold">
                <Trophy className="size-3.5" />
                {Number(event.prizePoolDot).toLocaleString()} DOT
              </div>
            )}
            {event.tracks?.length > 0 && (
              <div className="flex items-center gap-1">
                {event.tracks.map(t => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{t}</span>
                ))}
              </div>
            )}
          </div>
          <Countdown to={event.votingClosesAt ?? event.startDate} label={event.votingClosesAt ? "Voting ends" : "Starts"} />
        </CardContent>
      </Card>
    </Link>
  );
}