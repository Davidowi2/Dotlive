# DOT Platform — Meeting Scheduler Implementation

**Session 10 Prompt — Focus: Meeting Scheduling System**

---

## What is Meeting Scheduler?

A system for founders and investors to schedule and manage meetings:
- Calendar-based scheduling
- Available time slots
- Meeting requests with accept/decline
- Integration with notifications
- Meeting status tracking

---

## Current State

Check these files BEFORE writing any code:

1. **Meetings page**: `src/routes/_authenticated/meetings.tsx`
2. **Backend routes**: Check existing meeting-related endpoints
3. **Schema**: Check for `meetings` table

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// meeting_slots table - available times
export const meetingSlots = pgTable("meeting_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: uuid("host_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(), // "09:00", "10:00"
  endTime: text("end_time").notNull(),
  durationMinutes: integer("duration_minutes").default(30),
  isBooked: boolean("is_booked").default(false),
});

// meetings table
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => meetingSlots.id),
  hostId: uuid("host_id").notNull().references(() => users.id),
  guestId: uuid("guest_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, confirmed, cancelled, completed
  scheduledAt: timestamp("scheduled_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/meetings.ts`:

```typescript
// GET /api/meetings/slots?hostId=xxx&date=2026-07-15
// GET /api/meetings/slots/availability?hostId=xxx&startDate=...&endDate=...

// POST /api/meetings/slots - create available slots (host)
// Body: { date, startTime, endTime, durationMinutes }

// POST /api/meetings - request meeting
// Body: { slotId, title, description }

// POST /api/meetings/:id/confirm - host confirms
// POST /api/meetings/:id/decline - host declines
// POST /api/meetings/:id/cancel - cancel meeting

// GET /api/meetings - my meetings (as host or guest)
// Query: ?status=upcoming|past
```

### 3. Frontend Hook

Create `src/hooks/use-meetings.ts`:

```typescript
// useAvailableSlots(hostId, date)
// useCreateSlot(date, times)
// useRequestMeeting(slotId, title)
// useConfirmMeeting(meetingId)
// useDeclineMeeting(meetingId)
// useMyMeetings(status)
```

### 4. Scheduling UI

Update `src/routes/_authenticated/meetings.tsx`:

```
- Calendar view or date picker
- Available slots for selected date
- Meeting request form
- My meetings (upcoming/past tabs)
- Accept/Decline buttons for host
```

---

## Design Guidelines

- Use existing Calendar, Modal components
- Show clear time slots
- Display meeting status with colors
- Include notification triggers on request/confirm/decline

---

## Testing

1. Create available slot as host
2. Guest requests meeting
3. Host confirms/declines
4. Both see meeting in their list

---

## IMPORTANT

- DO NOT integrate with external calendar (Google, etc.)
- Use simple time slot model
- Build must pass before commit