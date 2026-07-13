import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

import {
  listMeetings,
  listMySlots,
  requestMeeting,
  confirmMeeting,
  declineMeeting,
  cancelMeeting,
} from "@/lib/meetings.functions";
import type { Meeting } from "@/api/meetings";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings — DOT" },
      { name: "description", content: "Request, confirm and manage meetings." },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const meetingsQuery = useQuery({
    queryKey: ["meetings", user?.id],
    enabled: !!user,
    queryFn: async () => (await listMeetings()) as Meeting[],
  });

  const slotsQuery = useQuery({
    queryKey: ["meeting-slots", user?.id],
    enabled: !!user,
    queryFn: async () => (await listMySlots()) as any[],
  });

  const list = meetingsQuery.data ?? [];
  const now = new Date();
  const upcoming = list.filter(
    (m) =>
      !["cancelled", "declined"].includes(m.status) &&
      new Date(m.scheduledAt).getTime() > now.getTime(),
  );
  const past = list.filter(
    (m) =>
      ["completed"].includes(m.status) ||
      (new Date(m.scheduledAt).getTime() <= now.getTime() &&
        !["cancelled", "declined"].includes(m.status)),
  );
  const cancelled = list.filter((m) => ["cancelled", "declined"].includes(m.status));

  const [requestOpen, setRequestOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function onRequest(slotId: string, title: string, description: string) {
    await requestMeeting({
      slotId,
      title,
      description: description || null,
      meetingReason: reason || null,
    });
    toast.success("Meeting requested");
    setRequestOpen(false);
    setReason("");
    qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
    qc.invalidateQueries({ queryKey: ["meeting-slots", user?.id] });
  }

  async function onConfirm(id: string) {
    if (!confirm("Confirm this meeting?")) return;
    await confirmMeeting({ id });
    toast.success("Meeting confirmed");
    qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
  }

  async function onDecline(id: string) {
    const text = prompt("Decline reason (optional)") ?? "";
    await declineMeeting({ id, reason: text || null });
    toast.success("Meeting declined");
    qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
  }

  async function onCancel(id: string) {
    if (!confirm("Cancel this confirmed meeting?")) return;
    const text = prompt("Cancel reason (optional)") ?? "";
    await cancelMeeting({ id, reason: text || null });
    toast.success("Meeting cancelled");
    qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage slots and meeting requests with other founders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSlotOpen(true)}>
            <Plus className="mr-2 size-4" /> New slot
          </Button>
          <Button variant="secondary" onClick={() => setRequestOpen(true)}>
            Request meeting
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="slots">My slots</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <MeetingList
            meetings={upcoming}
            loading={meetingsQuery.isLoading}
            emptyText="No upcoming meetings."
            onConfirm={onConfirm}
            onDecline={onDecline}
            onCancel={onCancel}
          />
        </TabsContent>
        <TabsContent value="past">
          <MeetingList
            meetings={past}
            loading={meetingsQuery.isLoading}
            emptyText="No past meetings yet."
          />
        </TabsContent>
        <TabsContent value="cancelled">
          <MeetingList
            meetings={cancelled}
            loading={meetingsQuery.isLoading}
            emptyText="No cancelled or declined meetings."
          />
        </TabsContent>
        <TabsContent value="slots">
          {slotsQuery.isLoading ? (
            <Loader2 className="mt-8 size-6 animate-spin text-primary" />
          ) : (slotsQuery.data?.length ?? 0) === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No slots yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(slotsQuery.data ?? []).map((s: any) => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{s.title ?? "Available Slot"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.date}, {s.startTime} - {s.endTime}
                      </p>
                    </div>
                    <Badge
                      variant={
                        s.status === "available"
                          ? "secondary"
                          : s.status === "confirmed"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        slots={slotsQuery.data ?? []}
        onRequest={onRequest}
      />
      <SlotDialog
        open={slotOpen}
        onOpenChange={setSlotOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["meeting-slots", user?.id] })}
      />
    </AppShell>
  );
}

function MeetingList({
  meetings,
  loading,
  emptyText,
  onConfirm,
  onDecline,
  onCancel,
}: {
  meetings: Meeting[];
  loading: boolean;
  emptyText: string;
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const navigate = useNavigate();

  if (loading) return <Loader2 className="mt-8 size-6 animate-spin text-primary" />;
  if (meetings.length === 0)
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {meetings.map((m) => {
        const dt = new Date(m.scheduledAt);
        const status = m.status;
        return (
          <div
            key={m.id}
            className="rounded-xl border border-border bg-card p-4 hover:bg-accent/50 cursor-pointer transition-colors group"
            onClick={() => navigate({ to: `/meetings/${m.id}` })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <span className="text-sm font-semibold">{m.title ?? "Meeting"}</span>
              </div>
              <Badge
                variant={
                  status === "confirmed"
                    ? "default"
                    : status === "pending"
                      ? "secondary"
                      : status === "declined"
                        ? "destructive"
                        : "outline"
                }
              >
                {status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <Clock className="mr-1 inline size-3" />
              {dt.toLocaleString()}
            </p>
            {m.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.description}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                {status === "pending" && onConfirm && onDecline && (
                  <>
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={(e) => {
                        e.stopPropagation();
                        onConfirm(m.id);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecline(m.id);
                      }}
                    >
                      <XCircle className="size-4" />
                    </Button>
                  </>
                )}
                {status === "confirmed" && onCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(m.id);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestDialog({
  open,
  onOpenChange,
  slots,
  onRequest,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slots: any[];
  onRequest: (slotId: string, title: string, description: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const slot = slots[0];
    if (!slot) return toast.error("No available slot selected");
    await onRequest(slot.id, title, desc);
    setTitle("");
    setDesc("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request meeting</DialogTitle>
          <DialogDescription>Pick a slot and submit a meeting request.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Slot</label>
            <Input value={slots[0] ? `${slots[0].date} ${slots[0].startTime}` : ""} readOnly />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pilot demo review"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Why do you want this meeting?"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title}>
              Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SlotDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = (await import("@/api/client")).getToken();
    await fetch(`/api/meetings/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title: "Available Slot", date, startTime: start, endTime: end }),
    });
    onCreated();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New availability slot</DialogTitle>
          <DialogDescription>Others will request meetings in this window.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Start</label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">End</label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!date || !start || !end}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
