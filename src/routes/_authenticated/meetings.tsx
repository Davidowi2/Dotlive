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
import { useState, useEffect } from "react";
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
  Settings,
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
import { cn, asArray } from "@/lib/utils";
import {
  getAvailableSlots,
  getMyMeetings,
  createSlot,
  editSlot,
  deleteSlot,
  requestMeeting,
  confirmMeeting,
  declineMeeting,
  cancelMeeting,
  updateMeetingCoordination,
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
  const [slotFilter, setSlotFilter] = useState<"all" | "my">("all");

  // Check URL for modal param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('modal') === 'create-slot') {
      setCreateSlotOpen(true);
      // Clean URL
      params.delete('modal');
      window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params : ''));
    }
  }, []);

  // Close modal handler
  const closeModal = () => {
    setCreateSlotOpen(false);
    // Clean URL without reload
    const params = new URLSearchParams(window.location.search);
    params.delete('modal');
    window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params : ''));
  };

  // Handler for opening dialog (used in empty state)
  const handleCreateSlot = () => {
    setCreateSlotOpen(true);
    // Update URL without reload
    const params = new URLSearchParams(window.location.search);
    params.set('modal', 'create-slot');
    window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
  };

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

  // Defensive normalization — the API client already returns an array, but if
  // any future caller passes a non-iterable here (e.g. a wrapper object
  // regression on the backend) the page used to crash with
  // `T.filter is not a function`. The asArray() helper unwraps known shapes
  // and falls back to [] for everything else.
  const meetingsList = asArray<Meeting>(meetings);
  const slotsList = asArray<MeetingSlot>(slots);

  // Categorize meetings
  const upcoming = meetingsList.filter(
    (m) => (m.status === "pending" || m.status === "confirmed")
  );
  const past = meetingsList.filter(
    (m) => m.status === "completed" || m.status === "cancelled" || m.status === "declined"
  );

  const pendingCount = upcoming.filter((m) => m.status === "pending").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Calendar"
        title="Meetings"
        subtitle="Schedule and manage meetings with founders and investors — Developed by Setons"
        action={
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="outline" className="font-medium">
                <AlertCircle className="mr-1.5 size-3" />
                {pendingCount} pending
              </Badge>
            )}
            <a 
              id="create-slot-btn"
              href="?modal=create-slot"
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 text-sm cursor-pointer"
            >
              <Plus className="size-4" />
              Create Slot
            </a>
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
            value={String(slotsList.filter((s) => s.status === "available").length)}
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                variant={slotFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSlotFilter("all")}
              >
                All Slots
              </Button>
              <Button
                variant={slotFilter === "my" ? "default" : "outline"}
                size="sm"
                onClick={() => setSlotFilter("my")}
              >
                My Slots
              </Button>
            </div>
          </div>
          
          {slotsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (() => {
            const filteredSlots = slotsList
              .filter((s) => s.status === "available")
              .filter((s) => slotFilter === "my" ? s.hostId === user?.id : true);
              
            if (filteredSlots.length === 0) {
              return (
                <EmptyState
                  icon={Clock}
                  title={slotFilter === "my" ? "No slots created yet" : "No available slots"}
                  description={slotFilter === "my" ? "Create a slot to let others book time with you." : "Create a slot or check back later."}
                  action={
                    <Button id="create-slot-btn-empty" onClick={handleCreateSlot} size="sm">
                      <Plus className="size-4" />
                      Create Slot
                    </Button>
                  }
                />
              );
            }

            return (
              <div className="space-y-4">
                {filteredSlots.map((slot) => (
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
            );
          })()}
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

      <CreateSlotDialog
        open={createSlotOpen}
        onClose={closeModal}
        onSuccess={() => {
          console.log("Success, invalidating queries");
          qc.invalidateQueries({ queryKey: ["available-slots"] });
          closeModal();
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
  const [editCoordinationOpen, setEditCoordinationOpen] = useState(false);

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
    <>
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

              {/* Coordination Details */}
              {(meeting.meetingPlatform || meeting.meetingLink || meeting.coordinationNotes || meeting.agenda) && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Meeting Coordination</h4>
                  {meeting.meetingPlatform && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Platform:</span> {meeting.meetingPlatform}
                    </p>
                  )}
                  {meeting.meetingLink && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Link:</span>{" "}
                      <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {meeting.meetingLink}
                      </a>
                    </p>
                  )}
                  {meeting.coordinationNotes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Notes:</span> {meeting.coordinationNotes}
                    </p>
                  )}
                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <div className="mt-1">
                      <span className="font-medium text-sm">Agenda:</span>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                        {meeting.agenda.map((item, index) => (
                          <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
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
            <div className="flex flex-col gap-2">
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

              {(meeting.status === "confirmed" || meeting.status === "pending") && (isHost || isGuest) && (
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => setEditCoordinationOpen(true)} 
                    variant="outline" 
                    size="sm"
                  >
                    <Settings className="size-4 mr-1" />
                    Coordination
                  </Button>
                  {meeting.status === "confirmed" && (
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CoordinationDialog
        open={editCoordinationOpen}
        meeting={meeting}
        onClose={() => setEditCoordinationOpen(false)}
        onSuccess={() => {
          onAction();
          setEditCoordinationOpen(false);
        }}
      />
    </>
  );
}

function CoordinationDialog({
  open,
  meeting,
  onClose,
  onSuccess,
}: {
  open: boolean;
  meeting: Meeting;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [meetingPlatform, setMeetingPlatform] = useState(meeting.meetingPlatform || "");
  const [meetingLink, setMeetingLink] = useState(meeting.meetingLink || "");
  const [coordinationNotes, setCoordinationNotes] = useState(meeting.coordinationNotes || "");
  const [agenda, setAgenda] = useState(
    (meeting.agenda || []).map(item => typeof item === 'string' ? item : JSON.stringify(item)).join("\n")
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMeetingCoordination(meeting.id, {
        meetingPlatform: meetingPlatform || undefined,
        meetingLink: meetingLink || undefined,
        coordinationNotes: coordinationNotes || undefined,
        agenda: agenda.trim() ? agenda.split("\n").filter(Boolean) : undefined,
      });
      toast.success("Meeting coordination updated");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update meeting coordination");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Meeting Coordination</DialogTitle>
          <DialogDescription>
            Set up the meeting platform, link, notes, and agenda for this meeting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meetingPlatform">Meeting Platform</Label>
            <select
              id="meetingPlatform"
              value={meetingPlatform}
              onChange={(e) => setMeetingPlatform(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="">Select a platform</option>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
              <option value="teams">Microsoft Teams</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <Input
              id="meetingLink"
              type="url"
              placeholder="https://..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="coordinationNotes">Notes</Label>
            <Textarea
              id="coordinationNotes"
              placeholder="Any additional notes for the meeting..."
              value={coordinationNotes}
              onChange={(e) => setCoordinationNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="agenda">Agenda (one item per line)</Label>
            <Textarea
              id="agenda"
              placeholder="Item 1&#10;Item 2&#10;Item 3"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  const [editOpen, setEditOpen] = useState(false);
  const isOwnSlot = slot.hostId === currentUserId;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      try {
        await deleteSlot(slot.id);
        toast.success("Time slot deleted");
        onAction();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete slot");
      }
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-lg">{slot.title}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">{slot.hostName || "Host"}</span>
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

            {isOwnSlot ? (
              <div className="flex gap-2">
                <Button onClick={() => setEditOpen(true)} size="sm" variant="outline">
                  Edit
                </Button>
                <Button onClick={handleDelete} size="sm" variant="destructive">
                  Delete
                </Button>
              </div>
            ) : (
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

      {editOpen && (
        <EditSlotDialog
          open={editOpen}
          slot={slot}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            onAction();
            setEditOpen(false);
          }}
        />
      )}
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
  const [title, setTitle] = useState("Available Slot");
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
      await createSlot({ title, date, startTime, endTime });
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Available Time Slot</DialogTitle>
          <DialogDescription>
            Set when you're available for meetings. Others can request to book these times.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="slotTitle">Title</Label>
            <Input
              id="slotTitle"
              type="text"
              placeholder="e.g., Office Hours"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

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

function EditSlotDialog({
  open,
  onClose,
  onSuccess,
  slot,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slot: MeetingSlot;
}) {
  const [title, setTitle] = useState(slot.title);
  const [date, setDate] = useState(slot.date);
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await editSlot(slot.id, { title, date, startTime, endTime });
      toast.success("Time slot updated");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update slot");
    } finally {
      setLoading(false);
    }
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Time Slot</DialogTitle>
          <DialogDescription>
            Update your available time slot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editSlotTitle">Title</Label>
            <Input
              id="editSlotTitle"
              type="text"
              placeholder="e.g., Office Hours"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="editDate">Date</Label>
            <Input
              id="editDate"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editStartTime">Start Time</Label>
              <Input
                id="editStartTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEndTime">End Time</Label>
              <Input
                id="editEndTime"
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
              Save Changes
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
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
