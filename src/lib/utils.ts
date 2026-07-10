import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize any value to an array. Handles all the ways a backend response can
 * be malformed without crashing the UI:
 *   - Already an array → returned as-is
 *   - Object with a known array property (e.g. `{ slots: [...] }`,
 *     `{ meetings: [...] }`, `{ data: [...] }`) → returns the inner array
 *   - Object with an `items` / `results` / `list` property → returns the inner array
 *   - Anything else (null, undefined, string, number, plain object) → returns []
 *
 * This exists because `T.filter is not a function` was firing on /meetings
 * when the backend returned a wrapped object instead of a flat array. The
 * fix is enforced at the API boundary so the page never sees a non-iterable.
 */
export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["slots", "meetings", "items", "results", "list", "data"]) {
      const inner = obj[key];
      if (Array.isArray(inner)) return inner as T[];
    }
  }
  return [];
}
