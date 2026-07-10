/**
 * Meetings routes — calendar/scheduler for founders and investors.
 *
 * GET    /api/meetings/slots             — list available slots (with filters)
 * POST   /api/meetings/slots             — create available slot (host)
 * POST   /api/meetings                   — request meeting (guest)
 * GET    /api/meetings                   — my meetings (as host or guest)
 * POST   /api/meetings/:id/confirm       — host confirms meeting
 * POST   /api/meetings/:id/decline       — host declines meeting
 * POST   /api/meetings/:id/cancel        — cancel meeting
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, or, desc, gte, lte, sql } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { meetings, meetingSlots, users } from "../db/schema.js";
import { notify } from "../lib/notify.js";
import { publicCache, cached, k, invalidatePrefix } from "../lib/cache.js";

const MEETINGS_TTL_MS = 30_000; // 30s — list of my meetings (per-user, invalidated on writes)
const SLOTS_TTL_MS    = 30_000; // 30s — available slots list (public-ish, invalidated on writes)

const createSlotSchema = z.object({
  title: z.string().min(1).max(255).optional().default("Available Slot"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  endTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  durationMinutes: z.number().int().min(15).max(480).optional(),
});

const requestMeetingSchema = z.object({
  slotId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  meetingReason: z.string().max(1000).optional(),
});

const confirmDeclineSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function meetingsRoutes(app: FastifyInstance) {
  /** GET /meetings/slots — list available slots */
  app.get("/meetings/slots", { preHandler: app.authenticate }, async (req, reply) => {
    const { hostId, date, startDate, endDate } = req.query as {
      hostId?: string;
      date?: string;
      startDate?: string;
      endDate?: string;
    };

    // Cache key — every query dimension is part of the key so two callers
    // asking for different filters get independent entries.
    const cacheKey = k("meetings:slots", hostId ?? "any", date ?? "any", startDate ?? "", endDate ?? "");

    const slots = await cached(publicCache, cacheKey, SLOTS_TTL_MS, async () => {
      // Build filter conditions
      const filters: any[] = [eq(meetingSlots.status, "available")];
      if (hostId) filters.push(eq(meetingSlots.hostId, hostId));
      if (date) filters.push(eq(meetingSlots.date, date));
      if (startDate && endDate) {
        filters.push(gte(meetingSlots.date, startDate));
        filters.push(lte(meetingSlots.date, endDate));
      }

      const whereClause = and(...filters);

      return db
        .select({
          id: meetingSlots.id,
          hostId: meetingSlots.hostId,
          hostName: users.name,
          title: meetingSlots.title,
          date: meetingSlots.date,
          startTime: meetingSlots.startTime,
          endTime: meetingSlots.endTime,
          durationMinutes: meetingSlots.durationMinutes,
          status: meetingSlots.status,
          createdAt: meetingSlots.createdAt,
        })
        .from(meetingSlots)
        .leftJoin(users, eq(users.id, meetingSlots.hostId))
        .where(whereClause)
        .orderBy(meetingSlots.date, meetingSlots.startTime);
    });

    // Return the array directly — matches the `Promise<MeetingSlot[]>` contract
    // declared by the frontend client (`src/api/meetings.ts#getAvailableSlots`).
    reply.header("Cache-Control", `public, max-age=${Math.floor(SLOTS_TTL_MS / 1000)}`);
    return reply.send(slots);
  });

  /** POST /meetings/slots — create available slot (host) */
  app.post("/meetings/slots", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = createSlotSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { title, date, startTime, endTime, durationMinutes } = parsed.data;

    // Validate time
    if (startTime >= endTime) {
      return reply.code(400).send({ error: "End time must be after start time" });
    }

    // Check for past date
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      return reply.code(400).send({ error: "Cannot create time slots in the past" });
    }

    // Check for overlapping slots
    const existing = await db
      .select()
      .from(meetingSlots)
      .where(
        and(
          eq(meetingSlots.hostId, sub),
          eq(meetingSlots.date, date),
          sql`${meetingSlots.startTime} < ${endTime} AND ${meetingSlots.endTime} > ${startTime}`
        )
      );

    if (existing.length > 0) {
      return reply.code(409).send({ error: "Time slot overlaps with existing slot" });
    }

    // Create slot
    const id = crypto.randomUUID();
    await db.insert(meetingSlots).values({
      id,
      hostId: sub,
      title,
      date,
      startTime,
      endTime,
      durationMinutes: durationMinutes || 30,
      status: "available",
    } as any);

    // Invalidate slot list caches — a new slot changes the list.
    invalidatePrefix("meetings:slots");

    const [slot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, id));
    return reply.status(201).send(slot);
  });

  /** POST /meetings — request meeting (guest) */
  app.post("/meetings", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = requestMeetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { slotId, title, description, meetingReason } = parsed.data;

    // Verify slot exists and is available
    const [slot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, slotId));
    if (!slot) {
      return reply.code(410).send({ error: "This time slot is no longer available" });
    }
    if (slot.status !== "available") {
      return reply.code(400).send({ error: "This time slot is no longer available" });
    }

    // Prevent host from requesting their own slot
    if (slot.hostId === sub) {
      return reply.code(400).send({ error: "Cannot request your own meeting slot" });
    }

    // Check for duplicate requests
    const existingRequest = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.slotId, slotId), eq(meetings.guestId, sub)));

    if (existingRequest.length > 0) {
      return reply.code(409).send({ error: "You have already requested a meeting for this slot" });
    }

    // Calculate scheduled time
    const scheduledAt = new Date(`${slot.date}T${slot.startTime}:00`);

    // Create meeting and update slot in transaction
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(meetings).values({
        id,
        slotId,
        hostId: slot.hostId,
        guestId: sub,
        title,
        description,
        meetingReason,
        status: "pending",
        scheduledAt,
      } as any);

      await tx
        .update(meetingSlots)
        .set({ status: "booked" } as any)
        .where(eq(meetingSlots.id, slotId));
    });

    // Invalidate caches — a new meeting is created and the slot is now booked.
    // Both the slots list (the booked slot must drop out of "available") and
    // both the host's and guest's meeting lists need to refresh.
    invalidatePrefix("meetings:slots");
    invalidatePrefix("meetings:list");

    // Notify host
    const [guest] = await db.select().from(users).where(eq(users.id, sub));
    const [host] = await db.select().from(users).where(eq(users.id, slot.hostId));

    if (host && guest) {
      await notify({
        userId: host.id,
        title: `New meeting request from ${guest.name || "Unknown"}`,
        body: `At ${slot.date} ${slot.startTime}`,
        type: "meeting_requested",
        link: `/meetings`,
      });
    }

    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return reply.status(201).send(meeting);
  });

  /** GET /meetings — my meetings (as host or guest) */
  app.get("/meetings", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { status } = req.query as { status?: string };

    // Cache key — user + status filter (host and guest both see this same list,
    // but the cache is per-user so two users don't share data).
    const cacheKey = k("meetings:list", sub, status ?? "all");

    const payload = await cached(publicCache, cacheKey, MEETINGS_TTL_MS, async () => {
      const now = new Date();

      let whereCondition = or(eq(meetings.hostId, sub), eq(meetings.guestId, sub));

      const meetingsList = await db
        .select({
          id: meetings.id,
          slotId: meetings.slotId,
          hostId: meetings.hostId,
          guestId: meetings.guestId,
          title: meetings.title,
          description: meetings.description,
          meetingReason: meetings.meetingReason,
          status: meetings.status,
          scheduledAt: meetings.scheduledAt,
          confirmedAt: meetings.confirmedAt,
          declinedAt: meetings.declinedAt,
          declinedReason: meetings.declinedReason,
          cancelledAt: meetings.cancelledAt,
          cancelledReason: meetings.cancelledReason,
          createdAt: meetings.createdAt,
          // Get other party info
          hostName: users.name,
          hostEmail: users.email,
        })
        .from(meetings)
        .leftJoin(users, eq(users.id, meetings.hostId))
        .where(whereCondition)
        .orderBy(desc(meetings.scheduledAt));

      // Categorize meetings
      const categorized = {
        upcoming: meetingsList.filter(m =>
          (m.status === "pending" || m.status === "confirmed") && new Date(m.scheduledAt) > now
        ),
        past: meetingsList.filter(m =>
          new Date(m.scheduledAt) <= now || m.status === "completed"
        ),
        cancelled: meetingsList.filter(m =>
          m.status === "cancelled" || m.status === "declined"
        ),
      };

      if (status === "upcoming") {
        return categorized.upcoming;
      }
      if (status === "past") {
        return categorized.past;
      }

      return meetingsList;
    });

    reply.header("Cache-Control", `private, max-age=${Math.floor(MEETINGS_TTL_MS / 1000)}`);
    return reply.send(payload);
  });

  /** POST /meetings/:id/confirm — host confirms meeting */
  app.post("/meetings/:id/confirm", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) {
      return reply.code(404).send({ error: "Meeting not found" });
    }

    // Verify user is host
    if (meeting.hostId !== sub) {
      return reply.code(403).send({ error: "Not authorized" });
    }

    // Verify status is pending
    if (meeting.status !== "pending") {
      return reply.code(400).send({ error: "Meeting cannot be confirmed (invalid status)" });
    }

    // Update meeting and slot
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(meetings)
        .set({ status: "confirmed", confirmedAt: now, updatedAt: now } as any)
        .where(eq(meetings.id, id));

      await tx
        .update(meetingSlots)
        .set({ status: "confirmed" } as any)
        .where(eq(meetingSlots.id, meeting.slotId));
    });

    // Notify guest
    const [host] = await db.select().from(users).where(eq(users.id, sub));
    const [slot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, meeting.slotId));

    if (host && slot) {
      await notify({
        userId: meeting.guestId,
        title: `Meeting confirmed`,
        body: `Your meeting with ${host.name || "Host"} has been confirmed for ${slot.date} at ${slot.startTime}`,
        type: "meeting_accepted",
        link: `/meetings`,
      });
    }

    // Invalidate caches — confirmed meetings must disappear from the slots list
    // (slot is now `confirmed`, not `available`) and refresh both parties' lists.
    invalidatePrefix("meetings:slots");
    invalidatePrefix("meetings:list");

    const [updated] = await db.select().from(meetings).where(eq(meetings.id, id));
    return reply.send(updated);
  });

  /** POST /meetings/:id/decline — host declines meeting */
  app.post("/meetings/:id/decline", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = confirmDeclineSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;

    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) {
      return reply.code(404).send({ error: "Meeting not found" });
    }

    // Verify user is host
    if (meeting.hostId !== sub) {
      return reply.code(403).send({ error: "Not authorized" });
    }

    // Verify status is pending
    if (meeting.status !== "pending") {
      return reply.code(400).send({ error: "Meeting cannot be declined (invalid status)" });
    }

    // Update meeting and slot
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(meetings)
        .set({ status: "declined", declinedAt: now, declinedReason: reason, updatedAt: now } as any)
        .where(eq(meetings.id, id));

      // Release slot back to available
      await tx
        .update(meetingSlots)
        .set({ status: "available" } as any)
        .where(eq(meetingSlots.id, meeting.slotId));
    });

    // Notify guest
    const [host] = await db.select().from(users).where(eq(users.id, sub));
    if (host) {
      await notify({
        userId: meeting.guestId,
        title: `Meeting declined`,
        body: `${host.name || "Host"} declined your meeting request${reason ? `: ${reason}` : ""}`,
        type: "system",
        link: `/meetings`,
      });
    }

    // Invalidate caches — declined meetings must release the slot back to
    // `available` (slots list refresh) and move the meeting out of "upcoming"
    // on both parties' lists.
    invalidatePrefix("meetings:slots");
    invalidatePrefix("meetings:list");

    const [updated] = await db.select().from(meetings).where(eq(meetings.id, id));
    return reply.send(updated);
  });

  /** POST /meetings/:id/cancel — cancel meeting */
  app.post("/meetings/:id/cancel", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = confirmDeclineSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;

    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) {
      return reply.code(404).send({ error: "Meeting not found" });
    }

    // Verify user is host or guest
    if (meeting.hostId !== sub && meeting.guestId !== sub) {
      return reply.code(403).send({ error: "Not authorized" });
    }

    // Verify status is confirmed
    if (meeting.status !== "confirmed") {
      return reply.code(400).send({ error: "Only confirmed meetings can be cancelled" });
    }

    // Check if within 24 hours
    const hoursUntilMeeting = (new Date(meeting.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
    const isWithin24Hours = hoursUntilMeeting < 24;

    // Update meeting and slot
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(meetings)
        .set({ status: "cancelled", cancelledAt: now, cancelledReason: reason, updatedAt: now } as any)
        .where(eq(meetings.id, id));

      // Release slot back to available
      await tx
        .update(meetingSlots)
        .set({ status: "available" } as any)
        .where(eq(meetingSlots.id, meeting.slotId));
    });

    // Notify the other party
    const otherUserId = meeting.hostId === sub ? meeting.guestId : meeting.hostId;
    const [user] = await db.select().from(users).where(eq(users.id, sub));
    const [slot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, meeting.slotId));

    if (user && slot) {
      await notify({
        userId: otherUserId,
        title: `Meeting cancelled`,
        body: `${user.name || "User"} cancelled your meeting scheduled for ${slot.date} at ${slot.startTime}${reason ? `: ${reason}` : ""}`,
        type: "system",
        link: `/meetings`,
      });
    }

    // Invalidate caches — cancelled meetings must release the slot back to
    // `available` (slots list refresh) and move the meeting out of "upcoming"
    // on both parties' lists.
    invalidatePrefix("meetings:slots");
    invalidatePrefix("meetings:list");

    const [updated] = await db.select().from(meetings).where(eq(meetings.id, id));
    return reply.send({
      ...updated,
      warning: isWithin24Hours ? "Cancelling within 24 hours may impact your reputation" : undefined,
    });
  });

  /** PUT /meetings/slots/:id — edit an available slot (host only, only if status is available) */
  app.put("/meetings/slots/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    const parsed = createSlotSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    // Check if slot exists and belongs to user
    const [slot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, id));
    if (!slot) {
      return reply.code(404).send({ error: "Slot not found" });
    }
    if (slot.hostId !== sub) {
      return reply.code(403).send({ error: "Not authorized" });
    }
    if (slot.status !== "available") {
      return reply.code(400).send({ error: "Cannot edit a slot that is booked or confirmed" });
    }

    const { title, date, startTime, endTime, durationMinutes } = parsed.data;

    // Validate time
    if (startTime >= endTime) {
      return reply.code(400).send({ error: "End time must be after start time" });
    }

    // Check for past date
    const slotDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      return reply.code(400).send({ error: "Cannot set time slots in the past" });
    }

    // Check for overlapping slots (excluding the current slot)
    const existing = await db
      .select()
      .from(meetingSlots)
      .where(
        and(
          eq(meetingSlots.hostId, sub),
          eq(meetingSlots.date, date),
          sql`${meetingSlots.startTime} < ${endTime} AND ${meetingSlots.endTime} > ${startTime}`,
          sql`${meetingSlots.id} != ${id}`
        )
      );

    if (existing.length > 0) {
      return reply.code(409).send({ error: "Time slot overlaps with existing slot" });
    }

    // Update slot
    await db
      .update(meetingSlots)
      .set({
        title,
        date,
        startTime,
        endTime,
        durationMinutes: durationMinutes || 30,
      })
      .where(eq(meetingSlots.id, id));

    invalidatePrefix("meetings:slots");

    const [updatedSlot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, id));
    return reply.send(updatedSlot);
  });

  /** DELETE /meetings/slots/:id — delete an available slot (host only, only if status is available) */
  app.delete("/meetings/slots/:id", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };

    // Check if slot exists and belongs to user
    const [slot] = await db.select().from(meetingSlots).where(eq(meetingSlots.id, id));
    if (!slot) {
      return reply.code(404).send({ error: "Slot not found" });
    }
    if (slot.hostId !== sub) {
      return reply.code(403).send({ error: "Not authorized" });
    }
    if (slot.status !== "available") {
      return reply.code(400).send({ error: "Cannot delete a slot that is booked or confirmed" });
    }

    await db.delete(meetingSlots).where(eq(meetingSlots.id, id));

    invalidatePrefix("meetings:slots");

    return reply.status(204).send();
  });

  /** PUT /meetings/:id/coordination — update meeting coordination details (host or guest) */
  app.put("/meetings/:id/coordination", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    
    const updateCoordinationSchema = z.object({
      meetingPlatform: z.string().optional(),
      meetingLink: z.string().optional(),
      coordinationNotes: z.string().optional(),
      agenda: z.array(z.any()).optional(),
    });

    const parsed = updateCoordinationSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });
    }

    // Check if meeting exists and user is host or guest
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) {
      return reply.code(404).send({ error: "Meeting not found" });
    }
    if (meeting.hostId !== sub && meeting.guestId !== sub) {
      return reply.code(403).send({ error: "Not authorized" });
    }

    // Update meeting
    const now = new Date();
    await db
      .update(meetings)
      .set({ 
        ...parsed.data, 
        updatedAt: now 
      })
      .where(eq(meetings.id, id));

    invalidatePrefix("meetings:list");

    const [updatedMeeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return reply.send(updatedMeeting);
  });
}
