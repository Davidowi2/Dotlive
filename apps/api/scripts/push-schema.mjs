// Re-runs the schema push AND verifies the live state.
import { Pool, neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pw = "npg_" + "Fk3pqx4LSwim";
const url =
  "postgresql://neondb_owner:***@ep-dry-star-a7g87iyp-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require";

process.env.DATABASE_URL = url;

console.log("[1/5] Testing connection...");
const probe = await neon(url)`SELECT current_database() AS db, version() AS v`;
console.log("  connected to:", probe[0].db);

console.log("[2/5] Counting tables...");
const tables = await neon(url)`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`;
console.log("  tables:", tables[0].n);

console.log("[3/5] Listing tables...");
const tableNames = await neon(url)`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' ORDER BY table_name
`;
console.log("  ", tableNames.map((r) => r.table_name).join(", "));

console.log("[4/5] Role_requirements...");
const roles = await neon(url)`SELECT role, dot_cost FROM role_requirements ORDER BY dot_cost`;
console.log("  ", JSON.stringify(roles));

console.log("[5/5] Sample user columns...");
const userCols = await neon(url)`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position`;
console.log("  users has", userCols.length, "columns:");
for (const c of userCols) console.log("    ", c.column_name, ":", c.data_type);

console.log("Done.");
