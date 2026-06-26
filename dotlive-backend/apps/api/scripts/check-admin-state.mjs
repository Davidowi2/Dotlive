
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);

// Seed singleton
await db`
  INSERT INTO token_supply (id, max_supply_dot, total_minted_dot, total_burned_dot, updated_at)
  VALUES ('singleton', '100000000000', '500', '0', NOW())
  ON CONFLICT (id) DO NOTHING
`;

// Check current super admins
const superAdmins = await db`
  SELECT u.id, u.email, u.name, u.dot_id, ur.granted_at
  FROM user_roles ur
  JOIN users u ON u.id = ur.user_id
  WHERE ur.role = 'super_admin'
  ORDER BY ur.granted_at ASC
`;
console.log(`Current super_admins: ${superAdmins.length}`);
for (const a of superAdmins) console.log(`  ${a.email} (${a.name}) DOT:${a.dot_id}`);

// Check all users with admin role
const admins = await db`
  SELECT u.id, u.email, u.name
  FROM user_roles ur
  JOIN users u ON u.id = ur.user_id
  WHERE ur.role = 'admin'
  ORDER BY u.created_at ASC
`;
console.log(`\nAdmins: ${admins.length}`);
for (const a of admins) console.log(`  ${a.email} (${a.name})`);

// Total users
const users = await db`SELECT COUNT(*)::int AS n FROM users`;
const roles = await db`SELECT COUNT(*)::int AS n FROM user_roles`;
console.log(`\nUsers: ${users[0].n}, Role assignments: ${roles[0].n}`);

// Token supply state
const ts = await db`SELECT * FROM token_supply WHERE id = 'singleton'`;
console.log(`\nToken supply:`, JSON.stringify(ts[0], null, 2));
