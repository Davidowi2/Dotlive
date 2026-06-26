
import { neon } from "@neondatabase/serverless";
const db = neon(process.env.DATABASE_URL);

const email = 'browserverify@test.com';
const [u] = await db`SELECT id FROM users WHERE email = ${email}`;
if (!u) { console.log('user not found'); process.exit(1); }

await db`
  INSERT INTO user_roles (user_id, role) VALUES (${u.id}, 'capital_partner')
  ON CONFLICT DO NOTHING
`;
await db`
  INSERT INTO user_roles (user_id, role) VALUES (${u.id}, 'investor')
  ON CONFLICT DO NOTHING
`;

const [bal] = await db`SELECT balance FROM wallets WHERE user_id = ${u.id}`;
console.log(`User ${email} (id=${u.id})`);
console.log(`  roles: ${(await db`SELECT role FROM user_roles WHERE user_id = ${u.id}`).map(r => r.role).join(', ')}`);
console.log(`  wallet balance: ${bal?.balance ?? 0} DOT`);

// Give them some DOT to be a realistic CP
await db`
  UPDATE wallets SET balance = balance + 50000, updated_at = NOW()
  WHERE user_id = ${u.id}
`;
console.log(`  ✓ Added 50,000 DOT for testing`);

const [bal2] = await db`SELECT balance FROM wallets WHERE user_id = ${u.id}`;
console.log(`  wallet balance now: ${bal2.balance} DOT`);
