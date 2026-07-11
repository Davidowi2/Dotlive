import { spawn } from 'child_process';

(async () => {
  const root = 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main';
  const p = spawn('npx', ['drizzle-kit', 'check'], {
    cwd: root + '/dotlive-backend/apps/api',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  p.stdout.on('data', (d) => { out += d.toString(); });
  p.stderr.on('data', (d) => { out += d.toString(); });
  await new Promise((r) => p.on('close', r));
  const ok = out.includes('ok') || out.includes('No drift detected') || out.length < 40;
  console.log('MIGRATE: ' + (ok ? 'OK' : 'WARN'));
  if (!ok) console.log(out.slice(-1200));
  process.exit(0);
})().catch((e) => { console.log('MIGRATE: ERROR', e.message); process.exit(0); });
