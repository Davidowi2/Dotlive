import https from 'node:https';

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 200) }));
    }).on('error', (e) => resolve({ error: e.message }));
  });
}

(async () => {
  const health = await get('https://dotlive-api.onrender.com/health');
  const wallet = await get('https://dotlive.cv/wallet');
  console.log('SMOKE: API=' + (health.status === 200 ? 'OK' : health.status === 404 ? 'WARN' : 'FAIL') + ' FRONTEND=' + (wallet.status === 200 ? 'OK' : 'FAIL'));
  if (health.status) console.log('API status=' + health.status);
  if (wallet.status) console.log('FRONTEND status=' + wallet.status);
  process.exit(0);
})().catch((e) => { console.log('SMOKE: ERROR', e.message); process.exit(0); });
