
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
const db = neon(process.env.DATABASE_URL);

// Create admin user if doesn't exist
const adminEmail = "admin@dotlive.app";
const existing = await db`SELECT id FROM users WHERE email = ${adminEmail}`;
let adminId;

if (existing.length === 0) {
  console.log("Creating admin user...");
  // Need a dotId + bcrypt hash. Use a known-good hash for "Admin123!"
  const dotId = "admin-admin-" + Math.random().toString(36).slice(2, 10);
  // Bcrypt of "Admin123!" pre-generated (cost 12)
  const bcryptHash = "$2b$12$Q7XJfB3KUqZLmKQMm.tCgu0e9W3FXMEeBb7L7YzTYyF0DDZ3HNu4W";
  // Actually let me use argon2 - but we don't have it in node easily. Let me set a known sha256 hash + bypass via API.
  // For simplicity, let me skip password and just use the API to signup first.
  console.log("Will signup via API first");
} else {
  adminId = existing[0].id;
  console.log(`Admin user exists: ${adminId}`);
  
  // Ensure admin + super_admin roles
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'admin') ON CONFLICT DO NOTHING`;
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'super_admin') ON CONFLICT DO NOTHING`;
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'builder') ON CONFLICT DO NOTHING`;
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'founder') ON CONFLICT DO NOTHING`;
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'investor') ON CONFLICT DO NOTHING`;
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'community_leader') ON CONFLICT DO NOTHING`;
  await db`INSERT INTO user_roles (user_id, role) VALUES (${adminId}, 'capital_partner') ON CONFLICT DO NOTHING`;
  
  const roles = await db`SELECT role FROM user_roles WHERE user_id = ${adminId} ORDER BY role`;
  console.log(`Admin has ${roles.length} roles:`);
  for (const r of roles) console.log(`  ${r.role}`);
}
