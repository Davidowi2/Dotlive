
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);

const email = process.argv[2];
const user = await db`SELECT id FROM users WHERE email = ${email}`;
if (user.length === 0) {
  console.error("User not found:", email);
  process.exit(1);
}
const userId = user[0].id;

// Grant all roles including admin + super_admin
const allRoles = ["admin", "super_admin", "builder", "founder", "investor", "community_leader", "capital_partner"];
for (const role of allRoles) {
  await db`INSERT INTO user_roles (user_id, role) VALUES (${userId}, ${role}) ON CONFLICT DO NOTHING`;
  console.log(`  ✓ Granted: ${role}`);
}

const roles = await db`SELECT role FROM user_roles WHERE user_id = ${userId} ORDER BY role`;
console.log(`\nUser ${email} now has ${roles.length} roles:`);
for (const r of roles) console.log(`  ${r.role}`);
console.log(`\nUser ID: ${userId}`);
