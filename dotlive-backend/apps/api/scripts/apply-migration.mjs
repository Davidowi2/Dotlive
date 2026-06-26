
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;

const fs = await import("fs");
const sqlText = fs.readFileSync(process.argv[2], "utf8");

const lines = sqlText.split("\n").filter(l => !l.trim().startsWith("--"));
const cleaned = lines.join("\n");

// Mask $$...$$ blocks so semicolons inside don't split us
const masked = cleaned.replace(/\$\$[\s\S]*?\$\$/g, m => m.replace(/;/g, "§§§"));

// Split on ;
const parts = masked.split(";")
  .map(s => s.replace(/§§§/g, ";").trim())
  .filter(s => s.length > 0);

console.log(`Running ${parts.length} statements...`);

const db = neon(process.env.DATABASE_URL);
let ok = 0, skipped = 0, failed = 0;
for (let idx = 0; idx < parts.length; idx++) {
  const stmt = parts[idx];
  try {
    await db(stmt);
    ok++;
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (msg.includes("already exists") || msg.includes("does not exist") || msg.includes("duplicate")) {
      skipped++;
    } else {
      failed++;
      console.error(`FAIL #${idx}: ${stmt.slice(0, 70).replace(/\n/g, " ")}...`);
      console.error(`  → ${msg.split("\n")[0]}`);
    }
  }
}
console.log(`Done: ${ok} ok, ${skipped} skipped, ${failed} failed`);
