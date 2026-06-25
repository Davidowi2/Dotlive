
import { Pool } from "@neondatabase/serverless";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
console.log(`Tables (${r.rows.length}):`);
for (const row of r.rows) console.log(`  ${row.table_name}`);
await pool.end();
