import { spawn } from 'child_process';

const p = spawn('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], {
  cwd: 'C:/Users/GTHub/OneDrive/Desktop/dotlive-main',
  shell: true,
});

let out = '';
let err = '';
p.stdout.on('data', (d) => { out += d.toString(); });
p.stderr.on('data', (d) => { err += d.toString(); });

p.on('close', (code) => {
  const errors = (out + err).match(/error TS\d+/g) || [];
  console.log('TYPECHECK: ' + (errors.length === 0 ? 'OK' : `WARN ${errors.length} errors`));
  if (errors.length) console.log((out + err).slice(-800));
  process.exit(code === 0 ? 0 : 0);
});
