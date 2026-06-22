# DOT — Where African Builders Become Founders

DOT is a venture progression network for African founders: earn DOT by
building, spend DOT to upgrade your role, and unlock investor capital.

This monorepo holds the entire stack:

```
dotlive-monorepo/
├── apps/
│   ├── api/        # Fastify + Drizzle + Lucia (Node 20, ESM, TypeScript)
│   └── web/        # React 18 + Vite + Tailwind v4 (Vite SPA)
├── packages/
│   └── shared/     # Cross-cutting TypeScript types
├── render.yaml     # Render Blueprint for the API
├── vercel.json     # Vercel config for the frontend
└── README.md       # You are here
```

---

## Local development

Prereqs: Node 20+ and an internet connection (Neon + Cloudinary).

```bash
# 1. Install workspace deps
npm install

# 2. Set up env (copy and edit)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit apps/api/.env:
#   DATABASE_URL = your Neon pooler URL
#   JWT_SECRET = any 32+ char string
#   CLOUDINARY_* = from your Cloudinary dashboard
#   GOOGLE_CLIENT_ID/SECRET = optional, from Google Cloud Console

# 3. Apply DB migrations (creates all 23 tables + role_requirements defaults)
cd apps/api && node scripts/push-schema.mjs

# 4. Run both servers in two terminals:
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:3001` (set by
`VITE_API_URL` in `apps/web/.env`).

---

## Architecture

### Auth flow

- **Signup**: email + password (Argon2id hash). Auto-grants the `builder`
  role + 500 DOT starter grant + writes a `Starter Grant` ledger entry.
- **Login**: Argon2 verify, Lucia session creation, JWT issued (signed
  with `JWT_SECRET`). Token sent back to the SPA which stores it in
  `localStorage`.
- **Google OAuth**: `GET /api/auth/google` → Google consent screen →
  callback exchanges the code, upserts the user, mints a JWT, redirects
  to `${FRONTEND_URL}/auth/callback?token=...`. The SPA's
  `GoogleCallback` route stores the token and navigates to `/dashboard`.
- **Protected routes**: `@fastify/jwt` verifies the Bearer token; the
  `authenticate` decorator (registered in `server.ts`) attaches the user
  to `request.user`.

### DOT economy

DOT is an internal accounting unit (1 DOT = ₦10 placeholder). Every
credit/debit goes through `creditWallet` / `debitWallet` in
`apps/api/src/lib/dot.ts`, which writes a `transactions` row in the
same call. Webhooks (Paystack, Whop) idempotency-check by reference
before crediting so retries are safe.

### File uploads

- **Images** (avatars, logos): frontend calls
  `GET /api/upload/sign` for a Cloudinary signature, then uploads
  directly to Cloudinary. Backend never sees the bytes.
- **Documents** (PDFs): frontend POSTs the file to
  `POST /api/upload/document` (multipart, 25 MB cap). Backend streams
  it to Cloudinary.

---

## Deploying

### Backend → Render

The repo includes `render.yaml` at the root. Render picks it up
automatically when you connect the GitHub repo.

1. Push this repo to GitHub.
2. Render → New → Blueprint → select the repo.
3. Set the missing secrets in the Render dashboard:
   - `DATABASE_URL` (your Neon pooler URL)
   - `JWT_SECRET` (auto-generated, but you can override)
   - `CLOUDINARY_*` (from Cloudinary)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)
4. Deploy. The health check at `/api/health` returns 200 once booted.

**Build steps Render runs** (from `render.yaml`):

```bash
cd apps/api
npm install
npm run build       # tsc → dist/server.js
node dist/server.js
```

### Frontend → Vercel

`vercel.json` at the repo root configures Vercel to:

1. Run `npm install --workspaces` at the root.
2. Build `apps/web` with Vite (`vite build` → `apps/web/dist`).
3. Serve `apps/web/dist` as static files.
4. Inject `VITE_API_URL` pointing at your Render URL.

Steps:

1. Vercel → New Project → import the GitHub repo.
2. Framework preset: **Vite** (auto-detected).
3. Override env vars as needed (default `VITE_API_URL` points to
   `dotlive-api.onrender.com`).
4. Deploy.

### Neon

1. Create a project at https://neon.tech.
2. Copy the **pooled** connection string (looks like
   `postgresql://user:***@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require`).
3. Set it as `DATABASE_URL` in Render.
4. Run migrations once locally:
   ```bash
   cd apps/api && DATABASE_URL=... node scripts/push-schema.mjs
   ```
   Or in CI: add a one-off `npm run db:push` step before the deploy.

### Cloudinary

Already configured in `apps/api/.env.example` with the cloud name
provided in the brief. For production, create an upload preset named
`dotlive_signed` if you want tighter restrictions on direct uploads.

### Google OAuth (optional)

1. https://console.cloud.google.com → New Project → OAuth consent screen.
2. APIs & Services → Credentials → Create OAuth client ID → Web app.
3. Authorized redirect URI:
   `https://<your-api>.onrender.com/api/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render.

---

## Database

23 tables, all created by `apps/api/scripts/push-schema.mjs`. The
script:

1. Connects to Neon via the `DATABASE_URL` env var.
2. Applies `apps/api/src/db/migrations/0000_*.sql` (generated by
   `drizzle-kit generate` from `src/db/schema.ts`).
3. Seeds `role_requirements` with the five defaults:
   - founder (2,000 DOT)
   - investor (10,000 DOT)
   - community_leader (1,000 DOT)
   - vendor (5,000 DOT)
   - capital_partner (50,000 DOT)

To regenerate the SQL migration after editing `src/db/schema.ts`:

```bash
cd apps/api
npx drizzle-kit generate
```

---

## API surface

All endpoints are under `/api`. Auth is via `Authorization: Bearer
<token>` header. Errors return `{ error: string, ... }`.

### Auth
- `POST /api/auth/signup` — create account, returns JWT
- `POST /api/auth/login` — returns JWT
- `POST /api/auth/logout` — invalidates session
- `GET  /api/auth/me` — current user
- `GET  /api/auth/google` → Google consent (302)
- `GET  /api/auth/google/callback` → JWT redirect to frontend

### Users
- `GET   /api/users/me`
- `PATCH /api/users/me`
- `POST  /api/users/roles` — request role upgrade
- `GET   /api/users/:dotId`

### Wallet
- `GET  /api/wallet`
- `GET  /api/wallet/transactions`
- `POST /api/wallet/transfer`

### Ventures, Vantage, Academy
- CRUD + history endpoints under `/api/ventures`, `/api/vantage`,
  `/api/academy`.

### Events, Pitchathons
- Listing + registration under `/api/events`, `/api/pitchathons`.

### Marketplace (Services + Jobs + Orders)
- `/api/services`, `/api/jobs`, `/api/orders` with role-gated POSTs.

### Community
- `/api/communities`, `/api/communities/join`, `/api/communities/:id/members`.

### Uploads
- `GET  /api/upload/sign` — Cloudinary signature for direct upload.
- `POST /api/upload/document` — multipart (max 25 MB).

### Webhooks
- `POST /api/webhooks/paystack` — HMAC-SHA512 verify, credit DOT.
- `POST /api/webhooks/whop` — HMAC-SHA256 verify, credit DOT.

---

## What's not done

The migration scope was the **infrastructure** (DB, API, auth, uploads,
deployment). The frontend is a working shell with:

- Landing page (modern dark theme, animated)
- Login / Signup / Google OAuth
- Dashboard with wallet + role-upgrade cards
- Wallet page with transaction history
- Marketplace page with Gigs | Jobs tabs

The other pages from the existing Lovable codebase (Vantage wizard,
Pitchathons, Academy course player, Community directory, Onboarding
flow, Investor dashboard, Admin panel) need to be migrated page-by-page
against the new API. The patterns in `Dashboard.tsx`, `Work.tsx`, and
`Wallet.tsx` are the templates — copy them and swap the data layer.

---

## License

Proprietary. © 2026 dotlive.
