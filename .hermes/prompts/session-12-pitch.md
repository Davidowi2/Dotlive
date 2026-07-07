# DOT Platform — Pitch Deck & Demo System

**Session 12 Prompt — Focus: Pitch Decks, Demo Events, Pitchathons**

---

## What is Pitch Deck & Demo?

A system for ventures to showcase their pitch and participate in demo events:
- Upload/manage pitch decks (PDF)
- Demo event listings
- Pitchathon competitions
- Voting/rating system

---

## Current State

Check these files BEFORE writing any code:

1. **Pitchathons page**: `src/routes/_authenticated/pitchathons.tsx`
2. **Demo page**: `src/routes/_authenticated/demo.tsx` or similar
3. **Backend**: Check for existing pitch/demo tables

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// pitch_decks table
export const pitchDecks = pgTable("pitch_decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"), // URL to stored PDF
  version: integer("version").default(1),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// pitchathons table
export const pitchathons = pgTable("pitchathons", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("upcoming"), // upcoming, active, completed
  maxParticipants: integer("max_participants"),
  prizePool: integer("prize_pool"), // in Naira
  createdAt: timestamp("created_at").defaultNow(),
});

// pitchathon_applications
export const pitchathonApplications = pgTable("pitchathon_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  pitchathonId: uuid("pitchathon_id").notNull().references(() => pitchathons.id),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  pitchDeckId: uuid("pitch_deck_id").references(() => pitchDecks.id),
  status: text("status").default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// pitchathon_votes
export const pitchathonVotes = pgTable("pitchathon_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  pitchathonId: uuid("pitchathon_id").notNull().references(() => pitchathons.id),
  voterId: uuid("voter_id").notNull().references(() => users.id),
  applicationId: uuid("application_id").notNull().references(() => pitchathonApplications.id),
  score: integer("score").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/pitch.ts`:

```typescript
// Pitch Decks
// GET /api/pitch-decks - list decks (for logged in user)
// GET /api/pitch-decks/:id - single deck
// POST /api/pitch-decks - create deck (upload URL)
// PUT /api/pitch-decks/:id - update deck

// Pitchathons
// GET /api/pitchathons - list pitchathons
// GET /api/pitchathons/:id - single with applications
// POST /api/pitchathons - create (admin)

// Applications
// POST /api/pitchathons/:id/apply
// GET /api/pitchathons/:id/applications

// Voting
// POST /api/pitchathons/:id/vote
// GET /api/pitchathons/:id/leaderboard
```

### 3. Frontend Hook

Create `src/hooks/use-pitch.ts`:

```typescript
// usePitchDecks(ventureId)
// usePitchDeck(id)
// useCreatePitchDeck()
// usePitchathons(status)
// usePitchathon(id)
// useApply(pitchathonId, deckId)
// useVote(pitchathonId, applicationId, score)
```

### 4. Pitch Deck UI

Update venture page or create `src/routes/_authenticated/pitch-deck.tsx`:

```
- List of pitch decks
- Upload new deck (URL input for now)
- Set public/private
- View deck (open URL)
- Edit/delete
```

### 5. Pitchathon UI

Update `src/routes/_authenticated/pitchathons.tsx`:

```
- List of pitchathons (upcoming/active/completed)
- Each shows: title, dates, prize pool, status
- Click -> details page:
  - Description
  - Participant list with scores
  - Apply button (if venture owner)
  - Vote buttons (if investor)
- Leaderboard sorted by score
```

---

## Design Guidelines

- Use Card, Modal, Table components
- Show clear status badges
- PDF link should open in new tab
- Use stars for voting scores

---

## Testing

1. Upload pitch deck
2. Create/join pitchathon
3. Submit application
4. Vote on applications
5. See leaderboard

---

## IMPORTANT

- DO NOT implement actual file upload to S3/storage
- Use URL field for now (user provides link)
- DO NOT implement payment for prize pool
- Build must pass before commit