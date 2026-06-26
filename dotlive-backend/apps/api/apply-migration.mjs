
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const db = neon(process.env.DATABASE_URL);
const sql = readFileSync("src/db/migrations/0005_lazy_silvermane.sql", "utf-8");
await db.query(sql);
console.log("Migration applied");
