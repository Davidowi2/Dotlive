# DOT Platform — Notifications OS Implementation

**Session 5 Prompt — Focus: Notifications as an Operating System**

---

## What is Notifications OS?

Notifications on DOT should work like a modern OS notification center:
- 3 tabs: All, Unread, Archived
- Bell icon with unread count badge in header
- Mark as read / unread toggle
- Archive / unarchive actions
- Real-time updates

---

## Current State

Check these files BEFORE writing any code:

1. **Existing notifications page**: `src/routes/_authenticated/notifications.tsx`
   - Currently has basic empty state
   - Uses `useNotifications()` hook (check if it exists)

2. **Bell in header**: `src/components/app/AppShell.tsx` or similar
   - Look for notification bell icon

3. **Backend routes**: `dotlive-backend/apps/api/src/routes/notifications.ts`
   - Check existing endpoints

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "mention", "vouch", "stake", "meeting", "system"
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"), // URL to navigate to
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relationships
// notifications.userId -> users.id
```

### 2. API Routes

Create or update `dotlive-backend/apps/api/src/routes/notifications.ts`:

```typescript
// GET /api/notifications - list user's notifications
// Query params: ?tab=all|unread|archived&limit=20&offset=0
// Returns: { notifications: [...], unreadCount: number }

// POST /api/notifications/:id/read - mark as read
// POST /api/notifications/:id/unread - mark as unread
// POST /api/notifications/:id/archive - archive
// POST /api/notifications/:id/unarchive - unarchive

// POST /api/notifications/mark-all-read - mark all as read
```

### 3. Frontend Hook

Create `src/hooks/use-notifications.ts`:

```typescript
// useNotifications(tab: "all" | "unread" | "archived", options)
// useMarkRead(notificationId)
// useMarkAllRead()
// useArchive(notificationId)
```

### 4. Bell Badge in Header

Update the header component to show:
- Bell icon
- Red badge with unread count (e.g., "3")
- Click navigates to /notifications

### 5. Notifications Page

Update `src/routes/_authenticated/notifications.tsx`:

- **Tab navigation**: All | Unread | Archived
- **List of notifications**: Each notification shows:
  - Icon based on type (mention/vouch/stake/meeting/system)
  - Title (bold if unread)
  - Body text
  - Timestamp (relative: "2h ago", "Yesterday")
  - Actions: Read/Unread, Archive
- **Empty states** for each tab
- **Mark all as read** button in header

### 6. Notification Types & Icons

```typescript
const NOTIFICATION_ICONS = {
  mention: AtSign,
  vouch: ShieldCheck,
  stake: Coins,
  meeting: Calendar,
  system: Bell,
};
```

---

## Design Guidelines

- Use existing UI components (Badge, Button, Card)
- Match the empty state style from other pages
- Bell badge: red circle, white text, positioned top-right of bell icon
- Unread notifications: bold title, light background
- Swipe or click actions for archive/read

---

## Testing

1. Go to /notifications - should show empty state or list
2. Click tabs - should filter correctly
3. Click bell in header - should navigate to notifications
4. Test mark read/unread, archive/unarchive

---

## IMPORTANT

- DO NOT invent new database columns that aren't in this prompt
- DO NOT create new API endpoints not listed here
- Use existing UI components from src/components/ui
- Check existing empty state patterns in other pages
- Build must pass (`npm run build`) before commit