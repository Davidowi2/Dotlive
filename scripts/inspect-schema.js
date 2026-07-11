
import { Client } from '@neondatabase/serverless';
import fs from 'fs';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main/dotlive-backend/apps/api/.env' });

const sql = process.env.DATABASE_URL;
if (!sql) {
  console.error('[31mSCHEMA_FAIL:[0m DATABASE_URL missing.');
  process.exit(1);
}

const client = new Client({ connectionString: sql });
(async () => {
  await client.connect();
  const res = await client.sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`;
  const tables = res.rows.map((r) => r.table_name);
  console.log('[36mSCHEMA_TABLES:[0m', tables.length, tables.join(', '));
  const needs = new Set([
    'builder_certifications','builder_documents','builder_vouches',
    'community_challenges','community_challenge_submissions','connection_messages',
    'connections','dividend_payments','feed_comment_likes','loan_requests',
    'loan_votes','user_reputation'
  ]);
  const missing = [...needs].filter((t) => !tables.includes(t));
  if (missing.length) {
    console.error('[31mSCHEMA_FAIL:[0m Missing tables:', missing.join(', '));
    process.exit(1);
  }
  console.log('[32mSCHEMA_PASS:[0m All expected tables exist.');
  process.exit(0);
})().catch((e) => { console.error('[31mSCHEMA_FAIL:[0m', e.message); process.exit(1); })
  .finally(async () => { try { await client.end(); } catch {} });
