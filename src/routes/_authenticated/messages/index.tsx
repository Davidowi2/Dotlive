/**
 * Meetings — Direct conversations between investors and founders.
 *
 * Flow:
 *   1. Investor requests a meeting on DOT Demo
 *   2. Founder accepts → chat thread opens automatically
 *   3. Both parties can now DM each other here (like Instagram DMs)
 *
 * Polled every 5s for new messages.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users, ChevronRight, Clock, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listMyConnections, type Connection } from "@/api/connections";
import { getUserPublic } from "@/api/users";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useQuery as useQ } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Meetings · DOT" }] }),
  component: MeetingsIndex,
});

function MeetingsIndex() {
  const { user } = useDotAuth();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: listMyConnections,
    refetchInterval: 5_000,
    staleTime: 4_000,
  });

  const active = connections.filter((c) => c.status === "active");
  const closed = connections.filter((c) => c.status === "closed");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Direct"
        title="Meetings"
        subtitle="Conversations opened when an investor's meeting request is accepted."
        action={
          active.length > 0 ? (
            <Badge variant="outline" className="font-medium">
              <Users className="mr-1.5 size-3" />
              {active.length} active
            </Badge>
          ) : undefined
        }
      />

      <section className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/40" />)}
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/50 mb-3" />
            <p className="font-display text-lg font-light">No meetings yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              When an investor requests a meeting and you accept it,
              a private chat opens here — like Instagram DMs.
            </p>
            <Button asChild variant="hero" size="sm" className="mt-4">
              <Link to="/demo">Browse investors on DOT Demo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active first */}
            {active.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Active</p>
            )}
            {active.map(c => (
              <ThreadRow key={c.id} c={c} currentUserId={user?.id} />
            ))}

            {/* Closed */}
            {closed.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-6 mb-2">Closed</p>
                {closed.map(c => (
                  <ThreadRow key={c.id} c={c} currentUserId={user?.id} closed />
                ))}
              </>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ThreadRow({ c, currentUserId, closed = false }: {
  c: Connection;
  currentUserId?: string;
  closed?: boolean;
}) {
  // Show the OTHER person's name, not just a UUID
  const otherId = c.userAId === currentUserId ? c.userBId : c.userAId;

  const { data: otherUser } = useQ({
    queryKey: ["user-public", otherId],
    queryFn: () => getUserPublic(otherId).catch(() => null),
    enabled: !!otherId,
    staleTime: 120_000,
  });

  const name = otherUser?.name ?? `User ${otherId?.slice(0, 8) ?? ""}`;
  const initials = (name).charAt(0).toUpperCase();

  return (
    <Link
      to="/messages/$id"
      params={{ id: c.id }}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm",
        closed ? "border-border/50 opacity-60" : "border-border"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm",
        closed ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
      )}>
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{name}</p>
          {!closed && (
            <span className="size-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="size-3" />
          {closed ? "Closed · " : "Opened · "}
          {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Status + arrow */}
      <div className="flex items-center gap-2 shrink-0">
        {closed ? (
          <Badge variant="secondary" className="text-[10px]">Closed</Badge>
        ) : (
          <Badge variant="default" className="text-[10px] bg-primary/10 text-primary border-0">Active</Badge>
        )}
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
      </div>
    </Link>
  );
}
