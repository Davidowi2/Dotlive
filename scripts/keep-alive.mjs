/**
 * keep-alive.mjs — Uptime ping script for DOT API on Render.
 *
 * Render free-tier services spin down after 15 minutes of inactivity.
 * This script pings the /api/health endpoint every 5 minutes to keep
 * the service warm.
 *
 * Usage:
 *   node scripts/keep-alive.mjs
 *
 * Or deploy it as a separate Render cron job:
 *   Command: node scripts/keep-alive.mjs
 *   Schedule: Every 5 minutes
 *
 * Better yet: use UptimeRobot (free) — https://uptimerobot.com
 *   Monitor URL: https://your-api.onrender.com/api/health
 *   Interval: 5 minutes
 */

const API_URL = process.env.VITE_API_URL || "https://your-api.onrender.com";
const HEALTH_URL = `${API_URL}/api/health`;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function ping() {
  const start = Date.now();
  try {
    const res = await fetch(HEALTH_URL, { method: "GET" });
    const ms = Date.now() - start;
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`[${new Date().toISOString()}] ✅ ${res.status} — ${ms}ms — DB: ${body?.checks?.database?.ok ? "ok" : "⚠️  error"}`);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ ${res.status} — ${ms}ms`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ FAILED — ${err.message}`);
  }
}

console.log(`DOT keep-alive started. Pinging ${HEALTH_URL} every 5 minutes.`);
ping(); // immediate first ping
setInterval(ping, INTERVAL_MS);
