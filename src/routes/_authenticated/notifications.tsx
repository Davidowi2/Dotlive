import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  Check,
  Gauge,
  Wallet,
  Trophy,
  Users,
  BookOpen,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — DOT" }] }),
  component: NotificationsPage,
});

/* ─── Notification item shape (honest mock — illustrative) ───── */
interface NotifItem {
  id: string;
  icon: LucideIcon;
  /** Token colour for the icon — green (default), gold (capital), purple (community) */
  tone: "primary" | "gold" | "purple";
  category: "Vantage" | "Wallet" | "Community" | "Academy" | "Sessions" | "Pitchathon";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFS: NotifItem[] = [
  {
    id: "1",
    icon: Gauge,
    tone: "primary",
    category: "Vantage",
    title: "Vantage score updated",
    body: "Your new Vantage Point is 720/1000 — up 42 points since your last assessment.",
    time: "2h ago",
    read: false,
  },
  {
    id: "2",
    icon: Wallet,
    tone: "gold",
    category: "Wallet",
    title: "Wallet funded",
    body: "₦30,000 deposited — 2,000 DOT added to your wallet for marketplace use.",
    time: "5h ago",
    read: false,
  },
  {
    id: "3",
    icon: Trophy,
    tone: "gold",
    category: "Pitchathon",
    title: "Pitchathon ranking posted",
    body: "Lagos Startup Battle results are live — check the leaderboard for your standing.",
    time: "1d ago",
    read: false,
  },
  {
    id: "4",
    icon: Users,
    tone: "purple",
    category: "Community",
    title: "New community member",
    body: "A founder joined Lagos Builders via your referral link.",
    time: "2d ago",
    read: true,
  },
  {
    id: "5",
    icon: BookOpen,
    tone: "purple",
    category: "Academy",
    title: "Course marked complete",
    body: "Venture Design Thinking — DOT reward credited to your wallet.",
    time: "3d ago",
    read: true,
  },
  {
    id: "6",
    icon: CalendarCheck,
    tone: "primary",
    category: "Sessions",
    title: "Meeting request accepted",
    body: "An investor accepted your meeting request — your wallet has been debited the DOT fee.",
    time: "4d ago",
    read: true,
  },
];

/* Map our tone → tailwind text token. Keeps the design-token system honest. */
const TONE_CLASS: Record<NotifItem["tone"], string> = {
  primary: "text-primary",
  gold: "text-gold",
  purple: "text-purple",
};

const TONE_BG: Record<NotifItem["tone"], string> = {
  primary: "bg-primary/10",
  gold: "bg-gold/15",
  purple: "bg-purple/10",
};

function NotificationsPage() {
  const [items, setItems] = useState(MOCK_NOTIFS);
  const unread = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

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
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <CheckCircle2 className="size-4" /> Mark all read
          </Button>
        }
      />

      {/* ─── Filter strip ─────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Filter:</span>
        {["All", "Unread", "Vantage", "Wallet", "Academy"].map((f) => (
          <button
            key={f}
            type="button"
            className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {f}
          </button>
        ))}
      </div>

      {/* ─── Notification feed ────────────────────────────────────── */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          items.map((n, i) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 transition-colors sm:p-5",
                i < items.length - 1 && "border-b border-border",
                !n.read && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                  TONE_BG[n.tone],
                  TONE_CLASS[n.tone],
                )}
              >
                <n.icon className="size-4" />
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
                    <span
                      className={cn(
                        "shrink-0 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                      )}
                    >
                      {n.category}
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
                  <p className="text-xs text-muted-foreground/80">{n.time}</p>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="inline-flex items-center gap-1 text-xs text-primary transition-opacity hover:opacity-80"
                    >
                      <Check className="size-3" /> Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Footer divider + settings link ───────────────────────── */}
      <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Notification preferences live in{" "}
        <a href="/settings" className="text-primary hover:underline">
          Settings → Notifications
        </a>
        .
      </div>
    </AppShell>
  );
}
