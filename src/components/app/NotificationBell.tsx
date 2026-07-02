/**
 * NotificationBell — bell icon with unread badge + dropdown preview.
 *
 * Lives in the top-right header. Shows red badge with unread count.
 * Click → dropdown of last 5 notifications + "See all" link.
 *
 * Polls /api/notifications/unread-count every 30s (cheap; no payload).
 * On click: fetches full feed into the dropdown.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Wallet, Send, Briefcase, Users, MessageSquare, Award, Check, CheckCheck } from "lucide-react";
import { fetchNotifications, fetchUnreadCount, markAllRead, markRead, type NotificationItem, type NotificationType } from "@/api/notifications";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof Bell> = {
  Wallet, Send, Briefcase, Users, MessageSquare, Award, Bell,
};

function iconFor(type: NotificationType): typeof Bell {
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
      return MessageSquare;
    case "certificate_issued":
      return Award;
    default:
      return Bell;
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Poll unread count every 60s (cheap endpoint)
  const unreadQ = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });

  // Dropdown feed (only fetched when open)
  const feedQ = useQuery({
    queryKey: ["notifications", "feed", 5],
    queryFn: () => fetchNotifications({ limit: 5 }),
    enabled: open,
  });

  const markAllM = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneM = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = unreadQ.data ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
          "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition",
          open && "bg-white/10 text-white",
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className={cn(
            "absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center",
            "rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-zinc-950",
          )}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl",
          "border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40",
        )}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllM.mutate()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Feed */}
          <div className="max-h-[440px] overflow-y-auto">
            {feedQ.isLoading && (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">Loading…</div>
            )}
            {feedQ.data && feedQ.data.items.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
                <div className="text-sm text-zinc-400">No notifications yet</div>
                <div className="mt-1 text-[11px] text-zinc-600">
                  Activity from your ventures, transfers and communities will show up here.
                </div>
              </div>
            )}
            {feedQ.data?.items.map((n) => (
              <NotificationRow key={n.id} n={n} onMark={() => markOneM.mutate(n.id)} />
            ))}
          </div>

          {/* Footer */}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-white/10 bg-white/[0.02] px-4 py-2.5 text-center text-xs font-medium text-emerald-400 hover:bg-white/5"
          >
            See all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onMark }: { n: NotificationItem; onMark: () => void }) {
  const Icon = iconFor(n.type);
  const inner = (
    <div className={cn(
      "flex gap-3 px-4 py-3 transition hover:bg-white/[0.03]",
      !n.read && "bg-emerald-500/[0.04]",
    )}>
      <div className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        n.read ? "bg-white/5 text-zinc-500" : "bg-emerald-500/15 text-emerald-300",
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("text-sm font-medium leading-snug", n.read ? "text-zinc-300" : "text-white")}>
            {n.title}
          </div>
          {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
        </div>
        <div className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{n.body}</div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
          <span>{timeAgo(n.createdAt)}</span>
          {!n.read && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMark(); }}
              className="inline-flex items-center gap-0.5 text-zinc-500 hover:text-emerald-400"
            >
              <Check className="h-2.5 w-2.5" />
              Mark read
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
