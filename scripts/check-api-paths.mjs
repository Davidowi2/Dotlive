/**
 * check-api-paths.mjs — Cross-checks every frontend dotApi call
 * against the backend route declarations to find mismatches.
 * Run: node scripts/check-api-paths.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const PREFIXES = {
  "admin.ts": "/api/admin", "academy.ts": "/api", "auth.ts": "/api",
  "builders.ts": "/api", "certificates.ts": "/api", "challenges.ts": "/api/community",
  "community.ts": "/api", "connections.ts": "/api", "demo-events.ts": "/api",
  "extras.ts": "/api", "feed.ts": "/api", "investments.ts": "/api",
  "investor.ts": "/api", "leaderboard.ts": "/api", "magic-link.ts": "/api",
  "marketplace.ts": "/api", "notifications.ts": "/api", "onboarding.ts": "/api",
  "os.ts": "/api", "otp.ts": "/api", "payments.ts": "/api", "pitchathons.ts": "/api",
  "referrals.ts": "/api", "stats.ts": "/api", "upload.ts": "/api", "users.ts": "/api",
  "vantage.ts": "/api", "ventures.ts": "/api", "wallet.ts": "/api",
  "webhooks.ts": "/api", "withdrawals.ts": "/api", "wizard.ts": "/api",
  "capital-partner.ts": "/api", "admin-tools.ts": "/api", "community-billing.ts": "/api",
};

// --- Collect backend routes ---
const ROUTES_DIR = "dotlive-backend/apps/api/src/routes";
const backendRoutes = new Set();
const routeRe = /app\.(get|post|put|patch|delete)(?:<[^>]+>)?\s*\(\s*["']([^"']+)["']/;

for (const file of readdirSync(ROUTES_DIR).filter(f => f.endsWith(".ts"))) {
  const prefix = PREFIXES[file] ?? "/api";
  for (const line of readFileSync(join(ROUTES_DIR, file), "utf8").split("\n")) {
    const m = routeRe.exec(line);
    if (m) {
      // Normalise :param segments
      const normalised = (prefix + m[2]).replace(/:[^/]+/g, ":id");
      backendRoutes.add(normalised);
    }
  }
}

// --- Collect frontend dotApi calls ---
const API_DIR = "src/api";
const callRe = /dotApi\.(get|post|put|patch|delete)\s*[(<][^'"]*["']([^"']+)["']/;
const issues = [];

for (const file of readdirSync(API_DIR).filter(f => f.endsWith(".ts"))) {
  const lines = readFileSync(join(API_DIR, file), "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = callRe.exec(line);
    if (!m) return;
    // Strip template literal variable parts and query strings
    const rawPath = m[2]
      .replace(/\$\{[^}]+\}/g, ":id")
      .replace(/\?.*/, "");
    if (!rawPath.startsWith("/api/")) return;
    const normalised = rawPath.replace(/:[^/]+/g, ":id");

    // Check exact match or prefix match (for parameterised routes)
    const exactMatch = backendRoutes.has(normalised);
    const prefixMatch = !exactMatch && Array.from(backendRoutes).some(r => {
      // e.g. /api/builders/:id/arena matches frontend /api/builders/:id/arena
      return r === normalised;
    });

    if (!exactMatch && !prefixMatch) {
      issues.push(`  ${m[1].toUpperCase()} ${rawPath}  (${file}:${i + 1})`);
    }
  });
}

console.log(`\n=== API path audit: ${backendRoutes.size} backend routes ===\n`);
if (issues.length === 0) {
  console.log("✅ All frontend API calls match backend routes\n");
} else {
  console.log(`⚠️  ${issues.length} frontend call(s) with no exact backend match:`);
  console.log("(These may still work if the backend has wildcard/regex routes)\n");
  issues.forEach(i => console.log(i));
}
