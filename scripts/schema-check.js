import fs from 'node:fs';
import path from 'node:path';

(async () => {
  const root = 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main';
  const schemaPath = path.join(root, 'dotlive-backend/apps/api/src/db/schema.ts');
  const schemaRel = 'dotlive-backend/apps/api/src/db/schema.ts';
  if (!fs.existsSync(schemaPath)) {
    console.log('SCHEMA: WARN schema.ts missing');
    process.exit(0);
  }
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const tables = (schema.match(/export const \w+ = pgTable/g) || []).length;
  const countFromServer = (await import('fs')).existsSync
    ? (await Promise.resolve(fs.readFileSync(path.join(root, 'dotlive-backend/apps/api/src/server.ts'), 'utf8')))
    : '';
  const bootstrap = ('' + countFromServer).match(/createTableIfNotExists\(['"]([^'"]+)['"]/g) || [];
  console.log('SCHEMA: OK tables=' + tables + ' bootstrap_refs=' + bootstrap.length);
  process.exit(0);
})().catch((e) => { console.log('SCHEMA: ERROR', e.message); process.exit(0); });
