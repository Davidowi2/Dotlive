
import { neon } from "@neondatabase/serverless";
const db = neon(process.env.DATABASE_URL);

const cols = await db`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'user_bans'
  ORDER BY ordinal_position
`;
for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);
