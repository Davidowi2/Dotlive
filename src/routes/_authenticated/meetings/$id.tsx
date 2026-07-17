import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  Users,
  Video,
  Link2,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useDotAuth as useAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import {
  getMyMeetings,
  getMeetingMessages,
  sendMeetingMessage,
  updateMeetingCoordination,
  type Meeting,
} from "@/api/meetings";

export const Route = createFileRoute("/_authenticated/meetings/$id")({
  head: () => ({
    meta: [
      { title: "Meeting Details — DOT" },
    ],
  }),
  component: MeetingDetailPage,
});

function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query to get this specific meeting
  const meetingsQuery = useQuery({
    queryKey: ["meetings", user?.id],
    enabled: !!user,
    queryFn: () => getMyMeetings(),
  });
  const meeting = meetingsQuery.data?.find(m => m.id === id);

  // Query for chat messages
  const messagesQuery = useQuery({
    queryKey: ["meeting-messages", id],
    enabled: !!id && (meeting?.status === "confirmed" || meeting?.status === "completed"),
    queryFn: () => getMeetingMessages(id),
  });

  // Mutation to send message
  const sendMessageMutation = useMutation({
    mutationFn: ({ body }: { body: string }) => sendMeetingMessage(id, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meeting-messages", id] });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Mutation to update coordination details
  const updateCoordinationMutation = useMutation({
    mutationFn: updateMeetingCoordination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", user?.id] });
      toast.success("Meeting details updated");
    },
    onError: () => {
      toast.error("Failed to update meeting details");
    },
  });

  const [newMessage, setNewMessage] = useState("");
  const [coordinationOpen, setCoordinationOpen] = useState(false);
  const [formData, setFormData] = useState({
    meetingPlatform: "",
    meetingLink: "",
    coordinationNotes: "",
    agenda: "",
  });

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesQuery.data]);

  // Initialize form data when meeting is available
  useEffect(() => {
    if (meeting) {
      setFormData({
        meetingPlatform: meeting.meetingPlatform || "",
        meetingLink: meeting.meetingLink || "",
        coordinationNotes: meeting.coordinationNotes || "",
        agenda: meeting.agenda?.join("\n") || "",
      });
    }
  }, [meeting]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate({ body: newMessage.trim() });
      setNewMessage("");
    }
  };

  const handleUpdateCoordination = () => {
    if (meeting) {
      updateCoordinationMutation.mutate(id, {
        ...formData,
        agenda: formData.agenda.split("\n").filter(Boolean),
      });
      setCoordinationOpen(false);
    }
  };

  if (meetingsQuery.isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!meeting) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Meeting not found</p>
          <Button onClick={() => navigate({ to: "/meetings" })}>
            Back to Meetings
          </Button>
        </div>
      </AppShell>
    );
  }

  const dt = new Date(meeting.scheduledAt);
  const isConfirmedOrCompleted = meeting.status === "confirmed" || meeting.status === "completed";
  const isHost = meeting.hostId === user?.id;
  const otherParty = isHost
    ? { id: meeting.guestId, name: "Guest" }
    : { id: meeting.hostId, name: meeting.hostName || "Host" };

  return (
    <AppShell>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/meetings" })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <CalendarDays className="size-4" />
            {dt.toLocaleDateString()} at {dt.toLocaleTimeString()}
          </p>
        </div>
        <Badge
          variant={
            meeting.status === "confirmed"
              ? "default"
              : meeting.status === "pending"
                ? "secondary"
                : meeting.status === "declined" || meeting.status === "cancelled"
                  ? "destructive"
                  : "outline"
          }
        >
          {meeting.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>Information about the meeting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{meeting.description}</p>
                </div>
              )}
              {meeting.meetingReason && (
                <div>
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p className="text-sm">{meeting.meetingReason}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Participants</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm">You and {otherParty.name}</span>
                </div>
              </div>

              {isConfirmedOrCompleted && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Coordination</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoordinationOpen(true)}
                    >
                      <Edit3 className="mr-1 size-3" /> Edit
                    </Button>
                  </div>

                  {(meeting.meetingPlatform || meeting.meetingLink) && (
                    <div className="space-y-2">
                      {meeting.meetingPlatform && (
                        <div className="flex items-center gap-2">
                          <Video className="size-4 text-muted-foreground" />
                          <span className="text-sm">{meeting.meetingPlatform}</span>
                        </div>
                      )}
                      {meeting.meetingLink && (
                        <div className="flex items-center gap-2">
                          <Link2 className="size-4 text-muted-foreground" />
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {meeting.meetingLink}
                          </a>
                        </div>
                      )}
                      {meeting.coordinationNotes && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-sm">{meeting.coordinationNotes}</p>
                        </div>
                      )}
                      {meeting.agenda && meeting.agenda.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Agenda</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {meeting.agenda.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Chat (WhatsApp-style) */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border bg-gradient-to-r from-green-600 to-green-500 text-white">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <Users className="size-6 text-green-700" />
                </Avatar>
                <div>
                  <CardTitle className="text-lg text-white">Meeting Chat</CardTitle>
                  <CardDescription className="text-white/80">
                    {isConfirmedOrCompleted
                      ? "Coordinate your meeting"
                      : "Chat unlocks once confirmed"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden bg-[#e5ddd5] p-4">
              {isConfirmedOrCompleted ? (
                <>
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messagesQuery.isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                      messagesQuery.data.map((msg) => {
                        const isSent = msg.authorId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-xl px-4 py-2 shadow-sm ${
                                isSent ? "bg-[#dcf8c6] rounded-tr-sm" : "bg-white rounded-tl-sm"
                              }`}
                            >
                              {!isSent && (
                                <p className="text-xs font-semibold text-green-700 mb-1">
                                  {msg.authorName || "User"}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed">{msg.body}</p>
                              <div className="flex justify-end items-center gap-1 mt-1">
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {isSent && (
                                  <CheckCircle2 className="size-3 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sendMessageMutation.isPending}
                      className="flex-1 rounded-full border-2 border-gray-200 focus:border-green-500 focus:ring-green-500 bg-white"
                    />
                    <Button
                      type="submit"
                      className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <Clock className="size-8 mr-2" />
                  <p>Waiting for meeting to be confirmed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coordination Dialog */}
      <Dialog open={coordinationOpen} onOpenChange={setCoordinationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coordination Details</DialogTitle>
            <DialogDescription>
              Add meeting link, platform, and notes for both parties.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Platform</label>
              <Input
                value={formData.meetingPlatform}
                onChange={(e) =>
                  setFormData({ ...formData, meetingPlatform: e.target.value })
                }
                placeholder="Zoom, Google Meet, Teams, etc."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Meeting Link</label>
              <Input
                value={formData.meetingLink}
                onChange={(e) =>
                  setFormData({ ...formData, meetingLink: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Notes</label>
              <Textarea
                value={formData.coordinationNotes}
                onChange={(e) =>
                  setFormData({ ...formData, coordinationNotes: e.target.value })
                }
                placeholder="Any additional notes..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Agenda (one per line)</label>
              <Textarea
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                placeholder="Intro&#10;Demo&#10;Q&A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCoordinationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCoordination}
              disabled={updateCoordinationMutation.isPending}
            >
              {updateCoordinationMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
