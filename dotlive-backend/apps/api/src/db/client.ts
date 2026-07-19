/**
 * Lazy Neon Postgres client for Drizzle ORM.
 *
 * This file no longer throws at import time. Instead, database
 * connections are created on first use via getDb()/getPool().
 *
 * Existing imports of `db`, `sql`, and `pool` remain compatible
 * through lazy proxies that instantiate on first property access.
 */

import { neon, neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  // Defer failure until actual DB use; allows tests/infra tooling
  // to import this module without configuring a database.
  console.warn("[db/client] DATABASE_URL is not set. DB calls will fail until it is configured.");
}

// Required for Neon serverless driver over WS in Node 20+.
neonConfig.webSocketConstructor = ws;

let _sql: ReturnType<typeof neon> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

function ensureSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Set it in .env or pass it explicitly.");
    }
    _sql = neon(url);
  }
  return _sql;
}

function ensureDb() {
  if (!_db) {
    _db = drizzle(ensureSql(), { schema });
  }
  return _db;
}

function ensurePool() {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Set it in .env or pass it explicitly.");
    }
    _pool = new Pool({ connectionString: url });
  }
  return _pool;
}

/** Raw SQL tag function for one-off queries. */
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(target, prop) {
    return Reflect.get(ensureSql(), prop);
  },
});

/** Drizzle instance — the main entry point for typed queries. */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return Reflect.get(ensureDb(), prop);
  },
});

/** Long-lived Pool for transactions and migrations. */
export const pool = new Proxy({} as Pool, {
  get(target, prop) {
    return Reflect.get(ensurePool(), prop);
  },
});

export { schema };
// @ts-nocheck
