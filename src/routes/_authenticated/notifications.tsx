import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  CalendarX,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  Users,
  Bell,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  listNotifications,
  markReadNotification,
  markUnreadNotification,
  archiveNotification,
  unarchiveNotification,
  readAllNotifications,
} from "@/lib/notifications.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — DOT" },
      { name: "description", content: "In-app updates and alerts." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "unread" | "archived">("all");

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id, tab],
    enabled: !!user,
    queryFn: async () => (await listNotifications(tab)).items,
  });

  const unread = list.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);

  async function markRead(id: string) {
    await markReadNotification({ id });
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }
  async function markUnread(id: string) {
    await markUnreadNotification({ id });
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }
  async function archive(id: string) {
    await archiveNotification({ id });
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }
  async function unarchive(id: string) {
    await unarchiveNotification({ id });
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }
  async function readAll() {
    await readAllNotifications();
    toast.success("Marked all as read");
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates on meetings, payments, and community activity.
          </p>
        </div>
        <Button variant="secondary" onClick={readAll} disabled={unread === 0}>
          <Bell className="mr-2 size-4" /> Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {isLoading ? (
            <Loader2 className="mt-8 size-6 animate-spin text-primary" />
          ) : list.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No notifications here yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {list.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border border-border bg-card p-4 ${n.read ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                      {n.link && (
                        <a
                          href={n.link}
                          className="mt-2 inline-block text-xs text-primary hover:underline"
                        >
                          Open
                        </a>
                      )}
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {n.read ? (
                        <Button size="icon" variant="ghost" onClick={() => markUnread(n.id)}>
                          <XCircle className="size-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}>
                          <CheckCircle2 className="size-4 text-primary" />
                        </Button>
                      )}
                      {n.isArchived ? (
                        <Button size="icon" variant="ghost" onClick={() => unarchive(n.id)}>
                          Unarchive
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => archive(n.id)}>
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
