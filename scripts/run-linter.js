import { spawn } from 'child_process';

function run(cmd, args, label) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main', shell: true });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.stderr.on('data', (d) => { out += d.toString(); });
    p.on('close', (code) => {
      const problems = (out.match(/\berror\b/gi) || []).length + (out.match(/warning/gi) || []).length;
      console.log(`${label}: ${code === 0 ? 'OK' : 'WARN'} (${problems} hits)`);
      resolve();
    });
  });
}

(async () => {
  await run('npx', ['eslint', 'src', '--ext', '.ts,.tsx', '--max-warnings=25'], 'LINT');
  console.log('LINT: done');
  process.exit(0);
})().catch((e) => { console.log('LINT: ERROR', e.message); process.exit(0); });
