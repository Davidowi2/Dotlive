/**
 * check-routes.mjs — finds duplicate Fastify route declarations across all backend files.
 * Run: node scripts/check-routes.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROUTES_DIR = "dotlive-backend/apps/api/src/routes";

// Each file's prefix as registered in server.ts
const PREFIXES = {
  "academy.ts":          "/api",
  "admin.ts":            "/api/admin",   // registered as { prefix: "/api/admin" }
  "admin-tools.ts":      "/api",
  "auth.ts":             "/api",
  "builders.ts":         "/api",
  "capital-partner.ts":  "/api",
  "certificates.ts":     "/api",
  "challenges.ts":       "/api/community", // WE changed this
  "community.ts":        "/api",
  "community-billing.ts":"/api",
  "connections.ts":      "/api",
  "demo-events.ts":      "/api",
  "extras.ts":           "/api",
  "feed.ts":             "/api",
  "investments.ts":      "/api",
  "investor.ts":         "/api",
  "leaderboard.ts":      "/api",
  "magic-link.ts":       "/api",
  "marketplace.ts":      "/api",
  "notifications.ts":    "/api",
  "onboarding.ts":       "/api",
  "os.ts":               "/api",
  "otp.ts":              "/api",
  "payments.ts":         "/api",
  "pitchathons.ts":      "/api",
  "referrals.ts":        "/api",
  "stats.ts":            "/api",
  "upload.ts":           "/api",
  "users.ts":            "/api",
  "vantage.ts":          "/api",
  "ventures.ts":         "/api",
  "wallet.ts":           "/api",
  "webhooks.ts":         "/api",
  "withdrawals.ts":      "/api",
  "wizard.ts":           "/api",
};

const seen = new Map();
const duplicates = [];

const files = readdirSync(ROUTES_DIR).filter(f => f.endsWith(".ts"));

for (const file of files) {
  const prefix = PREFIXES[file] ?? "/api";
  const content = readFileSync(join(ROUTES_DIR, file), "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    // Match: app.get("/path" or app.post<{Params}>("/path"
    const m = line.match(/app\.(get|post|put|patch|delete)(?:<[^>]+>)?\s*\(\s*["']([^"']+)["']/);
    if (!m) return;
    const method = m[1].toUpperCase();
    const routePath = m[2];
    const fullPath = prefix + routePath;
    const key = `${method} ${fullPath}`;

    if (seen.has(key)) {
      duplicates.push({ key, file1: seen.get(key), file2: file, line: i + 1 });
    } else {
      seen.set(key, `${file}:${i + 1}`);
    }
  });
}

console.log(`\n=== Route audit: ${seen.size} unique routes across ${files.length} files ===\n`);

if (duplicates.length === 0) {
  console.log("✅ No duplicate routes found!\n");
} else {
  console.log(`❌ Found ${duplicates.length} duplicate route(s):\n`);
  for (const d of duplicates) {
    console.log(`  DUPLICATE: ${d.key}`);
    console.log(`    First:  ${d.file1}`);
    console.log(`    Second: ${d.file2}:${d.line}\n`);
  }
}
