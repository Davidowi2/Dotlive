
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);
const r = await db`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('achievements', 'activities', 'challenges', 'reputation_events', 'builder_levels', 'pitchathon_scores') ORDER BY table_name`;
console.log(`Found ${r.length} OS tables:`);
for (const row of r) console.log(`  ${row.table_name}`);
