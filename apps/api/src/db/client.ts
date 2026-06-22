/**
 * Neon Postgres client for Drizzle ORM.
 *
 * We use @neondatabase/serverless which gives us:
 * - HTTP/WebSocket driver (no native pg dep, perfect for Render)
 * - A `neonConfig.webSocketConstructor` we point at `ws`
 *
 * For migrations we use the same pooler URL but with
 * `drizzle-kit push`, which talks directly via a node socket.
 */

import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Required for Neon serverless driver over WS in Node 20+.
neonConfig.webSocketConstructor = ws;

/** Raw SQL tag function for one-off queries. */
export const sql = neon(process.env.DATABASE_URL);

/** Drizzle instance — the main entry point for typed queries. */
export const db = drizzle(sql, { schema });

/** Long-lived Pool for transactions and migrations. */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export { schema };
// @ts-nocheck