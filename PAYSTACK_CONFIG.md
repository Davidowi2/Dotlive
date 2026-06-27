# Paystack Production Configuration Guide

The Paystack LIVE mode dashboard (https://dashboard.paystack.com/#/settings/developers)
needs these values set for DOT OS deposits to work end-to-end.

## What's already done

✅ `PAYSTACK_SECRET_KEY` is set on Render (you added it)
✅ Backend `/api/payments/deposit` now returns valid `authorization_url` (tested: 2000 DOT → ₦30,000)
✅ Backend `/api/wallet/verify-bank-account` proxies Paystack Resolve API
✅ Backend `/api/wallet/banks` returns 27 Nigerian banks
✅ Frontend deposit dialog reads `authorization_url` and redirects to checkout
✅ Webhook secret uses `PAYSTACK_SECRET_KEY` (HMAC SHA-512 signature)

## What you need to do in the Paystack dashboard

### 1. Webhook URL — **REQUIRED**

Go to **Settings → API → Live mode → Webhook URL**

Set to:
```
https://dotlive-api.onrender.com/api/webhooks/paystack
```

This tells Paystack where to POST when a charge succeeds. Our webhook handler
verifies the HMAC-SHA512 signature using `PAYSTACK_SECRET_KEY`, looks up the
payment row by reference, checks the amount matches, then credits the wallet
DOT. Webhook has been tested and works.

### 2. Callback URL — **OPTIONAL**

Go to **Settings → API → Live mode → Callback URL**

Set to:
```
https://dotlive.cv/wallet
```

(Our backend already overrides this per-deposit by passing `callback_url` in the
initialize request, so this is just the default fallback.)

### 3. IP Whitelist — **OPTIONAL**

By default Paystack allows any IP. If you want extra security:
- Go to **Settings → Security → IP Allowlist**
- Add Render's outbound IPs (look up via `curl https://api.ipify.org` from your Render shell)

## Verification

### Test the deposit flow

```bash
# Login
curl -X POST https://dotlive-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"browserverify@test.com","password":"Verify123!"}'
# Copy the token from the response

# Initiate deposit
curl -X POST https://dotlive-api.onrender.com/api/payments/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amountDot": 2000}'
# → { authorization_url, reference, amountDot, amountNaira }
# Open authorization_url in browser to complete payment
# After payment, webhook fires → wallet is credited with 2000 DOT
```

### Test the bank verification

```bash
curl -X POST https://dotlive-api.onrender.com/api/wallet/verify-bank-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bankCode": "058", "accountNumber": "0123456789"}'
# → { accountName: "..." } if real account
# → 502 with hint if Paystack can't reach the API or account is invalid
```

## KYC tiers (for withdrawals)

| Tier | Verified by | Daily limit |
|---|---|---|
| tier1 | Email verified (signup) | 5,000 DOT |
| tier2 | BVN verified | 100,000 DOT |
| tier3 | NIN + government ID | unlimited |

Withdrawals over the limit return 403 with `limit` and `currentTier` in the
response so the frontend can show the user what they need to do.

## Deposit flow diagram

```
User → /wallet → clicks Deposit
  ↓
Frontend POSTs /api/payments/deposit with { amountDot }
  ↓
Backend:
  1. Validates amount
  2. Looks up user.email from DB (JWT only has sub)
  3. Inserts pending payment row in DB (so webhook can find it)
  4. Calls Paystack /transaction/initialize with email + amount + reference
  ↓
Paystack returns { authorization_url, reference }
  ↓
Frontend redirects user to authorization_url
  ↓
User completes payment on Paystack
  ↓
Paystack → POST /api/webhooks/paystack (with HMAC signature)
  ↓
Backend verifies signature, looks up payment by reference, credits wallet
  ↓
User sees updated balance on /wallet
```

## Common issues

### "Payment provider unreachable" (502)
This means the upstream Paystack call failed. The response now includes a `hint`
field that tells you exactly what went wrong:

- `"hint": "Paystack: \"email\" is not allowed to be empty"` → fix: user record has no email (now fixed on backend)
- `"hint": "Paystack blocked the request — likely an IP whitelist issue"` → fix: clear Paystack IP whitelist
- `"hint": "Invalid Paystack secret key"` → fix: re-check `PAYSTACK_SECRET_KEY` on Render

### Webhook never fires
- Confirm the Webhook URL is set in Paystack dashboard
- Check Render logs: `Paystack webhook signature verification failed` → secret mismatch
- Check Render logs: `Could not find payment with reference=X` → reference mismatch

### Wallet not credited after payment
- Verify payment status at `/api/payments/:id` (admin endpoint)
- Check `webhook_log` table in DB
- Replay the webhook by calling `POST /api/payments/:id/replay`