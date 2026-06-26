
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);

// Check all 4 new tables exist
const tables = await db`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN 
  ('withdrawal_requests', 'kyc_submissions', 'demo_events', 'votes')
  ORDER BY table_name
`;
console.log("New tables:", tables.length === 4 ? "ALL PRESENT" : "MISSING");
for (const t of tables) console.log(`  ✓ ${t.table_name}`);

// Check communities extensions
const communityCols = await db`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'communities'
  AND column_name IN ('tier', 'annual_renewal_at', 'subscription_status', 'paid_through_at')
  ORDER BY column_name
`;
console.log(`\nCommunities extension columns: ${communityCols.length}/4`);
for (const c of communityCols) console.log(`  ✓ ${c.column_name}`);

// Check challenges extensions
const challengeCols = await db`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'challenges'
  AND column_name IN ('poster_type', 'poster_org_id')
  ORDER BY column_name
`;
console.log(`\nChallenges extension columns: ${challengeCols.length}/2`);
for (const c of challengeCols) console.log(`  ✓ ${c.column_name}`);
