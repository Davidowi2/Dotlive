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

## Full Project Audit (2026-06-29)

### Overview
A comprehensive audit of the DOT app, checking for errors, inconsistencies, and issues from the current state.

---

### TypeScript Errors Found (26 total errors)

1.  **DotAuthContext missing `signOut` (AdminShell.tsx:30:11)`
    - **Problem: AdminShell tries to destructure `signOut` from useDotAuth(), but context only provides `logout`
    - **Files**: `src/contexts/DotAuthContext.tsx`, `src/components/app/AdminShell.tsx`

2.  **AppRole missing `judge` type not in AppRole enum (AppShell.tsx:69:78, judge.tsx:32:29)
    - **Problem**: `judge` role is used in code but not defined in `AppRole` type
    - **Files**: `src/types/api.ts`, `src/components/app/AppShell.tsx`, `src/routes/_authenticated/judge.tsx`

3.  **Missing `computeVantage` export from src/lib/vantage.ts (vantage.server.ts:4:10)
    - **Problem**: vantage.server.ts tries to import `computeVantage` from ./vantage.ts, which only has categoryScores, vantagePointFromScores, etc., but no computeVantage()
    - **Files**: `src/lib/vantage.ts`, `src/lib/vantage.server.ts`

4.  **Router config issue (src/router.tsx:17:5)
    - **Problem**: TanStack Router config passing `queryClient` directly to createRouter(), but `queryClient` doesn't match constructor options
    - **Files**: `src/router.tsx`

5.  **Button variant `muted` not valid (admin/members.tsx:316:21, 467:21)
    - **Problem**: Button's variant `"muted"` used, not a valid variant for shadcn/ui Button (only `"default"`, `"destructive"`, `"outline"`, `"secondary"`, `"ghost"`, `"link"`)
    - **Files**: `src/routes/_authenticated/admin/members.tsx`

6.  **Certificate type issues (certificates.tsx:168:15, 201:63, 219:31, 302:28)
    - **Problem**:
      - `certificate.course` → should be `courseId` (certificates.tsx:201)`
      - `certificate.issued` → should be `issuedAt`
    - **Files**: `src/routes/_authenticated/certificates.tsx`

7.  **EmptyState missing `body` and `cta` props (community/channels.tsx:173:11, 277:17)
    - **Problem**: EmptyState component doesn't accept `body` or `cta` props - uses `description` and `action` instead
    - **Files**: `src/routes/_authenticated/community/channels.tsx`, `src/components/app/EmptyState.tsx`

8.  **PageSkeleton used incorrectly (notifications.tsx:158:12)
    - **Problem**: PageSkeleton is an object with sub-components, not a direct component
    - **Files**: `src/routes/_authenticated/notifications.tsx`, `src/components/app/PageSkeleton.tsx`

9.  **Portfolio route uses wrong founder route (portfolio.tsx:183:29, 183:60)
    - **Problem**: Tries to use `/founder/$dotId` instead of `/founder/$id`, and `dotId` param instead of `id`
    - **Files**: `src/routes/_authenticated/portfolio.tsx`

10. **PageHeader missing icon prop (referrals.tsx:50:11)
    - **Problem**: PageHeader doesn't accept an `icon` prop
    - **Files**: `src/routes/_authenticated/referrals.tsx`

11. **Vantage.tsx missing state variables (vantage.tsx:381:7, 382:7)
    - **Problem**: `setSubmittedNow` and `setStage` variables used but not declared
    - **Files**: `src/routes/_authenticated/vantage.tsx`

12. **Ventures.tsx passing string to number (ventures.tsx:294:59, 301:57, 307:54)
    - **Problem**: Number fields receiving string values
    - **Files**: `src/routes/_authenticated/ventures.tsx`

13. **Work.tsx null to UserRole (work.tsx:354:31)
    - **Problem**: Passing null to UserRole/UserRole[]
    - **Files**: `src/routes/_authenticated/work.tsx`

14. **Missing ShoppingCart import (founder.$id.tsx:402:8, 427:16)
    - **Problem**: ShoppingCart from lucide-react is used but not imported
    - **Files**: `src/routes/founder.$id.tsx`

---

### Audit Checklist
- ✅ Dependencies installed (`node_modules` present
- ✅ `package.json` looks correct
- ⚠️ TypeScript errors (26 errors as above
- ⏳ ESLint skipped
- ❓ Dev server not yet started
- ✅ Project structure looks good
- ✅ Database schema documented
- ✅ Supabase integration set up

---

### Next Steps (Fix List)
1. Fix TypeScript errors (see list above
2. Run `npm run lint` to check ESLint issues
3. Start dev server and check for runtime errors
4. Check if any missing .env variables

---

Last Updated: 2026-06-29
