# Monitoring Setup Guide

## Why You Need This NOW

You have:
- Challenge escrow (money can get stuck)
- Auto-minting certificates (can duplicate)
- Leaderboard calculations (can show wrong rankings)
- Payment webhooks (can fail silently)

Without monitoring, you won't know when things break until users complain.

## Phase 1: Error Tracking (Sentry) — 30 minutes

### Setup

1. **Create Sentry account**: https://sentry.io (free tier = 5k errors/month)
2. **Create project**: Select "React" as platform
3. **Add to your code**:

```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/react";

if (typeof window !== "undefined" && import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
```

4. **Add to root component** (`src/routes/__root.tsx`):

```typescript
import { Sentry } from "@/lib/sentry";

// Wrap your error component
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  
  // ... rest of error UI
}
```

5. **Add env var** to Vercel:
   - `VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx`

### What to track

**Critical paths:**
- All wallet operations (tag: `transaction: wallet`)
- Challenge submissions (tag: `transaction: challenge`)
- Certificate minting (tag: `transaction: certificate`)
- Payment webhooks (tag: `transaction: payment`)

**Example:**
```typescript
try {
  await submitChallenge(challengeId, submission);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      transaction: 'challenge',
      challengeId,
    },
    extra: {
      submission,
    },
  });
  throw error;
}
```

## Phase 2: Uptime Monitoring — 15 minutes

### Option A: UptimeRobot (Free)

1. Sign up: https://uptimerobot.com
2. Add monitors for:
   - `https://dotlive.cv` (HTTP, 5 min intervals)
   - `https://dotlive-api.onrender.com/health` (HTTP, 5 min intervals)
   - `https://uentjmbofqfqtkabzijj.supabase.co` (PING, 5 min intervals)
3. Set up alerts to your email/Slack

### Option B: Vercel built-in (If on Pro plan)

Already included - check Vercel dashboard → Analytics tab

## Phase 3: Database Monitoring — Built-in

### Supabase Dashboard

Monitor daily:
- **Database → Logs** — slow queries, errors
- **API → Logs** — failed requests
- **Database → Reports** — storage usage, connection count

### Create alerts for:
- Database size > 400 MB (you're on 500MB limit)
- Connection count > 50 (indicates a leak)
- Error rate > 10/min

## Phase 4: Financial Reconciliation — CRITICAL

Create a daily check that validates:

```sql
-- Run this daily as a cron job
-- Expected: All three should match

-- 1. Sum of all transactions
SELECT SUM(amount) FROM transactions;

-- 2. Sum of all wallet balances
SELECT SUM(balance) FROM wallets;

-- 3. Expected total (500 DOT per new user × user count + admin mints)
SELECT 
  (SELECT COUNT(*) FROM users) * 500 + 
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'Admin Adjustment' AND amount > 0)
  AS expected_total;
```

If these don't match = **CRITICAL BUG** in wallet logic.

### Set up alert

Create a Supabase Edge Function that runs daily:

```typescript
// supabase/functions/daily-reconciliation/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(/* ... */);
  
  const { data: txSum } = await supabase.rpc('sum_transactions');
  const { data: walletSum } = await supabase.rpc('sum_wallets');
  
  if (Math.abs(txSum - walletSum) > 0.01) {
    // ALERT! Send email/Slack notification
    await fetch('YOUR_ALERT_WEBHOOK', {
      method: 'POST',
      body: JSON.stringify({
        alert: 'WALLET_MISMATCH',
        txSum,
        walletSum,
        diff: txSum - walletSum,
      }),
    });
  }
  
  return new Response('OK');
});
```

Run via Supabase cron trigger.

## Cost Summary

| Service | Plan | Cost | What you get |
|---------|------|------|--------------|
| Sentry | Free | $0 | 5k errors/month, 1 user |
| UptimeRobot | Free | $0 | 50 monitors, 5min checks |
| Supabase Logs | Built-in | $0 | Included in free tier |
| **Total** | | **$0/month** | Production-ready monitoring |

## When to Upgrade

Upgrade when:
- **Sentry**: >5k errors/month (means you have serious bugs OR high traffic)
- **UptimeRobot**: Need faster checks (<5min) or more monitors
- **Supabase**: >500MB database (auto-upgrade to Pro $25/month)

## Dashboard to Check Daily

1. **Morning**: Sentry dashboard (any new errors overnight?)
2. **Daily**: Supabase logs (slow queries?)
3. **Weekly**: Financial reconciliation report
4. **Monthly**: User growth vs. database size trend

---

**Bottom line:** 1 hour of setup now saves you from discovering a critical bug 3 months from now that costs you user trust and money.
