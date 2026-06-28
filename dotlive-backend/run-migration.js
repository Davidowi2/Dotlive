#!/usr/bin/env node
/**
 * Run a SQL migration against the production Neon DB.
 * Usage: node run-migration.js <path-to-sql>
 */
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node run-migration.js <sql-file>");
    process.exit(1);
  }
  const sql = fs.readFileSync(file, "utf8");

  // Lazy-load the DB client so the env var is set first.
  const { pool } = require("./apps/api/dist/db/client.js");

  console.log(`Running migration: ${file}`);
  await pool.query(sql);
  console.log("✓ Migration applied");
  await pool.end();
}

main().catch((e) => {
  console.error("✗ Migration failed:", e.message);
  process.exit(1);
});