# Third-Party Integrations — Setup Guide

DOT is designed to integrate with 5 external services. This guide walks through setting up each one. None of them are required for the platform to run — they enable specific features.

---

## 1. Google OAuth (recommended — for "Sign in with Google")

**Status:** Built & deployed. Falls back gracefully if env vars are unset (`503 — Google OAuth not configured`).

### Setup steps

1. Go to https://console.cloud.google.com → project `dotlive` (542681402639).
2. APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.
3. Configure:
   - **Authorized JavaScript origins:** `https://dotlive.cv`
   - **Authorized redirect URIs:** `https://dotlive-api.onrender.com/api/auth/google/callback`
   - **Authorized redirect URIs (local dev):** `http://localhost:3001/api/auth/google/callback`
4. Copy **Client ID** and **Client Secret** to Render dashboard env vars:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET=*** → API Base URL on Google OAuth consent screen** so users see "DOT" instead of "542681402639-dev-app".
6. Wait 5 min – a few hours for Google to propagate the new redirect URIs.

### Test it

```
GET https://dotlive-api.onrender.com/api/auth/google
→ 302 redirect to https://accounts.google.com/o/oauth2/v2/auth?...
→ After consent: redirect back to /api/auth/google/callback?code=...&state=...
→ Then redirect to https://dotlive.cv/dashboard?token=<jwt>
```

The frontend `/auth` page has a `useEffect` that watches for `?token=` in the URL and stores it in localStorage as the auth token.

---

## 2. Resend (transactional email — for password reset, invitations, etc.)

**Status:** Built & deployed. Without an API key, emails are logged to stdout instead of sent.

### Setup steps

1. Sign up at https://resend.com (free tier = 100 emails/day).
2. Verify the `dotlive.cv` domain (add DNS records they give you — DKIM + SPF).
3. API Keys → Create API Key → Copy to Render env var:
   ```
   RESEND_API_KEY=*** n.send 3,000 emails/month for $20.

### Test it

```bash
curl -X POST https://dotlive-api.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "browserverify@test.com"}'
```

If RESEND_API_KEY is set, you'll receive an actual email. If unset, the request still returns 200 (we don't leak whether an account exists) and the email content is logged to the API server logs.

---

## 3. Paystack (for wallet top-ups in Naira)

**Status:** Webhook receiver built (`POST /api/webhooks/paystack`). Frontend button is deferred — for July launch we'll ship "Pay by bank transfer" or manual top-up first.

### Setup steps

1. Sign up at https://paystack.com → Settings → API Keys & Webhooks.
2. Copy **Secret Key** to Render env:
   ```
   PAYSTACK_SECRET_KEY=***  PUBLIC_KEY="pk_live_..."
   ```
3. Set webhook URL to: `https://dotlive-api.onrender.com/api/webhooks/paystack`
4. Set events to listen for: `charge.success`, `transfer.success`, `transfer.failed`.

### What it does

When a user tops up via Paystack, the webhook hits `/api/webhooks/paystack`, verifies the HMAC, then credits the user's wallet via `db.execute(sql\`UPDATE wallets SET balance = balance + ...\`)`. The order row is updated to `completed`.

---

## 4. Whop (for course revenue)

**Status:** Webhook receiver built (`POST /api/webhooks/whop`). No frontend integration yet.

### Setup steps

1. Whop dashboard → Settings → API.
2. Copy **API Key** to Render env: `WHOP_API_KEY=*** copy secret to Render env: `WHOP_WEBHOOK_SECRET=*** it does

Notifies us when a user buys a course via Whop. Currently used for analytics only — no wallet crediting yet. (Courses cost DOT internally; Whop is for fiat buyers.)

---

## 5. Cloudinary (for avatar uploads + KYC document storage)

**Status:** Upload route built (`POST /api/upload/document`). Falls back to local disk if Cloudinary env vars are unset.

### Setup steps

1. Sign up at https://cloudinary.com → Dashboard.
2. Copy cloud name + API key + secret to Render env:
   ```
   CLOUDINARY_CLOUD_NAME="..."
   CLOUDINARY_API_KEY=*** set:
- WhatsApp Business API (for invite-to-DOT links, support chat)
- Google Calendar API (for Sessions booking)
- Notion API (for spec docs → spec.live integration)

These are non-critical for the July launch and will be added as needs arise.

---

## How to set env vars on Render

1. Render dashboard → `dotlive-api` → Environment.
2. Click "Add Environment Variable" for each one above.
3. After saving, Render auto-redeploys (takes 30-90s on the free tier).

To verify what's live:
```
curl https://dotlive-api.onrender.com/api/health
```
Returns `{"ok": true, ...}` with the env-var status block showing which optional services are configured.

---

## Troubleshooting

- **Google OAuth "redirect_uri_mismatch":** The exact URI in Render env (`API_BASE_URL`) + `/api/auth/google/callback` must match what's in Google Console character-for-character.
- **Resend "domain not verified":** The `EMAIL_FROM` must use a domain whose DNS records you've added on Resend. Until then, emails go nowhere.
- **Paystack webhook not firing:** Make sure the URL is `https://` (not `http://`) and that the events are selected on the dashboard.
- **All integrations throwing "503" or "missing env":** Restart the API service after adding new env vars — Render usually does this automatically but on the free tier sometimes you need to wait or trigger a manual redeploy.
