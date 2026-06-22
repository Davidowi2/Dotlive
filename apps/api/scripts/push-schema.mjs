// ============================================================
// DOT schema push — Neon-safe.
// ============================================================
//
// What this script does and why it exists:
//
//   1. Connects to Neon Postgres using the DATABASE_URL env var.
//   2. If the pooler URL fails auth (28P01), retries with the
//      DIRECT endpoint (no "-pooler" suffix). This is the most
//      common failure mode after a Neon password reset.
//   3. Runs any pending Drizzle migrations in src/db/migrations.
//   4. Seeds role_requirements with the spec defaults.
//   5. Verifies the live state (table count + roles rows).
//
// Why we don't bake the URL into the source:
//
//   The Neon connection string contains the database password.
//   Hermes redacts passwords that look like known credentials
//   both in source files AND in command-line arguments. We work
//   around this by:
//
//     - Reading the URL from DATABASE_URL only (never source).
//     - Expecting the user to set DATABASE_URL via:
//         export DATABASE_URL="postgresql://..."
//       in their shell, or via a `.env` file that THEY edit.
//
//   In this dev environment Hermes may scrub the password from
//   the .env file on write. If that happens, set DATABASE_URL
//   inline in the shell command:
//
//     DATABASE_URL="postgresql://..." node scripts/push-schema.mjs
//
// What this script DOES NOT do:
//
//   - It does not store the URL in source. If your terminal
//     shows the password as "***", that's a display redactor
//     and the underlying value is intact.
//   - It does not handle every Neon error. If auth fails after
//     both pooler and direct attempts, your password is wrong
//     — go to console.neon.tech → Settings → Database → Reset
//     database password, then re-run.

import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import ws from "ws";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  // Lightweight .env loader — avoids pulling in dotenv just for this.
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "\nDATABASE_URL is not set.\n\n" +
      "Set it in your shell:\n" +
      "  export DATABASE_URL=\"postgresql://user:pass@host/db?sslmode=require\"\n\n" +
      "Or create apps/api/.env with the line DATABASE_URL=...\n"
  );
  process.exit(1);
}

/** Try the pooler URL first, then the direct URL (no "-pooler" suffix). */
function withDirectFallback(poolerUrl) {
  return poolerUrl.replace(/-pooler\./, ".");
}

async function probe(label, url) {
  try {
    const r = await neon(url)`SELECT current_database() AS db, version() AS v`;
    console.log(`  [${label}] connected to ${r[0].db}`);
    return { ok: true, url };
  } catch (e) {
    console.log(`  [${label}] ${e.message}`);
    return { ok: false, url };
  }
}

async function connect() {
  console.log("[1/5] Connecting to Neon…");
  const primary = await probe("pooler", DATABASE_URL);
  if (primary.ok) return primary.url;

  const directUrl = withDirectFallback(DATABASE_URL);
  if (directUrl !== DATABASE_URL) {
    console.log("  pooler failed — retrying with direct endpoint (no -pooler)");
    const fallback = await probe("direct", directUrl);
    if (fallback.ok) return fallback.url;
  }

  console.error("\nBoth pooler and direct endpoints refused auth.");
  console.error("Most likely cause: password was rotated. Fix:");
  console.error("  1. Open https://console.neon.tech");
  console.error("  2. Settings → Database → Reset database password");
  console.error("  3. Copy the new connection string");
  console.error("  4. Re-run with DATABASE_URL=<new-string>\n");
  process.exit(1);
}

const url = await connect();

console.log("[2/5] Counting tables…");
const tables = await neon(url)`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`;
console.log(`  public schema has ${tables[0].n} tables`);

console.log("[3/5] Applying migrations…");
const db = drizzle(neon(url));
try {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../src/db/migrations") });
  console.log("  migrations applied");
} catch (e) {
  // Drizzle's migrator throws if there are no new migrations.
  // That's fine — we just want idempotency.
  if (/no migrations/i.test(String(e?.message))) {
    console.log("  no new migrations");
  } else {
    throw e;
  }
}

console.log("[4/5] Seeding role_requirements defaults…");
await neon(url)`
  INSERT INTO role_requirements (role, dot_cost, required_fields, description) VALUES
    ('founder',         2000,  '["venture_name", "industry", "stage", "description"]'::jsonb, 'Build and scale your venture'),
    ('investor',       10000,  '["investment_range", "industries", "ticket_size"]'::jsonb,     'Discover and fund ventures'),
    ('community_leader', 1000, '["community_name", "region", "category"]'::jsonb,              'Build and lead a community'),
    ('vendor',          5000,  '["company_name", "industry", "description"]'::jsonb,          'Offer services to the ecosystem'),
    ('capital_partner',50000,  '["firm_name", "aum", "focus_areas"]'::jsonb,                   'Deploy capital at scale')
  ON CONFLICT (role) DO UPDATE SET
    dot_cost = EXCLUDED.dot_cost,
    required_fields = EXCLUDED.required_fields,
    description = EXCLUDED.description,
    updated_at = NOW()
`;
console.log("  done");

console.log("[5/5] Final state…");
const finalTables = await neon(url)`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`;
const finalRoles = await neon(url)`SELECT role, dot_cost FROM role_requirements ORDER BY dot_cost`;
console.log(`  ${finalTables[0].n} tables in public schema`);
for (const r of finalRoles) console.log(`  ${String(r.role).padEnd(20)} ${r.dot_cost.toString().padStart(6)} DOT`);

console.log("\nDone.");
