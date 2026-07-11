import { spawn } from 'child_process';

function run(dir, cmd, args, label) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: dir, shell: true });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.stderr.on('data', (d) => { out += d.toString(); });
    p.on('close', (code) => {
      const high = (out.match(/high/g) || []).length;
      const crit = (out.match(/critical/g) || []).length;
      const vulns = high + crit + (out.match(/moderate/g) || []).length;
      console.log(`${label}: ${code === 0 ? 'OK' : 'WARN'} (${vulns} advisory mentions)`);
      if (code !== 0) console.log(out.slice(-400));
      resolve();
    });
  });
}

(async () => {
  const root = 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main';
  const backend = root + '/dotlive-backend/apps/api';
  await run(root, 'npm', ['audit', '--audit-level=moderate'], 'FRONTEND_DEPS');
  await run(backend, 'npm', ['audit', '--audit-level=moderate'], 'BACKEND_DEPS');
  console.log('AUDIT: done');
  process.exit(0);
})().catch((e) => { console.log('AUDIT: ERROR', e.message); process.exit(0); });
