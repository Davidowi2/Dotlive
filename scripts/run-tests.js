import { spawn } from 'child_process';

const p = spawn('npm', ['test', '--', '--run'], {
  cwd: 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main',
  shell: true,
});

let out = '';
p.stdout.on('data', (d) => { out += d.toString(); });
p.stderr.on('data', (d) => { out += d.toString(); });

setTimeout(() => {
  const pass = (out.match(/PASS|Tests:/g) || []).length;
  const fail = (out.match(/FAIL/g) || []).length;
  console.log('TESTS: ' + (pass > 0 && fail === 0 ? 'OK' : `WARN passes=${pass} fails=${fail}`));
  if (out.length) console.log(out.slice(-1200));
  process.exit(0);
}, 120000);
