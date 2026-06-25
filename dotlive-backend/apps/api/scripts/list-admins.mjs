
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);

const admins = await db`SELECT u.id, u.email, u.name, u.dot_id FROM users u JOIN user_roles r ON r.user_id = u.id WHERE r.role IN ('admin', 'super_admin') ORDER BY u.email`;
console.log(`Existing admins (${admins.length}):`);
for (const a of admins) console.log(`  ${a.email} - ${a.name} - ${a.dot_id} - ${a.id}`);

// List any existing users
const users = await db`SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 10`;
console.log(`\nRecent users:`);
for (const u of users) console.log(`  ${u.email} - ${u.name} - ${u.id}`);
