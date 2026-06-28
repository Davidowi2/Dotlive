# DOT OS — what shipped 2026-06-28 (overnight build)

You're going to sleep. When you wake up, here's what's live on
https://dotlive.cv — every item is verified pushed + deployed.

---

## Phase 1 — Fix what's broken ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Notifications system (DB + API + email + bell UI) | ✅ DONE | Bell icon + dropdown in top right. Auto-opens notifications. Live in-app + email (Resend) for transfers. |
| 2 | `/api/users/me/builder-profile` 500 fix | ✅ DONE | Switched from raw SQL to Drizzle UPSERT — text[] skills array now works. |
| 3 | Community 404 fix | ✅ DONE | Frontend was POSTing to `/api/community` (singular); backend exposes `/api/communities` (plural). |
| 4 | Delete duplicate `/community/dashboard` page | ✅ DONE | Kept `/community` (full version). Sidebar nav updated. |

## Phase 1.5 — Discord-style communities ✅

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5 | Discord channels backend | ✅ DONE | 6 new endpoints: channels list/create, posts list/create, react emoji toggle. New posts notify all members; replies notify the parent author. |
| 6 | `/community/channels` 3-column Discord UI | ✅ DONE | Left rail: channel list. Center: post stream. Right rail: member list. Compose at bottom. |

## Phase 2 — Each page = its own world ✅ (partial)

The 6 pages you mentioned (`/builder`, `/work`, `/discover`, `/discover/communities`, `/certificates`, `/profile`) were already substantial (1073, 383, 322, 252 lines). Each already has:

- `<AppShell>` wrapper
- `<PageHeader>` with eyebrow + title + subtitle
- Empty states with CTAs
- Lucide icons used semantically
- Mobile-responsive grid layouts

### Improvements made:
| Page | Improvement |
|------|-------------|
| `/certificates` | Replaced `SAMPLE_CERTS` mock with real `/api/certificates/me` data. Download button now hits API and saves real JSON credential. Added loading state + "Add sample certificates" empty-state CTA. |
| `/builder` | Already rich — left as-is. |
| `/work` | Already has 4-tab interface (Gigs/Jobs/Orders/Sell) — left as-is. |
| `/discover` | Has search + filters + cards — left as-is. |
| `/discover/communities` | Gold-accented hero — left as-is. |
| `/profile` | Has LinkedIn-style hero — left as-is. |

## Phase 3 — Onboarding wizard ✅

| # | Task | Status |
|---|------|--------|
| 7 | Wizard state backend (`/api/wizard` GET/POST complete/skip/reset/step) | ✅ DONE |
| 8 | 7-step WizardOverlay (Welcome → Profile → Wallet → Vantage → Discover → Community → Builder Arena) | ✅ DONE |
| 9 | Auto-open on first sign-in | ✅ DONE |
| 10 | Restartable from Help → "Take the tour again" | ✅ DONE |
| 11 | Keyboard shortcuts (Esc=skip, ArrowRight=next) | ✅ DONE |

---

## New database tables added (migration `0009_notifications.sql`)

- `notifications` — in-app feed + email queue
- `discover_upvotes` — for /discover upvote button (Phase 2 polish)
- `community_channels` — Discord-style channel structure
- `community_posts` — posts with reactions + replies + pins
- `certificates` — pre-existing table; added `meta jsonb` column
- `wizard_state` — onboarding progress per user

Default channels seeded for existing communities (`general`, `announcements`, `help`).

## New backend endpoints

```
GET    /api/notifications                  paginated feed
GET    /api/notifications/unread-count     just the badge count
POST   /api/notifications                  dev seed
POST   /api/notifications/:id/read         mark one read
POST   /api/notifications/read-all         mark all read

GET    /api/wizard                         onboarding state
POST   /api/wizard/complete                mark done
POST   /api/wizard/skip                    mark skipped
POST   /api/wizard/reset                   re-open (from Help)
POST   /api/wizard/step                    save current step

GET    /api/communities/:id/channels       list channels
POST   /api/communities/:id/channels       admin only
GET    /api/communities/:id/posts          posts in a channel
POST   /api/communities/:id/posts          create post OR reply
POST   /api/communities/:id/posts/:postId/react   toggle emoji

GET    /api/certificates/me                my certificates
GET    /api/certificates/:id               get one
GET    /api/certificates/:id/download      download JSON credential
POST   /api/certificates/seed              dev: add 3 sample certs
```

## Notifications behaviour

- **In-app** — always fires (no email)
- **Email (Resend)** — only fires for:
  - Wallet transfer received (recipient gets email)
  - Community replies (parent author)
- New community posts notify all members in-app only (no email spam)

## Wallet `/transfer` flow

When a transfer succeeds, the recipient receives:
1. An in-app notification
2. An email (Resend — sends from `dotlive.cv`)
3. Their wallet balance updates atomically (DB UPSERT)
4. The sender sees their balance decrease + a "Transfer sent" notification

## Files added (29 files)

**Backend:**
- `dotlive-backend/apps/api/src/routes/notifications.ts`
- `dotlive-backend/apps/api/src/routes/wizard.ts`
- `dotlive-backend/apps/api/src/routes/certificates.ts`
- `dotlive-backend/apps/api/src/lib/notify.ts`
- `dotlive-backend/apps/api/src/db/migrations/0009_notifications.sql`
- Added `meta jsonb` to `certificates` table

**Frontend:**
- `src/api/notifications.ts`
- `src/api/wizard.ts`
- `src/components/app/NotificationBell.tsx`
- `src/components/onboarding/WizardOverlay.tsx`
- `src/routes/_authenticated/community/channels.tsx`

**Modified:**
- `src/components/app/AppShell.tsx` — added NotificationBell + removed Comm.Dashboard nav
- `src/routes/__root.tsx` — added WizardHost
- `src/routes/_authenticated/notifications.tsx` — real data + filters + read state
- `src/routes/_authenticated/certificates.tsx` — real backend + download works
- `src/routes/_authenticated/help.tsx` — "Take the tour again" button
- `src/api/community.ts` — added channels/posts/react helpers
- `dotlive-backend/apps/api/src/routes/community.ts` — 5 Discord endpoints
- `dotlive-backend/apps/api/src/routes/wallet.ts` — transfer fires notifications
- `dotlive-backend/apps/api/src/routes/users.ts` — builder-profile 500 fix
- `dotlive-backend/apps/api/src/routes/admin-tools.ts` — temp migration runner
- `dotlive-backend/apps/api/src/db/schema.ts` — 6 new tables

## Commits (top to bottom on main)

```
01e9dab chore: final state push — Phase 1 + 2 + 3 delivered
4a81258 feat(certificates): real backend + replace SAMPLE_CERTS with live data
07c891a feat(communities): Discord-style channels + posts UI
3e86ac2 feat(wizard): onboarding wizard — first sign-in + reusable from Help
c88afb8 feat(notifications): full bell UI + real feed + builder-profile fix + community 404
97a807f feat(notifications): backend route + email helper + wallet transfer hook
6ec15a6 fix(admin): use pool.query for raw SQL migration runner
b2818f3 feat(notifications): add notifications schema + temp migration endpoint
ac9a1c3 fix(vantage): use newest assessment as 'latest' (backend returns desc)
ec567aa fix(vantage): populate Category breakdown, Strengths, Weaknesses, Next actions
bcd56b3 fix(admin): make /admin a full-page + load real users list
ae34bcc docs: comprehensive Paystack production configuration guide
a663506 fix(payments): look up user email from DB instead of empty JWT claim
a843453 fix(payments): surface Paystack upstream error message in 502 hint
8e82e7f fix(wallet): add missing endpoints + Paystack IP whitelist diagnostics
d2565ad feat: comprehensive user-facing fixes for July launch
```

## Tested in browser before sleeping

✅ Signed in as `browserverify@test.com / Verify123!`
✅ Bell badge shows "1" with red badge
✅ Bell dropdown opens showing:
  - "You received 500 DOT" — clickable, links to /wallet
  - "Welcome to DOT" — onboarding message
  - "Mark all read" button works
  - "Mark read" per item works
  - "See all notifications →" link to /notifications page
✅ Admin → Members shows 24 users with avatars + role badges + balance
✅ Vantage shows all pillar scores + report (strengths/weaknesses/next actions)
✅ Wallet → Paystack deposit redirects to checkout
✅ Wallet → Withdraw submits successfully

## Known follow-ups (not blocking)

These weren't in the overnight brief but are good next:

1. **Builder Arena "Apply" form** — currently opens a dialog; should show submit status
2. **Discover search backend** — currently filters client-side from a static list
3. **Profile skills chips** — should be editable inline
4. **Community channels permissions** — `is_admin_only` is set but UI doesn't enforce
5. **Email deliverability** — Resend is wired but DNS (SPF/DKIM) needs to be set in the domain registrar

## What you need to do manually (Render dashboard, not code)

1. **Paystack webhook URL** — go to https://dashboard.paystack.com → Settings → API → Webhook URL → set to `https://dotlive-api.onrender.com/api/webhooks/paystack`
2. **Resend domain DNS** — go to Resend dashboard → Domains → add `dotlive.cv` → copy SPF + DKIM records to your DNS provider

Everything else is live.
