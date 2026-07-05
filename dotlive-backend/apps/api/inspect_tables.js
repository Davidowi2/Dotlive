const fs = require('fs');
const urlLine = fs.readFileSync('./.env', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='));
const url = urlLine.slice(12);

(async () => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(url);
    const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    const names = rows.map(r => r.table_name);
    const wanted = names.filter(n => n === 'community_challenge_submissions' || n === 'integration_secrets' || n.startsWith('feed_'));
    console.log(JSON.stringify({ total: names.length, wanted }));
  } catch (e) {
    console.log('ERR', e.message);
  }
})();
