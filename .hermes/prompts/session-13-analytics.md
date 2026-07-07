# DOT Platform — Analytics Dashboard Implementation

**Session 13 Prompt — Focus: Analytics & Insights**

---

## What is Analytics Dashboard?

An analytics dashboard for founders and investors to track platform activity:
- Venture metrics (views, vouches, investment interest)
- Investor activity (portfolio performance, meetings)
- Platform-wide trends
- Growth charts

---

## Current State

Check these files BEFORE writing any code:

1. **Analytics existing**: Check for any analytics components
2. **Dashboard**: `src/routes/_authenticated/dashboard.tsx`
3. **Backend**: Check for existing analytics/metrics tables

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// page_views table - track profile views
export const pageViews = pgTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id), // viewed user (venture)
  viewerId: uuid("viewer_id").references(() => users.id), // who viewed
  pageType: text("page_type").notNull(), // "venture", "founder", "builder"
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// activity_log table - general activity tracking
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "vouch_given", "investment_made", "meeting_scheduled"
  metadata: jsonb("metadata"), // { ventureId, amount, etc }
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/analytics.ts`:

```typescript
// GET /api/analytics/views - page views for user's venture
// Query: ?period=7d|30d|90d

// GET /api/analytics/activity - activity log
// Query: ?period=7d|30d

// GET /api/analytics/overview - summary stats
// Returns: { totalViews, totalVouches, totalInvestments, growth }

// GET /api/analytics/trends - time series data
// Returns: { views: [...], vouches: [...], investments: [...] }
```

### 3. Frontend Hook

Create `src/hooks/use-analytics.ts`:

```typescript
// usePageViews(period?)
// useActivity(period?)
// useAnalyticsOverview()
// useTrends(period?)
```

### 4. Analytics Dashboard UI

Create `src/routes/_authenticated/analytics.tsx`:

```
- Overview cards:
  - Total profile views (with % change)
  - Total vouches received
  - Investment interest
  - Meeting requests

- Views chart (line chart - views over time)
- Recent activity feed:
  - Who viewed profile
  - Who vouched
  - Investment inquiries

- Period selector: 7 days | 30 days | 90 days
```

### 5. Investor Analytics

Create or update for investor view:

```
- Portfolio value over time
- Total dividends earned
- Meetings attended
- Active investments
```

---

## Design Guidelines

- Use existing Card components for stat boxes
- Use Recharts or similar for charts (check if already in project)
- Show percentage changes (+15% this week)
- Empty states for no data

---

## Testing

1. Visit analytics page
2. See overview cards
3. Change period
4. View activity feed

---

## IMPORTANT

- DO NOT implement real-time analytics
- Use simple aggregation queries
- Build must pass before commit