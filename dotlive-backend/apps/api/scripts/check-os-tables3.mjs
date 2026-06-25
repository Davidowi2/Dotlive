
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const url = process.env.DATABASE_URL;

// Try pooler
const primary = await neon(url)`SELECT current_database() AS db`;
console.log(`pooler: ${primary[0].db}`);

// Try direct
const directUrl = url.replace(/-pooler\./, ".");
const direct = await neon(directUrl)`SELECT current_database() AS db`;
console.log(`direct: ${direct[0].db}`);

// Use pooler for query
const r = await neon(url)`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('achievements', 'activities', 'challenges', 'reputation_events', 'builder_levels', 'pitchathon_scores') ORDER BY table_name`;
console.log(`Found ${r.length} OS tables:`);
for (const row of r) console.log(`  ${row.table_name}`);
