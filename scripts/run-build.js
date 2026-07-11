
import { spawn } from 'child_process';

function run(cmd, args, label, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`[36m[${label}][0m ${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args, { cwd: cwd || 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main', shell: true, stdio: 'inherit' });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${label} exited ${code}`))));
  });
}

Promise.resolve()
  .then(() => run('npm', ['run', 'build'], 'BUILD'))
  .then(() => console.log('[32mBUILD_PASS:[0m Frontend build succeeded.'))
  .catch((e) => { console.error('[31mBUILD_FAIL:[0m', e.message); process.exit(1); });
