
import { Pool } from "@neondatabase/serverless";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('achievements', 'activities', 'challenges', 'reputation_events', 'builder_levels', 'pitchathon_scores') ORDER BY table_name");
for (const r of tables.rows) console.log(`  ${r.table_name}`);
await pool.end();
