import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, Gauge, Wallet, Trophy, Users, BookOpen } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — DOT" }] }),
  component: NotificationsPage,
});

const MOCK_NOTIFS = [
  { id: "1", icon: Gauge, title: "Vantage score updated", body: "Your new Vantage Point is 720/1000 — up 42 points.", time: "2h ago", read: false, accent: "text-primary" },
  { id: "2", icon: Wallet, title: "Wallet funded", body: "₦30,000 deposited — 2,000 DOT added to your wallet.", time: "5h ago", read: false, accent: "text-primary" },
  { id: "3", icon: Trophy, title: "Pitchathon result", body: "Lagos Startup Battle: You ranked #3 with an average score of 8.4.", time: "1d ago", read: false, accent: "text-gold" },
  { id: "4", icon: Users, title: "New community member", body: "Kwame Asante joined Lagos Builders via your referral link.", time: "2d ago", read: true, accent: "text-primary" },
  { id: "5", icon: BookOpen, title: "Course completed", body: "Venture Design Thinking marked complete. +750 DOT earned.", time: "3d ago", read: true, accent: "text-gold" },
  { id: "6", icon: Gauge, title: "Meeting request accepted", body: "Fatima Al-Rashid from DFI Ventures accepted your meeting request.", time: "4d ago", read: true, accent: "text-primary" },
];

function NotificationsPage() {
  const unread = MOCK_NOTIFS.filter((n) => !n.read).length;
  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={
          <Button variant="outline" size="sm">
            <CheckCircle2 className="size-4" /> Mark all read
          </Button>
        }
      />

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {MOCK_NOTIFS.map((n, i) => (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-4 p-4 transition-colors",
              i < MOCK_NOTIFS.length - 1 && "border-b border-border",
              !n.read && "bg-primary/5",
            )}
          >
            <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted", n.accent)}>
              <n.icon className="size-4" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-medium", !n.read && "text-foreground")}>{n.title}</p>
                {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
