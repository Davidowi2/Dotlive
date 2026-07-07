/**
 * Seed script for Discover feed announcements
 * Run: node dotlive-backend/apps/api/dist/seed-feed.js
 * 
 * Creates admin announcements so Discover always has content
 */

import { db } from "./db/client.js";
import { sql } from "drizzle-orm";
import { feedPosts } from "./db/schema.js";

async function seedFeed() {
  console.log("Seeding Discover feed with announcements...");

  // Get admin user ID (first admin found)
  const adminUser = await db.execute(sql`
    SELECT id FROM users 
    WHERE role = 'admin' OR roles::text LIKE '%admin%' 
    LIMIT 1
  `);

  const authorId = adminUser.rows?.[0]?.id || "00000000-0000-0000-0000-000000000001";
  const authorName = "DOT Admin";
  const authorRole = "admin";

  const announcements = [
    {
      type: "announcement",
      title: "Welcome to DOT Platform!",
      body: "We're building Africa's venture progression network. Connect with founders, find funding, and grow your venture. Start by updating your Vantage score!",
      tags: ["welcome", "announcement"],
    },
    {
      type: "announcement",
      title: "DOT Staking Now Live - Earn 12% APY",
      body: "Stake your DOT tokens and earn 12% APY with a 14-day cooldown. Go to /stakes to start earning passive income on your holdings.",
      tags: ["staking", "dot", "earn"],
    },
    {
      type: "announcement",
      title: "Referral Program - Earn 500 DOT",
      body: "Invite founders and investors to DOT. Earn 500 DOT for each referral who joins and completes their profile. Share your code from /referrals.",
      tags: ["referral", "earn", "bonus"],
    },
    {
      type: "gig",
      title: "Looking for React Developer",
      body: "Need a React developer for a 3-month project. Remote work, flexible hours. Budget: 2000 DOT per month.",
      tags: ["job", "react", "developer"],
      gigType: "contract",
      budgetDot: 2000,
    },
    {
      type: "gig",
      title: "Founders: Post Your Gigs",
      body: "Looking for developers, designers, or marketers? Post gigs on Discover to find talent. Gigs get featured in the feed.",
      tags: ["gig", "talent", "hiring"],
      gigType: "full-time",
      budgetDot: 1500,
    },
    {
      type: "venture_update",
      title: "MediaLift Reaches 10K Users",
      body: "Congrats to MediaLift for hitting 10,000 users! Another DOT venture proving that African startups can scale.",
      tags: ["milestone", "venture", "growth"],
      ventureName: "MediaLift",
      ventureStage: "scale",
    },
    {
      type: "funding",
      title: "Seed Round Funding Available",
      body: "Capital Partners have 50,000 DOT ready to deploy. If you're a founder in the Validate or Build stage, apply for funding through your venture page.",
      tags: ["funding", "capital", "raise"],
      fundingGoal: 50000,
      fundingRound: "seed",
    },
  ];

  for (const post of announcements) {
    try {
      await db.execute(sql`
        INSERT INTO feed_posts (
          author_id, author_name, author_role, type, title, body, tags,
          gig_type, budget_dot, funding_goal, funding_round,
          venture_name, venture_stage, likes_count, comments_count
        ) VALUES (
          ${authorId}, ${authorName}, ${authorRole}, ${post.type}, ${post.title}, ${post.body},
          ${JSON.stringify(post.tags)},
          ${post.gigType || null}, ${post.budgetDot || null}, ${post.fundingGoal || null}, ${post.fundingRound || null},
          ${post.ventureName || null}, ${post.ventureStage || null}, 0, 0
        )
      `);
      console.log(`✓ Created: ${post.title}`);
    } catch (e) {
      console.error(`✗ Failed: ${post.title}`, e.message);
    }
  }

  console.log("Seed complete!");
}

seedFeed().catch(console.error);