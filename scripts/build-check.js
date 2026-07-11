import { spawn } from 'child_process';

function build(dir, label) {
  return new Promise((resolve) => {
    const p = spawn('npm', ['run', 'build'], { cwd: dir, shell: true });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.stderr.on('data', (d) => { out += d.toString(); });
    p.on('close', (code) => {
      console.log(`${label}: ${code === 0 ? 'OK' : 'FAIL'}`);
      if (code !== 0) console.log(out.slice(-1200));
      resolve();
    });
  });
}

(async () => {
  const root = 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main';
  const backend = root + '/dotlive-backend/apps/api';
  await build(root, 'BUILD_FRONTEND');
  await build(backend, 'BUILD_BACKEND');
  console.log('BUILD: done');
  process.exit(0);
})().catch((e) => { console.log('BUILD: ERROR', e.message); process.exit(0); });
