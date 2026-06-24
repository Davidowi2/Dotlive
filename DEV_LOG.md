# DOT Project Dev Log

> Comprehensive documentation for the DOT platform to remember everything when coming back after time away.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Key Features](#key-features)
6. [Integrations](#integrations)
7. [API Endpoints](#api-endpoints)
8. [Frontend Routes](#frontend-routes)
9. [Environment Variables](#environment-variables)
10. [Deployment](#deployment)

---

## Project Overview

DOT is a platform for founders, investors, builders, and community leaders to connect, learn, pitch, and transact using the DOT token.

**Core Roles:**
- `builder`: Creates services for the marketplace
- `founder`: Builds ventures, joins pitchathons
- `investor`: Discovers and connects with founders
- `community_leader`: Manages communities
- `admin`/`super_admin`: Platform administration
- `vendor`: Vendors on the platform
- `capital_partner`: Capital partners

---

## Tech Stack

### Frontend
- **Framework**: React 19 + TanStack Start (full-stack React framework)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI primitives
- **Routing**: TanStack React Router
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form + Zod
- **Type Safety**: TypeScript 5

### Backend (Legacy/Fallback)
- **Framework**: Fastify (in `dotlive-backend/` and `dotlive-monorepo/`)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL

### Database & Auth
- **Primary Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (with @lovable.dev/cloud-auth-js)
- **Database Types**: Generated Supabase types

### Payments & Integrations
- **Payments**: Paystack (Naira)
- **Courses/Events**: Whop
- **File Uploads**: (Implied, likely Supabase Storage or Cloudinary)

### Deployment
- **Hosting**: Vercel (Nitro preset)
- **Build Tool**: Vite

---

## Project Structure

```
dotlive-main/
├── .lovable/                    # Lovable.dev project config
├── .vercel/                     # Vercel deployment config
├── dotlive-backend/             # Legacy Fastify backend (monorepo)
│   ├── apps/api/
│   │   ├── src/
│   │   │   ├── db/              # Drizzle schema, migrations, client
│   │   │   ├── lib/             # Business logic
│   │   │   ├── routes/          # API routes
│   │   │   └── server.ts
│   └── packages/shared/         # Shared types
├── dotlive-monorepo/            # Another legacy backend variant
├── dotlive-main-tracked/        # Tracked version snapshot
├── src/
│   ├── api/                     # Frontend API clients
│   ├── components/
│   │   ├── app/                 # App-specific components
│   │   ├── site/                # Site-wide components
│   │   ├── theme/               # Theme toggle
│   │   └── ui/                  # shadcn/ui components
│   ├── contexts/                # React contexts (DotAuthContext)
│   ├── hooks/                   # Custom hooks (use-auth, use-dot-data, etc.)
│   ├── integrations/
│   │   └── supabase/            # Supabase client & types
│   ├── lib/                     # Utilities, constants, paystack, etc.
│   ├── routes/                  # TanStack Router routes
│   │   ├── _authenticated/      # Protected routes
│   │   └── api/                 # API routes (server)
│   ├── types/                   # TypeScript types
│   ├── router.tsx               # Router config
│   ├── server.ts                # Server entry
│   └── start.ts                 # Start entry
├── .env.example                 # Example env vars
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Database Schema

### Core Tables

#### `users`
- `id`: Primary key (text)
- `email`: Unique email
- `email_verified`: Boolean
- `password_hash`: (Nullable, for email/password auth)
- `name`: User's name
- `avatar_url`: Profile picture
- `dot_id`: Unique DOT ID
- `onboarding_intent`: (Nullable)
- `invited_by`: (Nullable)
- `onboarded_at`: (Nullable, timestamp with timezone)
- `created_at`, `updated_at`: Timestamps

#### `user_roles`
- Composite primary key: (`user_id`, `role`)
- `role`: Enum (`builder`, `founder`, `investor`, `community_leader`, `admin`, `super_admin`, `vendor`, `capital_partner`)
- `granted_at`: Timestamp

#### `wallets`
- `user_id`: Primary key (references users)
- `balance`: Numeric (DOT token balance)
- `created_at`, `updated_at`: Timestamps

#### `transactions`
- `id`: UUID primary key
- `user_id`: References users
- `amount`: Numeric
- `type`: Text (transaction type)
- `description`: (Nullable)
- `created_at`: Timestamp
- Index: (`user_id`, `created_at`)

#### `ventures`
- `id`: UUID primary key
- `user_id`: References users
- `name`: Venture name
- `industry`: (Nullable)
- `stage`: Text (default: "Assess")
- `country`: (Nullable)
- `description`: (Nullable)
- `website`: (Nullable)
- `funding_goal`: Numeric
- `logo_url`: (Nullable)
- `vantage_point`: Integer
- `fundability`: Integer
- `investment_readiness`: Integer
- `created_at`, `updated_at`: Timestamps
- Index: (`user_id`)

#### `assessments`
- `id`: UUID primary key
- `user_id`: References users
- `answers`: JSONB
- `category_scores`: JSONB
- `score`: Integer
- `vantage_point`: Integer
- `fundability`: Integer
- `investment_readiness`: Integer
- `stage`: (Nullable)
- `report`: JSONB (Nullable)
- `created_at`: Timestamp
- Index: (`user_id`, `created_at`)

#### `courses` & `course_enrollments`
- `courses`: Course details (title, description, whop_url, dot_reward, vantage_boost, is_published)
- `course_enrollments`: User enrollments (course_id, user_id, status, completed_at, rewarded_at)

#### `events` & `event_registrations`
- `events`: Event details (title, description, speaker, event_date, dot_cost, capacity, whop_url)
- `event_registrations`: User registrations (event_id, user_id, attended)

#### `pitchathons` & `pitchathon_applications`
- `pitchathons`: Pitchathon details (title, description, prize, start_date, end_date, status)
- `pitchathon_applications`: Applications (pitchathon_id, founder_id, venture_name, pitch_deck_url, funding_ask, status)

#### `communities` & `community_members`
- `communities`: Community details (name, description, leader_id, region, category, referral_code)
- `community_members`: Members (community_id, founder_id, status, joined_at)

#### `services` & `service_orders` & `service_reviews`
- `services`: Services by builders (builder_id, title, description, category, price_dot, delivery_days, is_active)
- `service_orders`: Orders (service_id, client_id, builder_id, amount_dot, title, requirements, delivery_note, status, completed_at)
- `service_reviews`: Reviews (order_id unique, service_id, builder_id, client_id, rating 1-5, comment)

#### `job_listings`
- Venture job listings

#### `investor_saves` & `meeting_requests`
- `investor_saves`: Investors saving founders
- `meeting_requests`: Meeting requests between investors & founders

#### `role_requirements`
- Role cost & requirements for upgrading roles

#### `payments`
- Payment records (user_id, reference unique, dot_amount, naira_amount, status, paid_at, credited_at)

#### `payments_audit`
- Payment webhook audit log (provider, event_id unique, event_type, user_id, amount_minor, currency, raw_payload, status)

### Admin Tables
- `admin_audit_log`: Admin action audit trail
- `admin_confirm_tokens`: Confirmation tokens for destructive actions
- `admin_impersonation_tokens`: User impersonation tokens
- `admin_idempotency_keys`: Idempotency keys
- `feature_flags`: Feature flag management
- `user_bans`: User ban records

### Database Functions (Supabase)
- `admin_adjust_wallet`
- `bootstrap_super_admin`
- `cancel_service_order`
- `claim_course_reward`
- `complete_service_order`
- `create_service_order`
- `credit_paystack_payment`
- `deliver_service_order`
- `deposit_dot`
- `elevate_user_to_admin`
- `find_community_by_referral_code`
- `generate_dot_id`
- `get_builder_stats`
- `get_my_referral_code`
- `get_pitchathon_leaderboard`
- `has_role`
- `lookup_dot_id`
- `review_service_order`
- `revoke_admin_role`
- `reward_dot`
- `spend_dot`
- `transfer_dot`

---

## Key Features

1. **User Authentication & Onboarding**
   - Email/password & OAuth (Google)
   - Role-based onboarding
   - Invite system

2. **Wallet & Transactions**
   - DOT token wallet
   - Transaction history
   - Paystack integration for buying DOT
   - DOT transfers between users

3. **Venture Assessment**
   - Assessment quiz
   - Vantage Point score
   - Fundability & Investment Readiness scores
   - Stage progression

4. **Academy**
   - Courses via Whop
   - DOT rewards for completion
   - Vantage Point boosts

5. **Pitchathons**
   - Pitchathon listings
   - Applications with pitch decks
   - Judging system
   - Leaderboards

6. **Community**
   - Community creation & management
   - Referral codes
   - Member management

7. **Marketplace**
   - Builder services
   - Service ordering & delivery
   - Reviews & ratings

8. **Investor Tools**
   - Founder discovery
   - Save founders
   - Meeting requests

9. **Admin Dashboard**
   - User management
   - Wallet adjustments
   - Feature flags
   - Audit logs
   - User impersonation

---

## Integrations

### Supabase
- **Auth**: User authentication
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: (Implied, likely for uploads)
- **Functions**: (Implied, server-side logic)
- **Types**: Generated types in `src/integrations/supabase/types.ts`

### Paystack
- Payment processing for buying DOT
- Webhook handling in `src/routes/api/public/webhooks/paystack.ts`
- Integration logic in `src/lib/paystack.functions.ts`

### Whop
- Course & event fulfillment
- Integration code in legacy backend

### Lovable.dev
- Project scaffolding
- Auth integration via `@lovable.dev/cloud-auth-js`
- Vite config via `@lovable.dev/vite-tanstack-config`

---

## API Endpoints

### Frontend API Clients (src/api/)
- `admin.ts`
- `auth.ts`
- `client.ts`
- `community.ts`
- `academy.ts`
- `marketplace.ts`
- `ventures.ts`
- `users.ts`
- `wallet.ts`
- `vantage.ts`
- `pitchathons.ts`
- `upload.ts`

### Server API Routes (src/routes/api/)
- `public/webhooks/paystack.ts`: Paystack webhook handler

---

## Frontend Routes

### Public Routes
- `/`: Landing page
- `/auth`: Login/signup
- `/auth/callback`: Auth callback
- `/reset-password`: Password reset
- `/about`: About page
- `/platform`: Platform overview
- `/journey`: User journey
- `/investors`: Investor info
- `/communities`: Communities info
- `/help`: Help page
- `/founder/[id]`: Public founder profile
- `/join/[code]`: Community join via referral code

### Protected Routes (_authenticated/)
- `/dashboard`: User dashboard
- `/profile`: User profile
- `/settings`: Settings
- `/wallet`: Wallet & transactions
- `/vantage`: Vantage Point & assessments
- `/academy`: Courses
- `/pitchathons`: Pitchathons
- `/community`: Community
- `/work`: Marketplace (services/jobs)
- `/discover`: Discover founders (investor)
- `/investor`: Investor dashboard
- `/judge`: Judge dashboard
- `/meetings`: Meetings
- `/sessions`: Events/sessions
- `/certificates`: Certificates
- `/notifications`: Notifications
- `/admin`: Admin dashboard
- `/demo`: Demo page
- `/onboarding`: Onboarding flow

---

## Environment Variables

See `.env.example` for required variables. Key ones likely include:
- Supabase URL & anon key
- Paystack secret & public keys
- Vercel environment variables
- Lovable.dev project config

---

## Deployment

- **Platform**: Vercel
- **Framework Preset**: Vercel (Nitro)
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev`
- **Config**: `vite.config.ts` uses `@lovable.dev/vite-tanstack-config` with Nitro Vercel preset
- **Externals**: Supabase packages & tslib are externalized for SSR

---

## Important Notes

1. **Supabase Externals**: In `vite.config.ts`, Supabase packages and tslib are marked as external to avoid SSR issues on Vercel.
2. **Error Handling**: `src/lib/error-capture.ts` and `src/lib/error-page.ts` handle SSR errors.
3. **Auth Context**: `DotAuthContext` in `src/contexts/DotAuthContext.tsx` manages authentication state.
4. **Legacy Backends**: `dotlive-backend/` and `dotlive-monorepo/` are legacy Fastify backends - current app uses Supabase directly.
5. **shadcn/ui**: UI components are in `src/components/ui/` and follow shadcn patterns.

---

Last Updated: 2026-06-24
