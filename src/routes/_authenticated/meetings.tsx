/**
 * Meetings — calendar/scheduler for founders and investors.
 *
 * Features:
 * - View available time slots from hosts
 * - Create available slots (as host)
 * - Request meetings (as guest)
 * - Confirm/decline meetings (as host)
 * - Cancel meetings (as host or guest)
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Users,
  Calendar,
  Video,
  AlertCircle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getAvailableSlots,
  getMyMeetings,
  createSlot,
  requestMeeting,
  confirmMeeting,
  declineMeeting,
  cancelMeeting,
  type MeetingSlot,
  type Meeting,
} from "@/api/meetings";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meetings · DOT" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { user, roles } = useDotAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [createSlotOpen, setCreateSlotOpen] = useState(false);

  // Fetch my meetings
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ["meetings", user?.id],
    enabled: !!user,
    queryFn: () => getMyMeetings(),
  });

  // Fetch available slots
  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["available-slots"],
    enabled: !!user,
    queryFn: () => getAvailableSlots(),
  });

  // Categorize meetings
  const upcoming = meetings.filter(
    (m) => (m.status === "pending" || m.status === "confirmed")
  );
  const past = meetings.filter(
    (m) => m.status === "completed" || m.status === "cancelled" || m.status === "declined"
  );

  const pendingCount = upcoming.filter((m) => m.status === "pending").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendar"
        title="Meetings"
        subtitle="Schedule and manage meetings with founders and investors"
        action={
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="outline" className="font-medium">
                <AlertCircle className="mr-1.5 size-3" />
                {pendingCount} pending
              </Badge>
            )}
            <Button onClick={() => setCreateSlotOpen(true)} size="sm">
              <Plus className="size-4" />
              Create Slot
            </Button>
          </div>
        }
      />

      <PageIntent
        icon={<CalendarDays className="size-5" />}
        intent="When are you available to meet?"
        context="Create time slots for others to book, or browse available slots and request meetings."
      />

      {/* Quick stats */}
      <section className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile
            icon={Calendar}
            label="Upcoming"
            value={String(upcoming.length)}
            sub="scheduled meetings"
            accent="primary"
          />
          <SummaryTile
            icon={Clock}
            label="Available Slots"
            value={String(slots.filter((s) => s.status === "available").length)}
            sub="open for booking"
            accent="gold"
          />
          <SummaryTile
            icon={Video}
            label="Past Meetings"
            value={String(past.length)}
            sub="completed or cancelled"
            accent="muted"
          />
        </div>
      </section>

      <hr className="my-10 border-border" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {upcoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available">Available Slots</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        {/* Upcoming meetings */}
        <TabsContent value="upcoming" className="mt-6">
          {meetingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming meetings"
              description="Create a time slot or browse available slots to request meetings."
            />
          ) : (
            <div className="space-y-4">
              {upcoming.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={user?.id}
                  onAction={() => qc.invalidateQueries({ queryKey: ["meetings", user?.id] })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available slots */}
        <TabsContent value="available" className="mt-6">
          {slotsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : slots.filter((s) => s.status === "available").length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No available slots"
              description="Create a slot to let others book time with you."
              action={
                <Button onClick={() => setCreateSlotOpen(true)} size="sm">
                  <Plus className="size-4" />
                  Create Slot
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {slots
                .filter((s) => s.status === "available")
                .map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    currentUserId={user?.id}
                    onAction={() => {
                      qc.invalidateQueries({ queryKey: ["available-slots"] });
                      qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
                    }}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        {/* Past meetings */}
        <TabsContent value="past" className="mt-6">
          {meetingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : past.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No past meetings"
              description="Your meeting history will appear here."
            />
          ) : (
            <div className="space-y-4">
              {past.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  currentUserId={user?.id}
                  onAction={() => qc.invalidateQueries({ queryKey: ["meetings", user?.id] })}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Slot Dialog */}
      <CreateSlotDialog
        open={createSlotOpen}
        onClose={() => setCreateSlotOpen(false)}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["available-slots"] });
          setCreateSlotOpen(false);
        }}
      />
    </AppShell>
  );
}

/* ─── Meeting Card ─────────────────────────────────────── */

function MeetingCard({
  meeting,
  currentUserId,
  onAction,
}: {
  meeting: Meeting;
  currentUserId?: string;
  onAction: () => void;
}) {
  const isHost = meeting.hostId === currentUserId;
  const isGuest = meeting.guestId === currentUserId;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConfirm = async () => {
    try {
      await confirmMeeting(meeting.id);
      toast.success("Meeting confirmed");
      onAction();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm meeting");
    }
  };

  const handleDecline = async () => {
    try {
      await declineMeeting(meeting.id);
      toast.success("Meeting declined");
      onAction();
    } catch (err: any) {
      toast.error(err.message || "Failed to decline meeting");
    }
  };

  const handleCancel = async () => {
    try {
      const result = await cancelMeeting(meeting.id);
      toast.success("Meeting cancelled");
      if (result.warning) {
        toast.warning(result.warning);
      }
      onAction();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel meeting");
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{meeting.title}</h3>
              <StatusBadge status={meeting.status} />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {formatDate(meeting.scheduledAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTime(meeting.scheduledAt)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {isHost ? "You are hosting" : "You requested"}
              </span>
            </div>

            {meeting.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {meeting.description}
              </p>
            )}

            {meeting.declinedReason && (
              <p className="mt-2 text-sm text-destructive">
                Declined: {meeting.declinedReason}
              </p>
            )}

            {meeting.cancelledReason && (
              <p className="mt-2 text-sm text-muted-foreground">
                Cancelled: {meeting.cancelledReason}
              </p>
            )}
          </div>

          {/* Actions */}
          {meeting.status === "pending" && isHost && (
            <div className="flex gap-2">
              <Button onClick={handleConfirm} size="sm">
                <CheckCircle2 className="size-4" />
                Confirm
              </Button>
              <Button onClick={handleDecline} variant="outline" size="sm">
                <XCircle className="size-4" />
                Decline
              </Button>
            </div>
          )}

          {meeting.status === "confirmed" && (isHost || isGuest) && (
            <Button onClick={handleCancel} variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Slot Card ─────────────────────────────────────── */

function SlotCard({
  slot,
  currentUserId,
  onAction,
}: {
  slot: MeetingSlot;
  currentUserId?: string;
  onAction: () => void;
}) {
  const [requestOpen, setRequestOpen] = useState(false);
  const isOwnSlot = slot.hostId === currentUserId;

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{slot.hostName || "Host"}</span>
                {isOwnSlot && (
                  <Badge variant="outline" className="text-[10px]">
                    Your slot
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {slot.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {slot.startTime} - {slot.endTime}
                </span>
                {slot.durationMinutes && (
                  <span className="text-xs">{slot.durationMinutes} min</span>
                )}
              </div>
            </div>

            {!isOwnSlot && (
              <Button onClick={() => setRequestOpen(true)} size="sm">
                Request Meeting
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <RequestMeetingDialog
        open={requestOpen}
        slotId={slot.id}
        onClose={() => setRequestOpen(false)}
        onSuccess={() => {
          onAction();
          setRequestOpen(false);
        }}
      />
    </>
  );
}

/* ─── Create Slot Dialog ─────────────────────────────────────── */

function CreateSlotDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await createSlot({ date, startTime, endTime });
      toast.success("Time slot created");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create slot");
    } finally {
      setLoading(false);
    }
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Available Time Slot</DialogTitle>
          <DialogDescription>
            Set when you're available for meetings. Others can request to book these times.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create Slot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Request Meeting Dialog ─────────────────────────────────────── */

function RequestMeetingDialog({
  open,
  slotId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  slotId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setLoading(true);
    try {
      await requestMeeting({
        slotId,
        title,
        description: description || undefined,
      });
      toast.success("Meeting requested");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to request meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Meeting</DialogTitle>
          <DialogDescription>
            Request to book this time slot. The host will confirm or decline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="e.g., Discuss investment opportunity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What would you like to discuss?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Request Meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Internal helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "confirmed"
      ? "default"
      : status === "pending"
        ? "secondary"
        : status === "declined" || status === "cancelled"
          ? "destructive"
          : "outline";

  return (
    <Badge variant={variant} className="text-[10px]">
      {status}
    </Badge>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "gold" | "muted";
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center",
            accent === "primary" && "text-primary",
            accent === "gold" && "text-gold",
            accent === "muted" && "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-light leading-none tracking-tight tabular">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Inbox(props: any) {
  return null;
}
