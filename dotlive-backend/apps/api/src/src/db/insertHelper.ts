/**
 * Insert helper — works around Drizzle 0.33's strict type
 * narrowing for optional columns.
 *
 * Drizzle's `$inferInsert` only includes columns whose DB type
 * has `notNull()` AND no default. Optional columns (nullable,
 * no default) get excluded from the Insert type, which means
 * passing them in `.values({...} as any)` produces "unknown property"
 * errors even though the DB accepts them.
 *
 * The fix: use `satisfies NewX` to type-check the column
 * names, then cast to `any` only at the `.values()` boundary.
 *
 * Usage:
 *   import { ins } from "../db/insertHelper.js";
 *   await db.insert(services).values(ins({
 *     builderId: sub, title, description, category,
 *     priceDot: String(price), deliveryDays: 3,
 *   } satisfies NewService));
 */

export function ins<T extends Record<string, any>>(value: T): any {
  return value;
}

export function upd<T extends Record<string, any>>(value: T): any {
  return value;
}
