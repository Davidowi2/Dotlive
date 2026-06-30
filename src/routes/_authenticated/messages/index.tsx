/**
 * DOT Messages — chat threads between investors and founders.
 * Each "connection" is opened when a meeting is accepted (server-side hook).
 *
 * This page lists all active connections and lets you start a new one
 * via /discover (search for a user to message). For v1, no WebSocket —
 * we poll every 5s.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Users, ChevronRight } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMyConnections, type Connection } from "@/api/connections";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Messages · DOT" }] }),
  component: MessagesIndex,
});

function MessagesIndex() {
  const qc = useQueryClient();
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: listMyConnections,
    refetchInterval: 5_000,
  });
  // Re-validate thread list when other data changes.
  void qc;

  const active = connections.filter((c) => c.status === "active");
  const closed = connections.filter((c) => c.status === "closed");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Direct"
        title="Messages"
        subtitle="Threads open when a meeting is accepted. Polled every 5s."
        action={
          <Badge variant="outline" className="font-medium">
            <Users className="mr-1.5 size-3" />
            {active.length} active
          </Badge>
        }
      />

      <section className="mt-10">
        <h2 className="font-display text-2xl font-light tracking-tight">Active</h2>
        {isLoading ? (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card/40" />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No active threads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Threads open automatically when you accept a meeting request.
            </p>
            <Link
              to="/discover/people"
              className="mt-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/20"
            >
              Discover founders →
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-2">
            {active.map((c) => (
              <li key={c.id}>
                <ThreadRow c={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-light tracking-tight text-muted-foreground">
            Closed
          </h2>
          <ul className="mt-4 grid gap-2 opacity-70">
            {closed.map((c) => (
              <li key={c.id}>
                <ThreadRow c={c} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function ThreadRow({ c }: { c: Connection }) {
  const otherId = c.initiatedBy;
  return (
    <Link
      to="/messages/$id"
      params={{ id: c.id }}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
        <MessageSquare className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">
          Thread {c.id.slice(0, 8)}…
        </p>
        <p className="text-xs text-muted-foreground">
          {c.status === "active" ? "Active" : "Closed"} ·{" "}
          opened {new Date(c.createdAt).toLocaleDateString()}
        </p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
    </Link>
  );
}