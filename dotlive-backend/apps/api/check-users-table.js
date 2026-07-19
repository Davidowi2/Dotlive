import { Client } from "pg";
import "dotenv/config";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Check if users table exists
const tableExists = await client.query(
  `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AS exists`
);
console.log("Users table exists:", tableExists.rows[0].exists);

if (tableExists.rows[0].exists) {
  // Get users table structure
  const columns = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log("\nUsers table columns:");
  columns.rows.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });
}

// List all tables
const tables = await client.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name
`);
console.log("\nAll tables in database:");
tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

await client.end();
