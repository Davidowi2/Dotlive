import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(import.meta.dirname, '..', 'dotlive-backend', 'apps', 'api', '.env');
const env = readFileSync(envPath, 'utf8');
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const sql = neon(dbUrl);
const rows = await sql`SELECT token, email FROM magic_link_tokens WHERE email = 'magic-browser-test@example.com' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`;
if (rows[0]) {
  console.log('Magic link URL:');
  console.log('https://dotlive.cv/auth-callback?verify=' + rows[0].token);
} else {
  console.log('No token found');
}
