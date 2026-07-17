import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Handshake,
  Plus,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";

import {
  listMeetings,
  listMySlots,
  requestMeeting,
  confirmMeeting,
  declineMeeting,
  cancelMeeting,
  rescheduleMeeting,
  completeMeeting,
  updateMeetingCoordination,
  getMeetingMessages,
  sendMeetingMessage,
  createSlot,
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

type ActionKind = "confirm" | "decline" | "cancel";

function ActionDialog({
  open,
  kind,
  busy,
  text,
  onTextChange,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  kind: ActionKind;
  busy: boolean;
  text: string;
  onTextChange: (v: string) => void;
  onConfirm: () => void;
  onOpenChange: (v: boolean) => void;
}) {
  const title =
    kind === "confirm"
      ? "Confirm meeting"
      : kind === "decline"
        ? "Decline meeting"
        : "Cancel meeting";

  const description =
    kind === "cancel"
      ? "This will cancel the meeting. You can add a note."
      : kind === "decline"
        ? "Optionally add a reason for declining."
        : "Are you sure you want to confirm this meeting?";

  const canSubmit =
    kind === "confirm" ? !busy : text.trim().length > 0 || kind === "confirm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {kind !== "confirm" && (
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={
              kind === "decline"
                ? "Decline reason (optional)"
                : "Cancel reason (optional)"
            }
            className="mt-2"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            variant={kind === "cancel" ? "destructive" : "hero"}
            onClick={() => {
              onConfirm();
            }}
            disabled={!canSubmit || busy}
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {kind === "confirm" ? "Confirm" : kind === "decline" ? "Decline" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MeetingsPage() {
  const { user } = useDotAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const upcoming = list.filter(
    (m) =>
      !["cancelled", "declined"].includes(m.status) &&
      new Date(m.scheduledAt).getTime() > now.getTime(),
  );
  const pending = list.filter((m) => m.status === "pending");
  const past = list.filter(
    (m) =>
      ["completed"].includes(m.status) ||
      (new Date(m.scheduledAt).getTime() <= now.getTime() &&
        !["cancelled", "declined"].includes(m.status)),
  );
  const pastSevenDays = past.filter((m) => new Date(m.scheduledAt) >= sevenDaysAgo);
  const cancelled = list.filter((m) => ["cancelled", "declined"].includes(m.status));

  const [requestOpen, setRequestOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [actionKind, setActionKind] = useState<ActionKind>("confirm");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionText, setActionText] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  async function runAction() {
    if (!actionId) return;
    const id = actionId;
    setActionBusy(true);
    try {
      if (actionKind === "confirm") {
        await confirmMeeting({ id });
        toast.success("Meeting confirmed");
      } else if (actionKind === "decline") {
        await declineMeeting({ id, reason: actionText || null });
        toast.success("Meeting declined");
      } else {
        await cancelMeeting({ id, reason: actionText || null });
        toast.success("Meeting cancelled");
      }
      qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
    } finally {
      setActionBusy(false);
      setActionId(null);
      setActionText("");
    }
  }

  async function onConfirm(id: string) {
    setActionKind("confirm");
    setActionId(id);
    setActionText("");
  }

  async function onDecline(id: string) {
    setActionKind("decline");
    setActionId(id);
    setActionText("");
  }

  async function onCancel(id: string) {
    setActionKind("cancel");
    setActionId(id);
    setActionText("");
  }

  async function onReschedule(id: string) {
    setActionKind("decline");
    setActionId(id);
    setActionText("");
  }

  async function onComplete(id: string) {
    await completeMeeting({ id });
    toast.success("Marked complete");
    qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
  }

  async function openChat(id: string) {
    navigate({ to: `/meetings/${id}` });
  }

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

  async function saveCoordination(id: string) {
    const cur = (coordinationRef.current ?? {})[id] ?? {};
    try {
      await updateMeetingCoordination(id, {
        meetingPlatform: cur.platform,
        meetingLink: cur.link,
        coordinationNotes: cur.notes,
      });
      toast.success("Coordination saved");
    } catch {
      toast.error("Could not save coordination");
    }
  }

  return (
    <AppShell>
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule, request, and manage your sessions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSlotOpen(true)} variant="hero">
            <CalendarPlus className="mr-2 size-4" /> New slot
          </Button>
          <Button variant="outline" onClick={() => setRequestOpen(true)}>
            <Handshake className="mr-2 size-4" /> Request meeting
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Upcoming"
          value={String(upcoming.length)}
          sub="Confirmed sessions"
        />
        <StatCard
          title="Pending"
          value={String(pending.length)}
          sub="Requests awaiting action"
        />
        <StatCard
          title="Past 7d"
          value={String(pastSevenDays.length)}
          sub="Completed sessions"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="gap-2 bg-transparent p-1">
          <TabsTrigger
            value="upcoming"
            className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Past
          </TabsTrigger>
          <TabsTrigger
            value="slots"
            className="rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            My slots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <MeetingList
            meetings={upcoming}
            loading={meetingsQuery.isLoading}
            emptyText="No upcoming meetings."
            onConfirm={onConfirm}
            onDecline={onDecline}
            onCancel={onCancel}
            onComplete={onComplete}
            onOpenChat={openChat}
          />
        </TabsContent>
        <TabsContent value="pending">
          <MeetingList
            meetings={pending}
            loading={meetingsQuery.isLoading}
            emptyText="No pending requests."
            onConfirm={onConfirm}
            onDecline={onDecline}
          />
        </TabsContent>
        <TabsContent value="past">
          <MeetingList
            meetings={past}
            loading={meetingsQuery.isLoading}
            emptyText="No past meetings yet."
          />
        </TabsContent>
        <TabsContent value="slots">
          {slotsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (slotsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No slots yet"
              description="Create a time slot for others to request meetings."
              icon={CalendarPlus}
            />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(slotsQuery.data ?? []).map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ActionDialog
        open={!!actionId}
        kind={actionKind}
        busy={actionBusy}
        text={actionText}
        onTextChange={setActionText}
        onConfirm={runAction}
        onOpenChange={(v) => {
          if (!v) {
            setActionId(null);
            setActionText("");
          }
        }}
      />

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
  onComplete,
  onOpenChat,
}: {
  meetings: Meeting[];
  loading: boolean;
  emptyText: string;
  onConfirm?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onOpenChat?: (id: string) => void;
}) {
  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  if (meetings.length === 0)
    return (
      <EmptyState
        title="Nothing here yet"
        description={emptyText}
        icon={CalendarDays}
      />
    );

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {meetings.map((m) => {
        const dt = new Date(m.scheduledAt);
        const status = m.status;
        return (
          <Card
            key={m.id}
            className="hover:bg-accent/50 transition-colors overflow-hidden"
          >
            <CardContent className="p-4">
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
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {dt.toLocaleString()}
              </p>
              {m.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.description}</p>
              )}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
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
                  {status === "confirmed" && (
                    <>
                      {onCancel ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(m.id);
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
  const [slotId, setSlotId] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slotId) return toast.error("Pick an available slot");
    await onRequest(slotId, title, desc);
    setTitle("");
    setDesc("");
    setSlotId("");
  }

  useEffect(() => {
    if (open) setSlotId((slots[0]?.id as string) ?? "");
  }, [open, slots]);

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
            <Textarea
              value={
                slotId
                  ? (slots.find((s) => s.id === slotId) ? `${(slots.find((s) => s.id === slotId) as any)?.date} ${(slots.find((s) => s.id === slotId) as any)?.startTime}` : "")
                  : ""
              }
              readOnly
              className="h-16"
            />
            {slots.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <Button
                    key={s.id}
                    type="button"
                    size="sm"
                    variant={slotId === s.id ? "hero" : "outline"}
                    onClick={() => setSlotId(s.id)}
                  >
                    {s.date} {s.startTime}
                  </Button>
                ))}
              </div>
            ) : (
              slots.length === 0 && (
                <p className="text-xs text-destructive">No slots available. Create one first.</p>
              )
            )}
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
            <Button type="submit" disabled={!slotId || !title}>
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
    await createSlot({
      title: "Available Slot",
      date,
      startTime: start,
      endTime: end,
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

function CoordinationDialog({
  open,
  onOpenChange,
  meeting,
  value,
  onChange,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting: Meeting | null;
  value: Record<string, { platform?: string; link?: string; notes?: string }>;
  onChange: (id: string, patch: Record<string, string | undefined>) => void;
  onSave: (id: string) => void;
  saving: boolean;
}) {
  if (!meeting) return null;
  const cur = value[meeting.id] ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit coordination</DialogTitle>
          <DialogDescription>Platform, link, and notes for this meeting.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Platform"
            value={cur.platform ?? ""}
            onChange={(e) => onChange(meeting!.id, { platform: e.target.value })}
          />
          <Input
            placeholder="Link"
            value={cur.link ?? ""}
            onChange={(e) => onChange(meeting!.id, { link: e.target.value })}
          />
          <Textarea
            placeholder="Agenda / notes"
            className="sm:col-span-2"
            value={cur.notes ?? ""}
            onChange={(e) => onChange(meeting!.id, { notes: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="hero" onClick={() => onSave(meeting.id)} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
