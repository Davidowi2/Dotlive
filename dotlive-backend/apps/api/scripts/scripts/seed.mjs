/**
 * Seed script — inserts default role_requirements.
 * Idempotent: uses ON CONFLICT DO UPDATE so it's safe to re-run.
 *
 * Usage:
 *   cd apps/api
 *   npm run db:seed
 */

import { neon } from "@neondatabase/serverless";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const roles = [
  {
    role: "founder",
    dot_cost: 2000,
    description: "Build and progress your venture. Access Vantage, Academy, Pitchathons and DOT Demo.",
  },
  {
    role: "investor",
    dot_cost: 10000,
    description: "Discover and fund African ventures. Browse Vantage-ranked founders and request meetings.",
  },
  {
    role: "community_leader",
    dot_cost: 1000,
    description: "Launch and grow a founder community. Earn DOT rewards for activating builders.",
  },
  {
    role: "vendor",
    dot_cost: 5000,
    description: "Offer products and services to the DOT network. Post in the marketplace.",
  },
  {
    role: "capital_partner",
    dot_cost: 50000,
    description: "Full investor dashboard with capital partner features and portfolio tracking.",
  },
];

console.log("Seeding role_requirements...\n");

for (const r of roles) {
  await sql`
    INSERT INTO role_requirements (role, dot_cost, required_fields, description, is_active)
    VALUES (
      ${r.role},
      ${r.dot_cost},
      '[]'::jsonb,
      ${r.description},
      true
    )
    ON CONFLICT (role) DO UPDATE
      SET dot_cost    = EXCLUDED.dot_cost,
          description = EXCLUDED.description,
          updated_at  = now()
  `;
  console.log(`  ✓  ${r.role.padEnd(18)} — ${r.dot_cost.toLocaleString()} DOT`);
}

console.log("\nDone. role_requirements has been seeded.");
