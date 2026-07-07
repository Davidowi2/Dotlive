# Meeting Scheduler Design

## Architecture Overview

The Meeting Scheduler is a full-stack feature enabling founders and investors to manage meeting availability and requests. It consists of:

- **Backend**: API routes for time slot and meeting management
- **Database**: Two new tables (meetingSlots, meetings) with proper indexing
- **Frontend**: Calendar-based UI with tabs for different views
- **Notifications**: Integration with existing notification system for status updates

## Data Model

### meetingSlots Table

```sql
CREATE TABLE meetingSlots (
  id UUID PRIMARY KEY,
  hostId UUID NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD format
  startTime TEXT NOT NULL,      -- HH:MM format
  endTime TEXT NOT NULL,        -- HH:MM format
  duration INTEGER,             -- minutes (15-480)
  status TEXT NOT NULL,         -- 'available' | 'booked' | 'confirmed'
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  
  UNIQUE(hostId, date, startTime),
  INDEX(hostId),
  INDEX(status),
  INDEX(date)
)
```

### meetings Table

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY,
  slotId UUID NOT NULL,
  hostId UUID NOT NULL,
  guestId UUID NOT NULL,
  status TEXT NOT NULL,         -- 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed'
  meetingReason TEXT,           -- optional, max 1000 chars
  declineReason TEXT,           -- optional, max 500 chars
  cancelReason TEXT,            -- optional, max 500 chars
  createdAt TIMESTAMP NOT NULL,
  confirmedAt TIMESTAMP,
  declinedAt TIMESTAMP,
  cancelledAt TIMESTAMP,
  completedAt TIMESTAMP,
  
  INDEX(hostId),
  INDEX(guestId),
  INDEX(status),
  INDEX(slotId),
  UNIQUE(guestId, slotId)
)
```

## API Endpoints

### Time Slot Management

**POST /api/meetings/slots**
- Create available time slot
- Auth: Authenticated user as Host
- Request: { date, startTime, endTime, duration? }
- Response: { id, status, createdAt }
- Validations: 
  - End time > start time
  - Date >= today
  - No overlaps for same host on same date
  - Duration 15-480 minutes if provided

**GET /api/meetings/slots**
- List available time slots (all hosts)
- Auth: Guest user
- Query params: date?, hostId?, limit?, offset?
- Response: { slots: [], total, hasMore, limit, offset }
- Returns only "available" status slots, sorted by date/time

### Meeting Management

**POST /api/meetings**
- Request meeting at specific slot
- Auth: Authenticated guest user
- Request: { slotId, meetingReason? }
- Response: { id, status: 'pending', createdAt }
- Side effects: 
  - Update slot status to 'booked'
  - Send notification to host

**GET /api/meetings**
- Get user's meetings (where user is host or guest)
- Auth: Authenticated user
- Response: { meetings: [], total, hasMore }
- Includes categorization: upcoming/completed/cancelled
- Returns contact info for other party

**POST /api/meetings/:id/confirm**
- Host confirms meeting request
- Auth: Authenticated host
- Response: { status: 'confirmed', confirmedAt }
- Side effects:
  - Update meeting status
  - Update slot status to 'confirmed'
  - Send notification to guest

**POST /api/meetings/:id/decline**
- Host declines meeting request
- Auth: Authenticated host
- Request: { declineReason? }
- Response: { status: 'declined', declinedAt, declineReason }
- Side effects:
  - Update meeting status
  - Return slot to 'available' status
  - Send notification to guest

**POST /api/meetings/:id/cancel**
- Guest cancels confirmed meeting
- Auth: Authenticated guest
- Request: { cancelReason? }
- Response: { status: 'cancelled', cancelledAt, cancelReason }
- Side effects:
  - Update meeting status
  - Return slot to 'available' status
  - Send notification to host
  - Check if < 24 hours remaining (warning)

**GET /api/meetings/export**
- Export meetings to CSV
- Auth: Authenticated host
- Response: CSV file
- Format: date, startTime, endTime, guestName, guestEmail, status, meetingReason

## Frontend Components

### Routes

**Meeting Scheduler Page** (`src/routes/_authenticated/meetings.tsx`)
- Main entry point
- Tab-based navigation: Upcoming | Available Slots | Past

### Tabs

1. **Upcoming Tab**
   - Calendar picker showing scheduled meetings
   - Cards for each meeting with:
     - Other party name and contact info
     - Date, time, meeting reason
     - Status badge
     - Actions: Confirm/Decline (for hosts), Cancel (for guests)

2. **Available Slots Tab** (for hosts)
   - Create Slot dialog
   - List of created slots with status
   - Edit/delete options

3. **Past Tab**
   - Historical meetings with final status
   - Pagination for large histories

### Dialogs

- **Create Slot Dialog**: Date, start/end time pickers, duration field
- **Request Meeting Dialog**: Slot selection, meeting reason textarea
- **Confirm/Decline/Cancel Confirmation**: Action with optional reason

## State Management

### Hooks

- `useMyMeetings()` - Fetch user's meetings with loading/error states
- `useAvailableSlots()` - Fetch available slots with filters
- `useRequestMeeting()` - Submit meeting request
- `useConfirmMeeting()` - Confirm meeting request
- `useDeclineMeeting()` - Decline meeting request
- `useCancelMeeting()` - Cancel confirmed meeting
- `useCreateSlot()` - Create time slot

## Notification Integration

Notifications sent to:
1. Host when guest requests meeting
2. Guest when host confirms meeting
3. Guest when host declines meeting
4. Host when guest cancels meeting

Each notification includes:
- Clear action message
- Date/time details
- Other party name
- Direct link to meeting details

## Error Handling

All endpoints return structured error responses:

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "message": "End time must be after start time"
}
```

## Performance Considerations

- Time slot queries: <= 500ms
- Meeting queries: <= 500ms
- Validations: <= 200ms
- Notifications: Sent within 2 seconds (or queued for retry)
- Pagination: Default 20 slots, 50 meetings per page

## Security Considerations

- Authorization checks on all user-specific endpoints
- Role-based filtering (host vs guest capabilities)
- Input validation on all text fields (max lengths)
- Transaction consistency for slot/meeting state changes
- Rate limiting on creation endpoints (implicit)

## Future Enhancements

1. Google Calendar integration
2. Automatic meeting completion (scheduled job)
3. Timezone-aware scheduling
4. Meeting reminders
5. Video call integration
6. Recurring time slots
