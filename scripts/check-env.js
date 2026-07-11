import fs from 'node:fs';
import path from 'node:path';

const apiEnv = 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main/dotlive-backend/apps/api/.env';
const required = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'PORT', 'FRONTEND_URL'];
const missing = [];

if (!fs.existsSync(apiEnv)) {
  console.log('ENV: .env missing, expecting env vars via Render dashboard');
} else {
  const raw = fs.readFileSync(apiEnv, 'utf8');
  const env = Object.fromEntries(raw.split('\n').filter(Boolean).map(line => line.split('=')));
  for (const k of required) {
    if (!env[k] && !process.env[k]) missing.push(k);
  }
}

if (missing.length) {
  console.log('ENV: FAIL - missing: ' + missing.join(', '));
  process.exit(1);
}
console.log('ENV: OK');
process.exit(0);
