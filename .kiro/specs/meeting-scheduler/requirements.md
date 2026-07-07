# Meeting Scheduler Requirements

## Introduction

The Meeting Scheduler is a system enabling founders and investors to efficiently schedule and manage meetings on the DOT platform. Users can create time slot availability, request meetings, and manage meeting confirmations with full status tracking. The system eliminates manual coordination overhead through calendar-based scheduling, availability management, and automated status workflows.

## Glossary

- **Host**: A user who creates available time slots (typically investors or experienced founders)
- **Guest**: A user who requests meetings with the Host (typically founders seeking investment)
- **Time Slot**: A block of available time created by a Host (date, start time, end time)
- **Meeting Slot Duration**: The standard length of a meeting (e.g., 30 minutes, 1 hour)
- **Meeting Request**: A Guest's request to meet with a Host at a specific Time Slot
- **Meeting**: A confirmed meeting between a Host and Guest after the Host accepts the request
- **Meeting Status**: The current state of a meeting (pending, confirmed, cancelled, completed)
- **Pending Request**: A Meeting Request awaiting Host acceptance or decline
- **Meeting Scheduler System**: The complete platform component managing time slots, requests, and meetings

## Requirements

### Requirement 1: Create Available Time Slots

**User Story:** As a Host (investor or senior founder), I want to create available time slots, so that I can make my calendar visible to potential Guest requesters.

#### Acceptance Criteria

1. THE Meeting_Scheduler_System SHALL accept time slot creation with date (YYYY-MM-DD format), start time (24-hour HH:MM format), end time (24-hour HH:MM format), and optional duration field (15-480 minutes)
2. WHEN a Host creates a time slot, THE Meeting_Scheduler_System SHALL store it in the meeting_slots table with the Host's user ID
3. WHEN a time slot is created, THE Meeting_Scheduler_System SHALL set the initial status to "available"
4. WHEN a Host views the time slot creation form, THE Meeting_Scheduler_System SHALL display a calendar picker (allowing dates ≥1 day from current date), time picker for start and end times, and user feedback indicating time conflicts
5. IF a Host attempts to create a time slot with end time before or equal to start time, THEN THE Meeting_Scheduler_System SHALL return an error response indicating "End time must be after start time"
6. IF a Host attempts to create a time slot with date before current date (before 00:00 UTC of current date), THEN THE Meeting_Scheduler_System SHALL return an error response indicating "Cannot create time slots in the past"
7. IF a Host attempts to create a time slot that overlaps with an existing slot (WHERE start_new < end_existing AND end_new > start_existing on the same date), THEN THE Meeting_Scheduler_System SHALL return an error response indicating "Time slot overlaps with existing slot"
8. WHEN a time slot is successfully created, THE Meeting_Scheduler_System SHALL return the slot ID and display a confirmation message
9. WHERE the duration field is provided, THE Meeting_Scheduler_System SHALL use it to calculate end_time as start_time + duration minutes, and override any explicitly provided end_time

#### Success Metrics

- Time slots created within 2 seconds
- Time slot creation form loads within 1 second
- 100% prevention of overlapping time slots for same Host on same date
- Validation complete within 200ms

---

### Requirement 2: List Available Time Slots

**User Story:** As a Guest, I want to view all available time slots from Hosts, so that I can identify when they are available to meet.

#### Acceptance Criteria

1. WHEN a Guest requests the list of available time slots via GET /api/meetings/slots, THE Meeting_Scheduler_System SHALL return all time slots with status "available" from all Hosts, sorted by date ascending then by start time ascending
2. WHEN time slots are retrieved, THE Meeting_Scheduler_System SHALL include in the response: slot ID, Host ID, Host name, date (YYYY-MM-DD), start time (HH:MM), end time (HH:MM), duration (minutes), and status
3. THE Meeting_Scheduler_System SHALL retrieve time slots and return response within 500ms including database query
4. IF a Guest applies a date filter (date=YYYY-MM-DD query parameter), THE Meeting_Scheduler_System SHALL return only slots matching that exact date
5. IF a Guest applies a Host filter (host_id=UUID query parameter), THE Meeting_Scheduler_System SHALL return only slots from the specified Host
6. IF the query returns 0 results, THE Meeting_Scheduler_System SHALL return an empty array with HTTP 200, not HTTP 404
7. IF query parameters are invalid (malformed date, invalid UUID), THE Meeting_Scheduler_System SHALL return HTTP 400 with error response indicating the invalid parameter
8. WHEN time slots are paginated, THE Meeting_Scheduler_System SHALL support limit/offset parameters (default limit=20, max limit=100) and include pagination metadata (total_count, has_more, limit, offset) in response

#### Success Metrics

- Queries return within 500ms
- Pagination supports 20+ slots per page
- Filters execute within 200ms
- Error responses include clear error messages and HTTP status codes

---

### Requirement 3: Request a Meeting

**User Story:** As a Guest, I want to request a meeting at a specific available time slot, so that I can book time with a Host.

#### Acceptance Criteria

1. WHEN a Guest submits a meeting request via POST /api/meetings with payload {slot_id, meeting_reason (optional)}, THE Meeting_Scheduler_System SHALL validate that guest_id is extracted from authenticated user context and that guest_id exists as an active user, otherwise return HTTP 401
2. WHEN a meeting request is submitted, THE Meeting_Scheduler_System SHALL create a new record in the meetings table with status "pending" and record the request timestamp (ISO 8601 format)
3. WHEN a meeting request is submitted, THE Meeting_Scheduler_System SHALL validate that the time slot exists and has status "available"; IF the slot does not exist or status is not "available", THEN return error response indicating "This time slot is no longer available" (HTTP 410 or 400)
4. WHEN a meeting request is submitted, THE Meeting_Scheduler_System SHALL check if an existing pending or accepted meeting request exists for this Guest-TimeSlot pair (regardless of current request status); IF so, THEN return error response indicating "You have already requested a meeting for this slot" (HTTP 409)
5. WHEN a meeting request is successfully created within a database transaction, THE Meeting_Scheduler_System SHALL atomically update the time slot status from "available" to "booked" in the same transaction; if either operation fails, the entire transaction SHALL rollback
6. WHEN a meeting request is successfully created, THE Meeting_Scheduler_System SHALL return HTTP 201 with JSON response containing: {meeting_id (UUID), slot_id, status: "pending", created_at (ISO 8601 timestamp)}
7. WHERE meeting_reason is provided, THE Meeting_Scheduler_System SHALL validate its length is 1-1000 characters; IF exceeds 1000 characters, THEN return HTTP 400 with error indicating "Meeting reason must be 1-1000 characters"

#### Success Metrics

- Meeting request creation within 1 second
- Duplicate request detection within 200ms
- All validations complete within 300ms
- 100% transaction consistency for slot status updates

---

### Requirement 4: Host Confirms Meeting Request

**User Story:** As a Host, I want to confirm meeting requests from Guests, so that I can lock in meetings and communicate acceptance.

#### Acceptance Criteria

1. WHEN a Host confirms a meeting request via POST /api/meetings/:id/confirm, THE Meeting_Scheduler_System SHALL validate the request is authentic by verifying the Host (extracted from authenticated user context) is the Host associated with the meeting's time slot; IF not, return HTTP 403 "Not authorized"
2. WHEN a Host confirms a meeting request by meeting ID, THE Meeting_Scheduler_System SHALL update the meeting status from "pending" to "confirmed" or return an error response indicating "Meeting cannot be confirmed (invalid status)" if status is not "pending" (HTTP 400)
3. WHEN a meeting is confirmed, THE Meeting_Scheduler_System SHALL record the confirmation timestamp in ISO 8601 format in the database
4. WHEN a meeting is confirmed, THE Meeting_Scheduler_System SHALL send a notification to the Guest with message: "Your meeting with [Host Name] has been confirmed for [Date] at [Time]" (see Requirement 10 for notification handling); IF notification fails, the system SHALL queue it for retry and the confirmation SHALL persist
5. WHEN a Host confirms a meeting, THE Meeting_Scheduler_System SHALL update the associated time slot status from "booked" to "confirmed" in the same transaction
6. WHEN a confirmation succeeds, THE Meeting_Scheduler_System SHALL return HTTP 200 with JSON response containing: {meeting_id, status: "confirmed", confirmed_at (ISO 8601 timestamp)}

#### Success Metrics

- Confirmation processed within 1 second
- Notifications sent within 2 seconds (or queued for retry)
- Transaction consistency maintained for slot/meeting status sync
- Authorization checks complete within 200ms

---

### Requirement 5: Host Declines Meeting Request

**User Story:** As a Host, I want to decline meeting requests from Guests, so that I can reject meetings I cannot accommodate.

#### Acceptance Criteria

1. WHEN a Host declines a meeting request via POST /api/meetings/:id/decline with optional payload {decline_reason}, THE Meeting_Scheduler_System SHALL validate the Host (from authenticated user context) is the Host associated with the meeting's time slot; IF not, return HTTP 403 "Not authorized"
2. WHEN a Host declines a meeting request by meeting ID, THE Meeting_Scheduler_System SHALL update the meeting status from "pending" to "declined" or return error response indicating "Meeting cannot be declined (invalid status)" if status is not "pending" (HTTP 400)
3. WHEN a meeting is declined, THE Meeting_Scheduler_System SHALL record the decline timestamp (ISO 8601 format) and optional decline reason (max 500 characters)
4. WHEN a meeting is declined, THE Meeting_Scheduler_System SHALL send a notification to the Guest with message: "[Host Name] declined your meeting request" plus any provided decline reason; IF notification fails, queue for retry and decline persists
5. WHEN a meeting is declined, THE Meeting_Scheduler_System SHALL atomically change the time slot status from "booked" back to "available" in the same transaction, allowing other Guests to request it
6. WHEN a decline succeeds, THE Meeting_Scheduler_System SHALL return HTTP 200 with JSON response containing: {meeting_id, status: "declined", declined_at (ISO 8601 timestamp), decline_reason}

#### Success Metrics

- Decline processed within 1 second
- Time slot released within 500ms
- Notifications sent within 2 seconds (or queued for retry)
- Authorization checks complete within 200ms
- Transaction consistency maintained

---

### Requirement 6: Guest Cancels Meeting

**User Story:** As a Guest, I want to cancel confirmed meetings, so that I can free up the Host's time if my situation changes.

#### Acceptance Criteria

1. WHEN a Guest cancels a confirmed meeting via POST /api/meetings/:id/cancel with optional payload {cancel_reason}, THE Meeting_Scheduler_System SHALL verify the Guest (from authenticated user context) is the Guest associated with the meeting; IF not, return HTTP 403 "Not authorized"
2. WHEN a Guest cancels a meeting by meeting ID, THE Meeting_Scheduler_System SHALL update the meeting status from "confirmed" to "cancelled" or return error response indicating "Only confirmed meetings can be cancelled" if status is not "confirmed" (HTTP 400)
3. WHEN a meeting is cancelled, THE Meeting_Scheduler_System SHALL record the cancellation timestamp (ISO 8601 format) and optional cancel reason (max 500 characters)
4. WHEN a meeting is cancelled, THE Meeting_Scheduler_System SHALL send a notification to the Host with message: "[Guest Name] cancelled your meeting scheduled for [Date] at [Time]" plus any provided cancel reason; IF notification fails, queue for retry and cancellation persists
5. WHEN a meeting is cancelled, THE Meeting_Scheduler_System SHALL atomically change the time slot status from "confirmed" back to "available" in the same transaction
6. WHEN a cancellation occurs where (scheduled meeting start time - current time) < 24 hours, THE Meeting_Scheduler_System SHALL display a warning message: "Cancelling within 24 hours may impact your reputation"
7. WHEN a cancel succeeds, THE Meeting_Scheduler_System SHALL return HTTP 200 with JSON response containing: {meeting_id, status: "cancelled", cancelled_at (ISO 8601 timestamp), cancel_reason}

#### Success Metrics

- Cancellation processed within 1 second
- Time slot released within 500ms
- Notifications sent within 2 seconds (or queued for retry)
- Authorization checks complete within 200ms
- 24-hour warning calculation accurate to the minute

---

### Requirement 7: View My Meetings

**User Story:** As a User (Host or Guest), I want to view all my meetings, so that I can manage my schedule and track upcoming commitments.

#### Acceptance Criteria

1. WHEN a User requests their meetings via GET /api/meetings, THE Meeting_Scheduler_System SHALL return all meetings (active and historical) where the authenticated User is either Host or Guest
2. IF a meeting's scheduled start time is in the future, THE Meeting_Scheduler_System SHALL categorize it as "upcoming" (regardless of current status: pending or confirmed); IF a meeting's scheduled end time is in the past, categorize as "completed" (if status="confirmed") or "cancelled" (if status="cancelled" or "declined")
3. WHEN meetings are displayed, THE Meeting_Scheduler_System SHALL include for each meeting: meeting_id, other_party (Host name if User is Guest, Guest name if User is Host), date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), status, meeting_reason (with fallback placeholder "No reason provided" if absent), and contact info (email and phone number if available)
4. WHEN a User views their meetings, THE Meeting_Scheduler_System SHALL retrieve and return the complete dataset within 500ms including database query
5. IF meetings returned are categorized as "upcoming", THE Meeting_Scheduler_System SHALL sort by date ascending, then by start_time ascending
6. WHEN a User views a confirmed meeting, THE Meeting_Scheduler_System SHALL display the other party's contact information (email and phone number, if available)
7. WHEN the result set exceeds 50 meetings, THE Meeting_Scheduler_System SHALL paginate with limit/offset (default limit=50, max=200) and include pagination metadata: {total_count, has_more, limit, offset}
8. IF no meetings exist for the User, THE Meeting_Scheduler_System SHALL return HTTP 200 with empty array and message "No meetings scheduled" for frontend display

#### Success Metrics

- Queries return within 500ms
- Displays up to 50 meetings per page with pagination
- Upcoming meetings highlighted and sorted distinctly
- Contact information displayed consistently
- Empty state handled gracefully

---

### Requirement 8: Meeting Status Tracking

**User Story:** As a User, I want to track the complete status of all my meetings, so that I can understand the state of each interaction and plan accordingly.

#### Acceptance Criteria

1. THE Meeting_Scheduler_System SHALL maintain the following meeting status values: "pending", "confirmed", "declined", "cancelled", "completed"
2. WHEN a meeting reaches its scheduled end time (when current timestamp >= scheduled end_time), THE Meeting_Scheduler_System SHALL automatically mark it "completed" (if currently "confirmed") via scheduled job or background task
3. WHEN a meeting status changes, THE Meeting_Scheduler_System SHALL record the timestamp of the change with millisecond precision (ISO 8601 format)
4. WHEN a User views a meeting, THE Meeting_Scheduler_System SHALL display a visual indicator showing one of the five defined status values with color coding or icon differentiation
5. WHEN viewing meeting history (paginated queries with past meetings), THE Meeting_Scheduler_System SHALL display all meetings from the past 12 months with final status and completion timestamp
6. IF a meeting status changes to "declined" or "cancelled", THE Meeting_Scheduler_System SHALL store and display the reason provided (max 500 characters) or empty if not provided; display logic: IF reason is present, show "Reason: [reason]" else show no reason text
7. IF a User's result set contains 500+ historical meetings, THE Meeting_Scheduler_System SHALL paginate with default limit=50 per page (supports pagination query parameters)

#### Success Metrics

- Status updates within 1 second
- Status change history retrievable within 500ms
- Automatic status completion accurate to within 1 minute
- Pagination handles large history sets efficiently
- Status display consistent across all UI surfaces

---

### Requirement 9: Validate Time Slot Constraints

**User Story:** As a System, I want to enforce time slot constraints, so that meetings do not overlap and data integrity is maintained.

#### Acceptance Criteria

1. WHEN a Host creates a time slot, THE Meeting_Scheduler_System SHALL validate that end_time is strictly after start_time; in UTC timezone, IF end_time <= start_time, return error: "End time must be after start time" (HTTP 400)
2. WHEN a Host creates a time slot on a specific date in a specific timezone, THE Meeting_Scheduler_System SHALL prevent creation of overlapping slots where (start_new < end_existing AND end_new > start_existing AND date_new == date_existing AND host_id_new == host_id_existing); IF overlap detected, return error: "Time slot overlaps with existing slot" (HTTP 409)
3. WHEN a Host creates a time slot, THE Meeting_Scheduler_System SHALL validate that duration (if provided) is within 15-480 minutes (0.25-8 hours); IF outside bounds, return error: "Duration must be between 15 and 480 minutes" (HTTP 400)
4. WHEN a meeting request is submitted for a time slot, THE Meeting_Scheduler_System SHALL verify the time slot still exists AND status is "available"; IF condition not met, return error: "This time slot is no longer available" (HTTP 410 if deleted, 400 if status changed)
5. THE Meeting_Scheduler_System SHALL use consistent UTC timezone for all internal comparisons and storage; times are converted to host's local timezone for display only
6. WHEN validation fails, THE Meeting_Scheduler_System SHALL return specific error messages identifying the constraint violated with HTTP status code (400 for malformed input, 409 for conflict, 410 for resource gone)

#### Success Metrics

- Validation complete within 200ms
- 100% prevention of overlapping slots (no race conditions in concurrent requests)
- Error responses precise and actionable
- Timezone handling consistent across all time calculations

---

### Requirement 10: Integrate with Notifications System

**User Story:** As a User, I want to receive notifications about meeting requests and status changes, so that I stay informed without manually checking the app.

#### Acceptance Criteria

1. WHEN a meeting request is created, THE Meeting_Scheduler_System SHALL send a notification to the Host via in-app notification channel with message: "New meeting request from [Guest Name] at [Date] [Time]" plus meeting_id link within 2 seconds
2. WHEN a Host confirms a meeting, THE Meeting_Scheduler_System SHALL send a notification to the Guest via in-app notification channel with message: "Your meeting with [Host Name] has been confirmed for [Date] at [Time]" plus meeting_id link within 2 seconds
3. WHEN a Host declines a meeting, THE Meeting_Scheduler_System SHALL send a notification to the Guest via in-app notification channel with message: "[Host Name] declined your meeting request" plus decline reason (if provided) within 2 seconds
4. WHEN a Guest cancels a meeting, THE Meeting_Scheduler_System SHALL send a notification to the Host via in-app notification channel with message: "[Guest Name] cancelled your meeting scheduled for [Date] at [Time]" plus cancel reason (if provided) within 2 seconds
5. IF a notification fails to send, THE Meeting_Scheduler_System SHALL automatically queue it for retry (up to 3 attempts) with exponential backoff (30-second base delay): subsequent attempts within 60-second window; IF all retries fail, log the error and do NOT block the original action (meeting confirmation/decline/cancellation persists)
6. WHEN notifications are sent, THE Meeting_Scheduler_System SHALL include meeting details (date, time, other party name) and direct link to meeting details view (as query parameter meeting_id)
7. THE Meeting_Scheduler_System SHALL support user notification preferences (opt-in/opt-out) stored in user profile; IF user has opted out, skip notification send (but do not block action)

#### Success Metrics

- Notifications sent within 2 seconds of action (first attempt)
- 99% delivery rate (including retries)
- All actionable links functional and traceable
- Retry mechanism prevents thundering herd (exponential backoff)
- User preference settings respected

---

### Requirement 11: Export Meeting Data

**User Story:** As a User (Host), I want to export my meeting schedule, so that I can manage my calendar in external tools.

#### Acceptance Criteria

1. WHEN a Host requests to export meeting data via GET /api/meetings/export, THE Meeting_Scheduler_System SHALL generate a CSV file downloadable to the user's device containing all meetings where the authenticated Host is the host_id
2. WHEN meetings are exported, THE Meeting_Scheduler_System SHALL include CSV columns: date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), guest_name, guest_email, meeting_status, meeting_reason
3. THE Meeting_Scheduler_System SHALL generate CSV files with: UTF-8 encoding, comma delimiter, CRLF line endings (\r\n), header row with column names, dates in ISO 8601 format (±5 years from current date)
4. WHEN a Host exports meetings, THE Meeting_Scheduler_System SHALL include only meetings where the authenticated user is the Host; IF user is not a Host for any meetings, return empty CSV with headers only
5. FOR NULL/empty fields in CSV (e.g., missing guest email or meeting_reason), THE Meeting_Scheduler_System SHALL export as empty string (no "NULL" text or special markers)
6. WHEN meetings are exported, THE Meeting_Scheduler_System SHALL include all meeting statuses (Pending, Confirmed, Declined, Cancelled, Completed) in enumerated form
7. WHEN a Host requests export, THE Meeting_Scheduler_System SHALL return HTTP 200 with Content-Type: text/csv and Content-Disposition header with filename: "meetings_export_[timestamp].csv" (timestamp in ISO 8601 format); generate file within 2 seconds

#### Success Metrics

- Export generated within 2 seconds
- CSV file format valid and parseable by Excel, Google Sheets, and standard spreadsheet applications
- All special characters properly escaped
- Timezone handling consistent (all times in user's local timezone or ISO 8601 UTC with Z suffix)

---

## Common Acceptance Criteria Patterns for Testing

### Property-Based Testing Candidates

1. **Round-Trip Property (Serialization)**
   - Requirement: Meeting data created → exported → re-imported SHALL maintain data integrity
   - Property: `parse(format(meeting)) == meeting`

2. **Invariant Property (Data Integrity)**
   - Requirement: After confirming a meeting, time slot status SHALL always be "confirmed"
   - Property: `meeting.status == "confirmed" ⟹ timeSlot.status == "confirmed"`

3. **Idempotence Property (State Operations)**
   - Requirement: Declining the same meeting multiple times SHALL not create duplicate declines
   - Property: `decline(meeting) = decline(decline(meeting))`

4. **Metamorphic Property (Relationships)**
   - Requirement: Count of pending meetings SHALL be less than total meetings
   - Property: `count(meetings | status == "pending") ≤ count(all_meetings)`

5. **Error Condition Property**
   - Requirement: Invalid inputs (past dates, invalid times) SHALL always produce errors with proper error codes
   - Property: `invalidInput → errorResponse.statusCode == 400`

### Integration Test Candidates

- Notification delivery to actual notification system (external service)
- Time slot persistence to database (infrastructure test)
- End-to-end workflow: create slot → request → confirm → view

