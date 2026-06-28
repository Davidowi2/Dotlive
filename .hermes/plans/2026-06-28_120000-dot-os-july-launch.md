# DOT OS — July Launch Plan (v2)

> **For Hermes:** Use subagent-driven-development skill to implement task-by-task. Each task = one shipping unit.

**Goal:** Ship a *user-ready* DOT OS for July 2026 launch. Every product surface must feel like its own world — rich detail, real-feeling content, reference-quality UX taken from the best of YC / Upwork / Product Hunt / LinkedIn / Substack / Notion. No placeholder pages, no broken CTAs, no mock data on shipped pages.

**Architecture:** Each product surface (Discover, Communities, DOT Work, Builder Arena, DOT Demo, Investor Portal, etc.) is a standalone product with its own data model, routes, identity, and self-contained flows. They share the platform primitives (auth, wallet, roles, notifications) but own their own UX.

**Tech Stack:** TanStack Start (frontend) · Fastify + Drizzle + Neon (backend) · Resend (email) · Paystack (Naira in/out) · Vercel (frontend) · Render (backend)

**Reference apps:** YC Startup Directory · Upwork marketplace · Product Hunt launches · LinkedIn profiles · Substack posts · Notion pages · Discord/Slack channels · Whop communities.

---

## User decisions (locked in)

1. **Roles** → Any authenticated user can post services/jobs/ventures. Drop founder-only checks.
2. **Notifications** → In-app always, email additionally for transfers.
3. **Wizard** → Shows on first sign-in until completed. Always restartable from Help page.
4. **Mock data** → Keep what helps onboarding, kill what blocks the user. If a page has a backend route, use real data; if not (eg. Help tour, sample challenge copy), keep the example. The rule: "Can the user *do* something real here?" If yes, no mock.
5. **Communities identity** → Communities = "a group of people where stuff is posted by admins". Discord/Slack-channel model. Distinct from Discover (browse) and from Builder Arena (marketplace for services).
6. **Duplicate community page** → Delete `/community` (the simpler one). Keep `/community/dashboard`.

---

## Real questions that remain

1. **Discover scope** — YC-style directory (browseable, filterable cards) or Product-Hunt-style (votable, ranked, comment threads)? My default: hybrid. Browse + filter + upvote + comment threads on detail page.
2. **Investor Portal vs Capital Partner vs Judge Portal** — The sidebar shows three overlapping surfaces. Are they meant for three distinct user types, or is it one portal with role-aware views? My default: **one `/capital` route** with role-aware tabs (Investor sees "Browse ventures", Partner sees "My commitments", Judge sees "Assigned challenges").
3. **DOT Demo vs Pitchathons** — Also overlapping. Same question. My default: merge into one `/demo` route with two tabs ("Active events" + "Pitchathons").
4. **Sessions vs Meetings** — Same. My default: merge into `/sessions` with two tabs (one-on-one + group).

If you don't answer these I'll pick the defaults and move.

---

## Phase 1 — Fix what's broken + add notifications + delete mocks (Week 1, 4 days)

### (1) Notifications system — DB + API + email + bell badge
- **(1.1)** Add `notifications` table: `id, userId, type, title, body, link, read, createdAt`. Migration `0009_notifications.sql`.
- **(1.2)** Create `/api/notifications` routes: `GET ?limit=20&cursor=` returns notifications + `unreadCount`. `POST /:id/read` and `POST /read-all`.
- **(1.3)** Wire notifications into existing flows:
  - `wallet.ts` POST `/transfer` → insert notif for both parties (email for recipient)
  - `marketplace.ts` POST `/jobs` + `/services` → notify followers of poster
  - `community.ts` POST `/join` → notify community leader
  - `community.ts` POST `/:id/posts` → notify all members
  - `auth.ts` POST `/signup` → welcome notification
- **(1.4)** Email helper: `src/lib/notify.ts` → `notify({userId, type, title, body, link, sendEmail})`. Default `sendEmail: false`. Set `true` only for `transfer_received`.
- **(1.5)** Replace `MOCK_NOTIFS` with real `useQuery`. Bell icon in AppShell shows unread count badge. Click → dropdown of last 5 + "See all" → `/notifications`.

### (2) Fix `/api/users/me/builder-profile` 500
- **(2.1)** Read schema, confirm `builder_profiles` column names. Switch from raw SQL `INSERT` to Drizzle `db.insert(builderProfiles).values(...).onConflictDoUpdate(...)`. Plus seed row if missing (UPSERT).

### (3) Fix community creation 404
- **(3.1)** Grep frontend for community create call. Fix wrong path to `POST /api/communities`.
- **(3.2)** Add error toast if backend rejects (insufficient DOT, name taken, etc).

### (4) Delete duplicate community page
- **(4.1)** Compare `community.tsx` vs `community/dashboard.tsx`. Keep `dashboard.tsx`. Delete `community.tsx`.
- **(4.2)** Update AppShell link to point to the kept one.

### (5) Make Communities feel like Discord/Slack
- **(5.1)** New schema: `communityChannels` table (channels within a community, like Discord). Each channel has `name, description, isAdminOnly, postCount, lastPostAt`.
- **(5.2)** New schema: `communityPosts` table (one post per row). `id, communityId, channelId, authorId, body, reactions (jsonb), replyCount, createdAt`.
- **(5.3)** New schema: `communityMembers` table (already there as `communityMembers`, expand to include `role: owner/admin/moderator/member`).
- **(5.4)** `/api/communities/:id/channels` GET · `/api/communities/:id/channels` POST (admin only) · `/api/communities/:id/posts?channelId=` GET · `/api/communities/:id/posts` POST · `/api/communities/:id/posts/:postId/replies` GET/POST.
- **(5.5)** Frontend: `/community/dashboard` becomes a Discord-style view — left rail = channel list, center = posts, right rail = member list. Each post has author + timestamp + body + reactions row + reply count. Empty state: "Be the first to post in #general".
- **(5.6)** Admin post indicator: posts from `admin` / `owner` role get a "📌 Pinned" or gold border.

### (6) Make Discover feel like YC + Product Hunt
- **(6.1)** New schema: `discoverUpvotes` table (`userId, ventureId, createdAt`).
- **(6.2)** Discover becomes filterable: All / Ventures / Builders / Events / Posts. Each card shows upvotes, comments count, founder avatar, one-line pitch, "Investor interest" badge if relevant.
- **(6.3)** Click a venture card → modal with full venture page (existing `/c.$id.tsx` already does this — make it prettier).
- **(6.4)** `/discover/communities` becomes the same view but filtered to communities. Distinct visual identity (Discover = green, Communities = gold).

### (7) Fix Builder Arena
- **(7.1)** Wire `Apply to gig` → `POST /api/marketplace/orders` with escrow.
- **(7.2)** Wire `Submit work` → `POST /api/marketplace/orders/:id/submit`.
- **(7.3)** Wire `Release escrow` (client confirms delivery) → `POST /api/marketplace/orders/:id/confirm`.
- **(7.4)** Show "My applications" tab with status (pending / submitted / accepted / paid).
- **(7.5)** Add empty states with copy explaining what Builder Arena is.

---

## Phase 2 — Build rich pages (Week 2, 4 days)

Each product surface gets **a page that feels like its own world**.

### (8) `/discover` (YC Directory + Product Hunt)
Reference: ycombinator.com/companies · producthunt.com
- **Hero**: search bar, "Discover what's being built on DOT"
- **Filters**: role (Builder/Founder/Investor/...), status (Building/Scaling/Funded), location, vibe (community/accelerator/independent)
- **Cards**: name, one-liner, avatar, location, "Upvote ▲ N", "Comments 💬 N", "Saved by N investors"
- **Detail page**: full venture, team list, traction, ask, similar ventures
- Empty state: "No ventures yet — be the first to post one"

### (9) `/community/$id` (Discord/Slack channel)
Reference: discord.com/channels · slack.com
- **Layout**: 3-column (channel list | posts | member list)
- **Channel list**: General · Announcements · Resources · Help · (private channels visible only to admins)
- **Posts**: author + role badge, timestamp, body (markdown rendered), reactions, reply count, "Reply" button
- **Member list**: grouped by role (Owners / Admins / Members), online indicator
- **Compose**: bottom input with formatting toolbar

### (10) `/work` (Upwork marketplace)
Reference: upwork.com · fiverr.com · toptal.com
- **Tabs**: Services · Jobs · My Activity
- **Service card**: thumbnail, title, vendor avatar, price (DOT), rating (stars), delivery time, "Hire me" CTA
- **Job card**: title, posted-by, budget DOT, applicants count, "Apply" CTA
- **Filters**: category, budget range, delivery time, vendor rating
- **My Activity**: open orders, in-progress, completed, paid
- Empty state: "Browse open jobs to get started"

### (11) `/c/$id` (Venture profile — full detail)
Reference: ycombinator.com/companies/$id · crunchbase.com
- **Hero**: name, tagline, founder avatar, "Save ▲" + "Share" buttons
- **Sections**: Overview · Team · Traction · Ask · Comments
- **Team tab**: founder + co-founders + advisors with LinkedIn-style cards
- **Traction tab**: MRR graph, user count graph, key milestones timeline
- **Ask tab**: round size, valuation, use of funds, deadline
- **Comments**: nested reply threads (Substack-style)

### (12) `/demo` (DOT Demo + Pitchathons merged)
Reference: producthunt.com/posts · techcrunch.com/events
- **Hero**: "Active events · live now" with countdown
- **Tabs**: Events · Pitchathons
- **Event card**: name, prize pool, judges, applicants, time-remaining, "Submit" CTA
- **Pitchathon card**: theme, prize, sponsor logos, leaderboard

### (13) `/capital` (Investor / Partner / Judge merged)
Reference: angellist.com · crunchbase.com/investors
- **Role-aware tabs**: Investor · Partner · Judge (only show relevant tab to user)
- **Investor tab**: Browse ventures · Saved · Activity feed
- **Partner tab**: My commitments · Open RFPs · Matched ventures
- **Judge tab**: Assigned challenges · Past decisions · Reputation

### (14) `/profile/$id` (LinkedIn-style profile)
Reference: linkedin.com/in/$id · about.me
- **Hero**: avatar, name, DOT ID, current role, location, "Save ▲" + "Connect" buttons
- **Tabs**: About · Ventures · Activity · Credentials · Endorsements
- **About**: bio, skills chips, "Available for hire" badge
- **Credentials**: list of issued certificates with verification links
- **Endorsements**: from other users, "Endorse" button

### (15) `/certificates` (real data + working download)
- **(15.1)** Add `certificates` table: `id, userId, courseId, title, issuer, score, dotEarned, level, credentialId (unique), issuedAt, createdAt`.
- **(15.2)** `GET /api/certificates/me`, `GET /api/certificates/:id`, `GET /api/certificates/:id/download` (PDF binary).
- **(15.3)** PDF generator: `@react-pdf/renderer` template with the user's name + course + score + credential ID + QR code linking to public verify URL.
- **(15.4)** Frontend: real data via `useQuery`. "View" opens modal with QR. "Download" hits the PDF endpoint.
- **(15.5)** Same treatment for `/profile/$id` credentials section.

---

## Phase 3 — Onboarding wizard + final polish (Week 3, 3 days)

### (16) Onboarding wizard (first sign-in + reusable)
- **(16.1)** Add `wizardCompletedAt` to `users`. Migration `0010_wizard.sql`.
- **(16.2)** New route `/wizard` with full-screen overlay. 7 steps:
  1. Welcome · what DOT is
  2. Complete your profile · set avatar, name, bio
  3. Get your first DOT · start with 500 DOT free
  4. Take Vantage · 20 questions, 2 minutes
  5. Discover · find builders, ventures, communities
  6. Join a community · find your people
  7. Post or apply · your first gig
- **(16.3)** Trigger: show on first sign-in (`wizardCompletedAt === null`). Each step has "Next" / "Skip tour". On complete, persist timestamp + redirect to /dashboard.
- **(16.4)** Restart from Help → "Take the tour again". Resets `wizardCompletedAt = null`.

### (17) Polish + consistency pass
- **(17.1)** Empty states everywhere with copy that explains what the page is for (Y Combinator-style "What's this?" sections).
- **(17.2)** Loading skeletons on every useQuery. Error toasts on every failure.
- **(17.3)** Mobile responsive — every page tested at 375px viewport.
- **(17.4)** Keyboard shortcuts: `Cmd+K` command palette (open wallet, jump to profile, take Vantage).
- **(17.5)** Onboarding banners — "You haven't taken Vantage yet" · "Your builder profile is empty" · "You haven't joined a community" — each links to the relevant wizard step.

---

## Files likely to change (high-level)

**New backend routes:**
- `src/routes/notifications.ts`
- `src/routes/certificates.ts`
- `src/routes/community-channels.ts`
- `src/routes/community-posts.ts`
- `src/routes/discover.ts`
- `src/lib/notify.ts`
- `src/lib/pdf.ts`

**New migrations:**
- `0009_notifications.sql`
- `0010_wizard.sql`
- `0011_certificates.sql`
- `0012_community_channels.sql`
- `0013_community_posts.sql`
- `0014_discover_upvotes.sql`

**New frontend routes/components:**
- `src/routes/_authenticated/wizard.tsx`
- `src/routes/_authenticated/work/post-job.tsx`
- `src/routes/_authenticated/work/post-service.tsx`
- `src/routes/_authenticated/community/$id/index.tsx` (Discord-style view)
- `src/components/app/WizardOverlay.tsx`
- `src/components/app/NotificationBell.tsx`
- `src/components/app/CommandPalette.tsx`

**Modified frontend files:**
- All 12 product pages (Discover, Communities, Work, Builder Arena, Demo, Capital, Profile, Certificates, etc.)

---

## Risks

- **Email volume** — Resend free tier = 100 emails/day. Default to in-app; email only transfers. Upgrade Resend before launch.
- **PDF size** — `@react-pdf/renderer` produces 50-200KB PDFs. Use signed Cloudinary URLs for hosting instead of generating on-demand.
- **Discover with empty state** — page looks bare at launch. Add 5-10 "Featured ventures" seeded by admin so it doesn't look empty.
- **Community posts schema** — reactions are stored as JSONB. Postgres handles this fine; just need to add a GIN index for `reactions` if we want fast "who reacted" queries.

---

## Execution Mode

**Checkpoint after Phase 1** (4 days in). I'll demo notifications + the new community posts view + the bug fixes. You approve before Phase 2.

**Phase 2 is the bulk of the work** — that's where the "feels like its own world" pages get built. If you want to scope this down, **Phase 1 is non-negotiable** (notifications + bug fixes). Phase 2 pages can be prioritized — Communities and Work are most user-visible, so I'd do those first.

---

## Time estimate

- Phase 1: 4 days
- Phase 2: 4 days (this is where the 12 product surfaces get rich content — main effort)
- Phase 3: 3 days

**Total: 11 days.** Aggressive given how much rich content is needed for Phase 2. With surprises: **2-3 weeks**. If you want to hit your "less than a day" bar, we need to drop some product surfaces to "good enough" rather than "rich".

---

## Resolved Decisions (my defaults)

1. **Discover** → Hybrid YC + Product Hunt. Browse + filter + upvote + comments.
2. **Investor/Partner/Judge** → Single `/capital` route with role-aware tabs.
3. **Demo/Pitchathons** → Single `/demo` route with two tabs.
4. **Sessions/Meetings** → Single `/sessions` route with two tabs.
5. **Mock data on shipped pages** → Kill (use real DB or hide section).
6. **Wizard** → 7 steps, modal overlay on first sign-in, restartable from Help.

Override any of these and I'll adjust. Otherwise I'll start coding Phase 1.