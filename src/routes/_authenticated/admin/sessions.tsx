/**
 * /admin/sessions — Create and manage live founder sessions.
 *
 * Sessions = live events (webinars, seminars, Q&As, founder discussions).
 * Set a date/time + a join URL (Zoom, Google Meet, Whop stream, YouTube Live).
 * When the time arrives, registered users see a live "Join now" button.
 *
 * Flow:
 *   1. Operator creates session here with date/time + join URL
 *   2. Session appears on /sessions for all users to register
 *   3. At event time → registered users see "Join now" button
 *   4. DOT deducts the registration cost from wallet (if any)
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Save, Trash2, Loader2, X, Video, Calendar,
  Users, Coins, Radio, Clock, ExternalLink, Edit3,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { dotApi } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/sessions")({
  head: () => ({ meta: [{ title: "Sessions — Admin — DOT" }] }),
  component: AdminSessionsPage,
});

interface SessionEvent {
  id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  eventDate: string | null;
  dotCost: number;
  capacity: number;
  whopUrl: string | null;
  createdAt: string;
}

function isUpcoming(dateStr: string | null) {
  if (!dateStr) return true;
  return new Date(dateStr) > new Date();
}

function isLiveNow(dateStr: string | null) {
  if (!dateStr) return false;
  const start = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return diffMs >= 0 && diffMs < 4 * 60 * 60 * 1000; // 4 hours
}

function AdminSessionsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const res = await dotApi.get<{ events: SessionEvent[] }>("/api/events");
      return res?.events ?? [];
    },
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => dotApi.delete(`/api/admin/events/${id}`),
    onSuccess: () => {
      toast.success("Session deleted");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  const upcoming = events.filter(e => isUpcoming(e.eventDate) || isLiveNow(e.eventDate));
  const past = events.filter(e => e.eventDate && !isUpcoming(e.eventDate) && !isLiveNow(e.eventDate));

  return (
    <div>
      <PageHeader
        eyebrow="Live"
        title="Sessions"
        subtitle="Create and manage live founder sessions, webinars, and Q&As."
        action={
          <Button onClick={() => { setCreating(true); setEditingId(null); }} disabled={creating}>
            <Plus className="size-4" /> New session
          </Button>
        }
      />

      {/* Create / Edit form */}
      {(creating || editingId) && (
        <SessionForm
          mode={creating ? "create" : "edit"}
          initial={editingId ? events.find(e => e.id === editingId) : undefined}
          onCancel={() => { setCreating(false); setEditingId(null); }}
          onSave={async (data) => {
            if (creating) {
              await dotApi.post("/api/admin/events", data);
              toast.success("Session created");
              setCreating(false);
            } else {
              await dotApi.patch(`/api/admin/events/${editingId}`, data);
              toast.success("Session updated");
              setEditingId(null);
            }
            qc.invalidateQueries({ queryKey: ["admin-events"] });
            qc.invalidateQueries({ queryKey: ["events"] });
          }}
        />
      )}

      {isLoading && (
        <div className="mt-8 space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />)}
        </div>
      )}

      {isError && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load sessions.
        </div>
      )}

      {/* Upcoming + Live */}
      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Radio className="size-3.5" /> Upcoming & Live ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map(ev => (
              <SessionRow
                key={ev.id}
                ev={ev}
                onEdit={() => { setEditingId(ev.id); setCreating(false); }}
                onDelete={() => {
                  if (confirm(`Delete "${ev.title}"?`)) deleteMut.mutate(ev.id);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Past ({past.length})
          </h2>
          <div className="space-y-3 opacity-70">
            {past.map(ev => (
              <SessionRow
                key={ev.id}
                ev={ev}
                onEdit={() => { setEditingId(ev.id); setCreating(false); }}
                onDelete={() => {
                  if (confirm(`Delete "${ev.title}"?`)) deleteMut.mutate(ev.id);
                }}
                isPast
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && events.length === 0 && !creating && (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center">
          <Video className="mx-auto size-8 text-muted-foreground/50 mb-3" />
          <p className="font-display text-lg font-light">No sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first live session — a webinar, Q&A, or founder discussion.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Create first session
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Session Row ── */
function SessionRow({ ev, onEdit, onDelete, isPast = false }: {
  ev: SessionEvent;
  onEdit: () => void;
  onDelete: () => void;
  isPast?: boolean;
}) {
  const live = isLiveNow(ev.eventDate);

  return (
    <div className={cn(
      "rounded-2xl border bg-card p-4",
      live ? "border-primary/40 bg-primary/5" : "border-border"
    )}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {live && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <span className="size-1.5 rounded-full bg-current animate-pulse" /> Live now
              </span>
            )}
            <h3 className="font-semibold text-sm">{ev.title}</h3>
            {ev.dotCost > 0 ? (
              <Badge variant="default" className="text-[10px]">
                <Coins className="size-2.5 mr-1" />{ev.dotCost} DOT
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Free</Badge>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {ev.eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {new Date(ev.eventDate).toLocaleString([], {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
            {ev.speaker && (
              <span className="flex items-center gap-1">
                <Users className="size-3" /> {ev.speaker}
              </span>
            )}
            {ev.whopUrl && (
              <a href={ev.whopUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="size-3" /> Join URL set
              </a>
            )}
            {!ev.whopUrl && !isPast && (
              <span className="flex items-center gap-1 text-amber-500">
                <ExternalLink className="size-3" /> No join URL set
              </span>
            )}
          </div>

          {ev.description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{ev.description}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit3 className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Session Form ── */
function SessionForm({ mode, initial, onCancel, onSave }: {
  mode: "create" | "edit";
  initial?: SessionEvent;
  onCancel: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [speaker, setSpeaker] = useState(initial?.speaker ?? "");
  const [eventDate, setEventDate] = useState(
    initial?.eventDate
      ? new Date(initial.eventDate).toISOString().slice(0, 16)
      : ""
  );
  const [dotCost, setDotCost] = useState(initial?.dotCost ?? 0);
  const [capacity, setCapacity] = useState(initial?.capacity ?? 100);
  const [joinUrl, setJoinUrl] = useState(initial?.whopUrl ?? "");
  const [saving, setSaving] = useState(false);

  const isValid = title.trim() && eventDate;

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">
          {mode === "create" ? "New live session" : `Edit · ${initial?.title}`}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Session title *
          </label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Fundraising Q&A with Benson"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <Textarea
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will be covered? Who should attend?"
          />
        </div>

        {/* Date/time */}
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Date & time * <span className="text-muted-foreground/60 normal-case">(your local time)</span>
          </label>
          <Input
            type="datetime-local"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Session goes live at this exact time. Users see "Join now" button.
          </p>
        </div>

        {/* Speaker */}
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Speaker / host
          </label>
          <Input
            value={speaker}
            onChange={e => setSpeaker(e.target.value)}
            placeholder="e.g. Benson Owiyo, DOT Capital"
          />
        </div>

        {/* Join URL */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Join URL — Zoom, Google Meet, Whop stream, YouTube Live
          </label>
          <Input
            value={joinUrl}
            onChange={e => setJoinUrl(e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/..."
            type="url"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            This link appears to registered users when the session goes live.
            You can add it now or edit later.
          </p>
        </div>

        {/* DOT cost */}
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Registration cost (DOT)
          </label>
          <Input
            type="number"
            min={0}
            value={dotCost}
            onChange={e => setDotCost(Number(e.target.value))}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            0 = free to register
          </p>
        </div>

        {/* Capacity */}
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Capacity (seats)
          </label>
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={e => setCapacity(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {isValid
            ? `Session will go live on ${new Date(eventDate).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })} at ${new Date(eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Fill in title and date to continue"
          }
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            size="sm"
            disabled={saving || !isValid}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({
                  title: title.trim(),
                  description: description.trim() || null,
                  speaker: speaker.trim() || null,
                  eventDate: eventDate ? new Date(eventDate).toISOString() : null,
                  dotCost: Number(dotCost) || 0,
                  capacity: Number(capacity) || 100,
                  whopUrl: joinUrl.trim() || null,
                });
              } catch (e: any) {
                toast.error(e?.message ?? "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {mode === "create" ? "Create session" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
