import { Client } from "pg";
import { readFileSync } from "fs";
import "dotenv/config";

const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  console.log("Connected to database");
  
  const migration = readFileSync("./migrations/add-missing-profile-tables.sql", "utf8");
  console.log("Applying migration...");
  
  await client.query(migration);
  console.log("✅ Migration applied successfully!");
  
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
