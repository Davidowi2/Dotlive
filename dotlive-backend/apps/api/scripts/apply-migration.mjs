import { Pool } from "@neondatabase/serverless";
import fs from "node:fs";

const url = process.env.DATABASE_URL;
const file = process.argv[2];
if (!url) { console.error("No DATABASE_URL"); process.exit(1); }
if (!file) { console.error("No file"); process.exit(1); }
const sql = fs.readFileSync(file, "utf8");
const pool = new Pool({ connectionString: url });

const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
console.log(`Running ${statements.length} statements...`);
let i = 0, skipped = 0, failed = 0;
for (const stmt of statements) {
  try {
    await pool.query(stmt);
    i++;
  } catch (e) {
    const msg = String(e?.message || e);
    if (/already exists|does not exist/i.test(msg)) {
      skipped++;
    } else {
      failed++;
      console.error(`  FAIL: ${msg.slice(0,200)}`);
    }
  }
}
console.log(`Done: ${i} ok, ${skipped} skipped, ${failed} failed`);
await pool.end();
