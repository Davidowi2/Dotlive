/**
 * One-off migration script — applies the missing schema changes
 * introduced since the last migration:
 *
 *   1. founder_profiles: add columns headcount, annual_revenue_dot,
 *      founded_year, total_raised_dot, share_price_kobo, shares_available
 *   2. investments: new table
 *
 * Run via: node -r dotenv/config src/db/migrate-additions.js
 * (or just: node src/db/migrate-additions.js with .env loaded by Render)
 */
import { db } from "./client.js";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Adding founder_profiles columns...");
  await db.execute(sql`
    ALTER TABLE founder_profiles
    ADD COLUMN IF NOT EXISTS headcount integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS annual_revenue_dot text DEFAULT '0',
    ADD COLUMN IF NOT EXISTS founded_year integer,
    ADD COLUMN IF NOT EXISTS total_raised_dot text DEFAULT '0',
    ADD COLUMN IF NOT EXISTS share_price_kobo integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shares_available integer DEFAULT 0;
  `);
  console.log("  ✓ founder_profiles columns added");

  console.log("Creating investments table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS investments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      investor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      founder_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      shares integer NOT NULL,
      share_price_kobo integer NOT NULL,
      total_paid_dot numeric(20, 2) NOT NULL,
      wallet_tx_id text,
      paystack_ref text,
      status text NOT NULL DEFAULT 'confirmed',
      created_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  console.log("  ✓ investments table created");

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS investments_investor_idx
      ON investments(investor_id, created_at);
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS investments_founder_idx
      ON investments(founder_id, created_at);
  `);
  console.log("  ✓ investments indexes created");

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});