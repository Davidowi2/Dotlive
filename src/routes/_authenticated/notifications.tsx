import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, Check, CheckCircle2, Wallet, Send, Briefcase, Users, MessageSquare, Award,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  markAllRead as markAllReadApi,
  markRead as markReadApi,
  type NotificationItem,
  type NotificationType,
} from "@/api/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — DOT" }] }),
  component: NotificationsPage,
});

/* ============================== Icon mapping ============================== */

function iconFor(type: NotificationType): LucideIcon {
  switch (type) {
    case "transfer_received":
    case "withdrawal_approved":
    case "withdrawal_rejected":
      return Wallet;
    case "transfer_sent":
      return Send;
    case "job_posted":
    case "job_application_received":
    case "service_purchased":
      return Briefcase;
    case "community_invite":
    case "community_post":
    case "community_member_joined":
    case "mention":
      return Users;
    case "certificate_issued":
      return Award;
    default:
      return MessageSquare;
  }
}

/* ============================== Helpers ============================== */

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function filterCategory(type: NotificationType): string {
  if (type.startsWith("transfer")) return "Wallet";
  if (type.startsWith("withdrawal")) return "Wallet";
  if (type.startsWith("job") || type.startsWith("service")) return "Marketplace";
  if (type.startsWith("community")) return "Community";
  if (type.startsWith("venture")) return "Venture";
  if (type === "certificate_issued") return "Academy";
  if (type === "mention") return "Mention";
  return "System";
}

function toneFor(type: NotificationType): "primary" | "gold" | "purple" {
  if (type.startsWith("transfer") || type.startsWith("withdrawal")) return "primary";
  if (type === "job_posted" || type === "service_purchased") return "gold";
  return "purple";
}

/* ============================== Page ============================== */

type Filter = "All" | "Unread" | "Wallet" | "Marketplace" | "Community" | "Academy";

const FILTERS: Filter[] = ["All", "Unread", "Wallet", "Marketplace", "Community", "Academy"];

function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const qc = useQueryClient();

  const feedQ = useQuery({
    queryKey: ["notifications", "page", filter],
    queryFn: () => fetchNotifications({ limit: 50, unreadOnly: filter === "Unread" }),
  });

  const markAllM = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneM = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = feedQ.data?.items ?? [];
  const filtered = filter === "All" || filter === "Unread"
    ? items
    : items.filter((n) => filterCategory(n.type) === filter);
  const unread = feedQ.data?.unreadCount ?? 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={
          unread === 0
            ? "You're all caught up — no unread alerts."
            : `${unread} unread — latest activity across your workspace.`
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllM.mutate()}
            disabled={unread === 0 || markAllM.isPending}
          >
            <CheckCircle2 className="size-4" /> Mark all read
          </Button>
        }
      />

      {/* Filter strip */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 transition-colors",
              filter === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {feedQ.isLoading ? (
          <PageSkeleton lines={4} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {filter === "Unread"
                ? "No unread notifications — you're all caught up."
                : "No notifications yet. Activity from your ventures, transfers and communities will show up here."}
            </p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <NotificationRow
              key={n.id}
              n={n}
              isLast={i === filtered.length - 1}
              onMarkRead={() => markOneM.mutate(n.id)}
            />
          ))
        )}
      </div>

      <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Notification preferences live in{" "}
        <Link to="/settings" className="text-primary hover:underline">
          Settings → Notifications
        </Link>
      </div>
    </AppShell>
  );
}

/* ============================== Row ============================== */

function NotificationRow({
  n,
  isLast,
  onMarkRead,
}: {
  n: NotificationItem;
  isLast: boolean;
  onMarkRead: () => void;
}) {
  const Icon = iconFor(n.type);
  const tone = toneFor(n.type);
  const TONE_BG: Record<typeof tone, string> = {
    primary: "bg-primary/10",
    gold: "bg-gold/15",
    purple: "bg-purple/10",
  };
  const TONE_CLASS: Record<typeof tone, string> = {
    primary: "text-primary",
    gold: "text-gold",
    purple: "text-purple",
  };

  const inner = (
    <div
      className={cn(
        "flex items-start gap-4 p-4 transition-colors sm:p-5",
        !isLast && "border-b border-border",
        !n.read && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
          TONE_BG[tone],
          TONE_CLASS[tone],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={cn(
                "truncate text-sm font-medium",
                n.read ? "text-foreground/80" : "text-foreground",
              )}
            >
              {n.title}
            </p>
            <span className="shrink-0 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {filterCategory(n.type)}
            </span>
          </div>
          {!n.read && (
            <span
              aria-label="Unread"
              className="size-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground/80">{timeAgo(n.createdAt)}</p>
          {!n.read && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead();
              }}
              className="inline-flex items-center gap-1 text-xs text-primary transition-opacity hover:opacity-80"
            >
              <Check className="size-3" /> Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (n.link) {
    return (
      <Link to={n.link} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
