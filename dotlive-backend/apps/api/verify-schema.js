import { Client } from "pg";
import "dotenv/config";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const checks = [
  // Tables
  { type: "table", name: "loan_applications" },
  { type: "table", name: "loan_repayments" },
  { type: "table", name: "investor_profiles" },
  { type: "table", name: "capital_partner_profiles" },
  { type: "table", name: "platform_config" },
  { type: "table", name: "community_chat_messages" },
  { type: "table", name: "meeting_messages" },
  { type: "table", name: "moderation_reports" },
  
  // users columns
  { type: "column", table: "users", name: "two_factor_enabled" },
  { type: "column", table: "users", name: "two_factor_secret" },
  { type: "column", table: "users", name: "backup_codes" },
  { type: "column", table: "users", name: "loan_application_blocked" },
  { type: "column", table: "users", name: "vantage_test_prompted_at" },
  { type: "column", table: "users", name: "last_vantage_taken_at" },
  
  // founder_profiles columns
  { type: "column", table: "founder_profiles", name: "whatsapp_link" },
  { type: "column", table: "founder_profiles", name: "email_link" },
  { type: "column", table: "founder_profiles", name: "telegram_link" },
  { type: "column", table: "founder_profiles", name: "discord_link" },
  { type: "column", table: "founder_profiles", name: "pitch_deck_url" },
  
  // service_orders columns
  { type: "column", table: "service_orders", name: "escrow_status" },
  { type: "column", table: "service_orders", name: "delivered_at" },
  
  // user_roles columns
  { type: "column", table: "user_roles", name: "purchased_at" },
  { type: "column", table: "user_roles", name: "expires_at" },
  { type: "column", table: "user_roles", name: "grace_until" },
  { type: "column", table: "user_roles", name: "renewal_status" },
  
  // feed_posts column
  { type: "column", table: "feed_posts", name: "image_url" },
];

const results = [];
for (const check of checks) {
  if (check.type === "table") {
    const r = await client.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = $1) AS exists`,
      [check.name]
    );
    results.push({ ...check, exists: r.rows[0].exists });
  } else {
    const r = await client.query(
      `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2) AS exists`,
      [check.table, check.name]
    );
    results.push({ ...check, exists: r.rows[0].exists });
  }
}

console.log("=== SCHEMA VERIFICATION ===");
for (const r of results) {
  console.log(`${r.exists ? "✅" : "❌"} ${r.type}: ${r.table || ""}${r.table ? "." : ""}${r.name}`);
}
const missing = results.filter(r => !r.exists);
console.log(`\n${missing.length} missing items`);
if (missing.length > 0) {
  console.log("Missing:", JSON.stringify(missing, null, 2));
}

await client.end();
