/**
 * Seed script — inserts default role_requirements + feed announcements.
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

// ──────────────────────────────────────────────────────────────
// Seed Discover feed announcements so page isn't empty
// ──────────────────────────────────────────────────────────────

console.log("\n� feed: Seeding Discover announcements...");

// Get admin user (or use system user ID)
const [adminUser] = await sql`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`;
const authorId = adminUser?.id || "00000000-0000-0000-0000-000000000001";

const announcements = [
  {
    type: "announcement",
    title: "Welcome to DOT Platform!",
    body: "We're building Africa's venture progression network. Connect with founders, find funding, and grow your venture. Start by updating your Vantage score!",
    tags: JSON.stringify(["welcome", "announcement"]),
  },
  {
    type: "announcement",
    title: "DOT Staking Now Live - Earn 12% APY",
    body: "Stake your DOT tokens and earn 12% APY with a 14-day cooldown. Go to /stakes to start earning passive income on your holdings.",
    tags: JSON.stringify(["staking", "dot", "earn"]),
  },
  {
    type: "announcement",
    title: "Referral Program - Earn 500 DOT",
    body: "Invite founders and investors to DOT. Earn 500 DOT for each referral who joins and completes their profile. Share your code from /referrals.",
    tags: JSON.stringify(["referral", "earn", "bonus"]),
  },
  {
    type: "gig",
    title: "Looking for React Developer",
    body: "Need a React developer for a 3-month project. Remote work, flexible hours. Budget: 2000 DOT per month.",
    tags: JSON.stringify(["job", "react", "developer"]),
    gig_type: "contract",
    budget_dot: 2000,
  },
  {
    type: "gig",
    title: "Founders: Post Your Gigs",
    body: "Looking for developers, designers, or marketers? Post gigs on Discover to find talent.",
    tags: JSON.stringify(["gig", "talent", "hiring"]),
    gig_type: "full-time",
    budget_dot: 1500,
  },
  {
    type: "venture_update",
    title: "MediaLift Reaches 10K Users",
    body: "Congrats to MediaLift for hitting 10,000 users! Another DOT venture proving that African startups can scale.",
    tags: JSON.stringify(["milestone", "venture", "growth"]),
    venture_name: "MediaLift",
    venture_stage: "scale",
  },
  {
    type: "funding",
    title: "Seed Round Funding Available",
    body: "Capital Partners have 50,000 DOT ready to deploy. If you're a founder in the Validate or Build stage, apply for funding.",
    tags: JSON.stringify(["funding", "capital", "raise"]),
    funding_goal: 50000,
    funding_round: "seed",
  },
];

for (const post of announcements) {
  try {
    await sql`
      INSERT INTO feed_posts (
        author_id, author_name, author_role, type, title, body, tags,
        gig_type, budget_dot, funding_goal, funding_round,
        venture_name, venture_stage, likes_count, comments_count
      ) VALUES (
        ${authorId}, 'DOT Admin', 'admin', ${post.type}, ${post.title}, ${post.body}, ${post.tags},
        ${post.gig_type || null}, ${post.budget_dot || null}, ${post.funding_goal || null}, ${post.funding_round || null},
        ${post.venture_name || null}, ${post.venture_stage || null}, 0, 0
      )
    `;
    console.log(`  ✓ ${post.title}`);
  } catch (e) {
    // Ignore duplicates
    if (e.message?.includes("duplicate") || e.code === "23505") {
      console.log(`  ⊘ ${post.title} (already exists)`);
    } else {
      console.log(`  ✗ ${post.title}: ${e.message}`);
    }
  }
}

console.log("\n✅ Seed complete!");
