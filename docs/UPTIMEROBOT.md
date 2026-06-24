# UptimeRobot Monitoring Setup

Keep the DOT platform online and get alerted instantly if anything goes down.

## Setup (free account covers everything needed)

1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up free
2. Click **Add New Monitor**

---

## Monitor 1 — API Health Check

| Field | Value |
|-------|-------|
| Monitor Type | HTTP(s) |
| Friendly Name | DOT API |
| URL | `https://dotlive-api.onrender.com/api/health` |
| Monitoring Interval | Every 5 minutes |
| Alert Contacts | Your email |

This pings the `/api/health` endpoint which returns `{ ok: true }`.
Render free tier spins down after 15 min of inactivity — this ping
keeps it warm so the first user doesn't wait 30+ seconds.

---

## Monitor 2 — Frontend

| Field | Value |
|-------|-------|
| Monitor Type | HTTP(s) |
| Friendly Name | DOT Frontend |
| URL | `https://dotlive-lake.vercel.app` |
| Monitoring Interval | Every 5 minutes |
| Alert Contacts | Your email |

---

## Monitor 3 — DB health (optional)

The API health endpoint already verifies DB connectivity.
No separate DB monitor needed unless you want granular alerting.

---

## Render Free Tier Note

Render free web services sleep after 15 minutes of inactivity.
The UptimeRobot ping every 5 minutes **prevents this** — keeping
the API always warm for real users. This is the most important
monitor to set up.

Expected health response:
```json
{
  "ok": true,
  "service": "dotlive-api",
  "env": "production",
  "time": "2026-06-24T12:00:00.000Z"
}
```
