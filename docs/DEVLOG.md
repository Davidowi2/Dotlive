# DOT Platform — Dev Log & Architecture Reference

> Last updated: June 2026
> Author: Built with Kiro AI
> Live URL: https://dotlive-lake.vercel.app
> API URL: https://dotlive-api.onrender.com
> GitHub: https://github.com/Davidowi2/Dotlive

---

## What is DOT?

DOT is Africa's Venture Progression Network. It helps African founders move from idea to funded through a structured, measurable journey. The platform combines:

- **Vantage** — venture intelligence scoring (0-1000)
- **DOT Academy** — founder education with DOT token rewards
- **DOT Work** — marketplace for gigs (services) and jobs
- **Pitchathons** — pitch competitions with judge scoring
- **DOT Demo** — capital discovery / investor marketplace
- **Community OS** — referral-based community growth

**Core concept:** Every user starts as a Builder with 500 DOT. They earn more DOT through work and learning, then spend DOT to upgrade roles (Founder costs 2,000 DOT, Investor costs 10,000 DOT, etc.)

---

## Repository Structure

```
Dotlive/  (GitHub repo: Davidowi2/Dotlive)
├── src/                          ← Lovable/TanStack Start frontend
│   ├── routes/                   ← All pages (file-based routing)
│   ├── components/
│   │   ├── app/                  ← Authenticated app components
│   │   ├── site/                 ← Marketing/public components
│   │   └── ui/                   ← shadcn/ui primitives
│   ├── contexts/
│   │   └── DotAuthContext.tsx    ← NEW auth context (Fastify JWT)
│   ├── hooks/
│   │   ├── use-auth.tsx          ← OLD Supabase auth (kept for non-migrated pages)
│   │   └── use-dot-data.ts       ← OLD Supabase data hooks (kept)
│   ├── api/                      ← NEW Fastify API client modules
│   │   ├── client.ts             ← fetch wrapper, JWT handling
│   │   ├── auth.ts               ← signup, login, logout, getMe
│   │   ├── wallet.ts             ← balance, transactions, transfer
│   │   ├── ventures.ts           ← venture CRUD
│   │   ├── users.ts              ← profile, roles, upgrades
│   │   ├── vantage.ts            ← assessment submit/history
│   │   ├── marketplace.ts        ← services, jobs, orders
│   │   ├── academy.ts            ← courses, enrollments
│   │   ├── community.ts          ← community CRUD
│   │   ├── pitchathons.ts        ← pitchathon apply/leaderboard
│   │   ├── upload.ts             ← Cloudinary upload via backend
│   │   └── admin.ts              ← admin user/balance/ban
│   ├── types/
│   │   └── api.ts                ← Shared TypeScript types
│   ├── integrations/
│   │   └── supabase/             ← Supabase client (legacy, partial)
│   ├── styles.css                ← Design system (Tailwind + CSS vars)
│   └── start.ts                  ← TanStack Start server entry
│
├── dotlive-backend/              ← Fastify API (copy for GitHub)
│   └── apps/api/src/
│       ├── server.ts             ← Fastify entry point
│       ├── db/
│       │   ├── schema.ts         ← Drizzle ORM schema (31 tables)
│       │   ├── client.ts         ← Neon connection
│       │   └── migrations/       ← SQL migration files
│       ├── lib/
│       │   ├── auth.ts           ← Lucia + Argon2, createUser
│       │   ├── dot.ts            ← Wallet credit/debit/transfer (atomic)
│       │   ├── admin.ts          ← Admin primitives
│       │   └── cloudinary.ts     ← Upload helpers
│       └── routes/               ← 14 Fastify route files
│
├── supabase/migrations/          ← Supabase migration SQL files
├── docs/                         ← This folder
│   ├── DEVLOG.md                 ← You are here
│   └── UPTIMEROBOT.md            ← Monitoring setup
└── vercel.json                   ← Vercel deployment config
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React SSR) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| UI | shadcn/ui (Radix primitives) |
| State | TanStack Query (server state) + React state |
| Auth | DotAuthContext → Fastify JWT (localStorage `dot_jwt`) |
| Fonts | Fraunces (serif display) + Inter (sans body) |
| Build | Vite + Nitro (Vercel preset) |
| Deploy | Vercel — `.vercel/output` pre-built and committed |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Framework | Fastify 4 |
| Database | Neon (Postgres serverless) |
| ORM | Drizzle ORM |
| Auth | Lucia v3 (sessions) + @fastify/jwt (stateless) |
| Passwords | Argon2id |
| Storage | Cloudinary (images + documents) |
| Payments | Paystack (Naira → DOT) |
| Deploy | Render.com (Singapore region) |

### Database
| Service | Neon (serverless Postgres) |
|---------|---------------------------|
| Region | ap-southeast-2 (Singapore) |
| Pooler | `ep-dry-star-a7g87iyp-pooler` |
| Schema managed by | Drizzle ORM |

---

## Database Schema (31 tables)

All tables in Drizzle ORM schema at `dotlive-backend/apps/api/src/db/schema.ts`.

### Core user tables
| Table | Purpose |
|-------|---------|
| `users` | Core accounts — email, password_hash, dot_id, name, avatar_url |
| `sessions` | Lucia session store — id, user_id, expires_at |
| `oauth_accounts` | Google OAuth links — provider_id, provider_user_id |
| `user_roles` | Multi-role assignments — user_id, role (builder/founder/etc.) |
| `user_bans` | Soft bans — reason, expires_at, revoked_at |

### Wallet tables
| Table | Purpose |
|-------|---------|
| `wallets` | DOT balance per user — user_id, balance (numeric 20,2) |
| `transactions` | Immutable ledger — user_id, amount, type, description |
| `payments` | Paystack payment records — reference, dot_amount, naira_amount, status |

### Role upgrade
| Table | Purpose |
|-------|---------|
| `role_requirements` | Upgrade costs — role, dot_cost, required_fields, is_active |

**Role costs (seed with `npm run db:seed`):**
- founder: 2,000 DOT
- investor: 10,000 DOT
- community_leader: 1,000 DOT
- vendor: 5,000 DOT
- capital_partner: 50,000 DOT

### Platform tables
| Table | Purpose |
|-------|---------|
| `ventures` | Founder ventures — name, industry, stage, country, vantage_point, fundability |
| `assessments` | Vantage assessments — answers, scores, report (JSON) |
| `courses` | Academy courses — title, whop_url, dot_reward, vantage_boost |
| `course_enrollments` | User → course — status, completed_at, rewarded_at |
| `events` | Sessions/events — title, speaker, event_date, dot_cost |
| `event_registrations` | User → event |
| `pitchathons` | Pitch competitions — title, prize, start_date, end_date, status |
| `pitchathon_applications` | Founder → pitchathon — venture_name, pitch_deck_url, funding_ask |
| `communities` | Leader communities — name, leader_id, referral_code |
| `community_members` | Founder → community — status, joined_at |

### Marketplace tables
| Table | Purpose |
|-------|---------|
| `services` | Gig listings — builder_id, title, price_dot, delivery_days |
| `job_listings` | Job postings — venture_id, salary_dot, employment_type |
| `service_orders` | Gig orders — client_id, builder_id, amount_dot, status |
| `service_reviews` | Order reviews — rating (1-5), comment |
| `investor_saves` | Investor bookmarks founders |
| `meeting_requests` | Investor → founder meeting requests |

### Admin tables
| Table | Purpose |
|-------|---------|
| `admin_audit_log` | Append-only admin action log — actor, action, before/after |
| `admin_confirm_tokens` | 5-min single-use tokens for destructive actions |
| `admin_impersonation_tokens` | Admin impersonation (schema exists, routes not yet built) |
| `admin_idempotency_keys` | Idempotency cache for admin writes (24h TTL) |
| `feature_flags` | Key/value feature flags with rollout % |
| `payments_audit` | Webhook event log before wallet credit |
| `password_resets` | 1-hour reset tokens — user_id, token, expires_at, used_at |

---

## Auth Architecture

### Two auth systems (migration in progress)

**OLD (Supabase) — used by:**
- `hooks/use-auth.tsx`
- `hooks/use-dot-data.ts`
- Pages not yet migrated: onboarding, sessions, meetings, investor, demo, join.$code

**NEW (Fastify JWT) — used by:**
- `contexts/DotAuthContext.tsx`
- All migrated pages (see Migration Status section)

### JWT flow
1. User signs up/logs in → `POST /api/auth/signup` or `/login`
2. Backend creates Lucia session + mints JWT → `{ token, user }`
3. Frontend stores JWT in `localStorage` under key `dot_jwt`
4. Every API request → `Authorization: Bearer <token>` header
5. 401 response → `clearToken()` + redirect to `/auth`
6. Auth guard (`route.tsx`) reads `getToken()` — redirects if null

### Google OAuth flow
1. Click "Continue with Google" → `window.location.href = getGoogleAuthUrl()`
2. Backend `GET /api/auth/google` → sets `oauth_state` cookie → redirects to Google
3. Google redirects to `GET /api/auth/google/callback`
4. Backend validates state cookie (CSRF protection), exchanges code for tokens
5. Creates/upserts user → mints JWT → redirects to `{FRONTEND_URL}/auth/callback?token=xxx`
6. `src/routes/auth.callback.tsx` reads `?token`, calls `setToken()`, redirects to `/dashboard` or `/onboarding`

### Starter grant
Every new user gets **500 DOT** automatically on signup via `createUser()` in `lib/auth.ts`. It logs to console if the grant fails (admin can top up manually).

---

## DOT Token Economy

- **1 DOT = ₦15** (configurable via `DOT_RATE_NGN` in constants)
- Stored as `numeric(20,2)` in Postgres — no floating point issues
- All wallet operations are **atomic** (wrapped in `db.transaction()`)
- Rate limiting: 10s cooldown between debits, 100k DOT daily cap
- Transaction types: `Starter Grant`, `Transfer`, `Spend`, `Reward`, `Role Upgrade`, `Deposit`, `Admin Adjustment`

### Wallet functions (all in `dotlive-backend/apps/api/src/lib/dot.ts`)
- `creditWallet(opts, tx?)` — credits wallet, idempotent via reference
- `debitWallet(opts, tx?)` — atomic debit (fails if balance < amount)
- `transferDot(opts)` — atomic transfer wrapped in `db.transaction()`

---

## API Endpoints Reference

Base URL: `https://dotlive-api.onrender.com`

### Auth
```
POST /api/auth/signup              → { token, user }
POST /api/auth/login               → { token, user }
POST /api/auth/logout              ← requires auth
GET  /api/auth/me                  ← requires auth → { user }
GET  /api/auth/google              → 302 to Google
GET  /api/auth/google/callback     → 302 to frontend/auth/callback?token=
POST /api/auth/forgot-password     → { success: true }
POST /api/auth/reset-password      → { success: true }
```

### Wallet
```
GET  /api/wallet                   ← auth → { balance }
GET  /api/wallet/transactions      ← auth → { transactions }
POST /api/wallet/transfer          ← auth → { fromBalance, toBalance }
```

### Ventures
```
POST  /api/ventures                ← auth → { venture }
GET   /api/ventures                → { ventures }
GET   /api/ventures/:id            → { venture }
PATCH /api/ventures/:id            ← auth (owner) → { venture }
```

### Marketplace
```
GET  /api/services                 → { services }
POST /api/services                 ← auth (builder) → { service }
GET  /api/jobs                     → { jobs }
POST /api/jobs                     ← auth (founder) → { job }
POST /api/orders                   ← auth → { order }
PATCH /api/orders/:id/deliver      ← auth (builder)
PATCH /api/orders/:id/complete     ← auth (client)
PATCH /api/orders/:id/cancel       ← auth (client)
```

### Academy / Vantage / Pitchathons
```
GET  /api/academy/courses          → { courses }
GET  /api/academy/enrollments      ← auth → { enrollments }
POST /api/academy/enroll/:id       ← auth
POST /api/academy/complete/:id     ← auth → { dotEarned }
POST /api/vantage/submit           ← auth → { assessment }
GET  /api/vantage/history          ← auth → { assessments }
GET  /api/pitchathons              → { pitchathons }
POST /api/pitchathons/:id/apply    ← auth (founder)
GET  /api/pitchathons/:id/leaderboard → { leaderboard }
```

### Admin (requires admin/super_admin role)
```
GET  /api/admin/users              ← admin (search, filter, paginate)
GET  /api/admin/users/:id          ← admin
POST /api/admin/users/:id/ban      ← super_admin (requires confirm token)
POST /api/admin/users/:id/unban    ← super_admin
POST /api/admin/users/:id/adjust-balance ← super_admin
POST /api/admin/confirm            ← admin → { token } (5-min single-use)
GET  /api/stats                    → { users, ventures, dotInCirculation }
GET  /api/health                   → { ok: true }
```
