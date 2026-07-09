/**
 * Lightweight in-memory TTL cache.
 *
 * - No external dependency (no Redis required)
 * - Per-key TTL with periodic cleanup
 * - Bounded by max entries (LRU-ish — evicts when full)
 * - Safe for concurrent reads (single-threaded JS)
 *
 * Used to cache public/read-only endpoints:
 *   /api/feed, /api/leaderboard, /api/academy/courses,
 *   /api/ventures, /api/ventures/:id, etc.
 *
 * NOT used for user-private endpoints (notifications, wallet, stakes)
 * because those change per-user and per-mutation.
 */

type Entry<T> = { value: T; expires: number; inserted: number };

export class TTLCache<T = unknown> {
  private store = new Map<string, Entry<T>>();
  private sweeper: NodeJS.Timeout | null = null;

  constructor(
    private readonly name: string,
    private readonly opts: {
      maxEntries?: number;
      sweepIntervalMs?: number;
    } = {}
  ) {
    const interval = opts.sweepIntervalMs ?? 30_000;
    this.sweeper = setInterval(() => this.sweep(), interval);
    // Don't keep the process alive just for sweeping
    if (this.sweeper.unref) this.sweeper.unref();
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    const now = Date.now();
    this.store.set(key, { value, expires: now + ttlMs, inserted: now });
    // LRU-ish eviction
    const max = this.opts.maxEntries ?? 1000;
    if (this.store.size > max) {
      // Evict oldest 10% by insertion time
      const sorted = [...this.store.entries()].sort(
        (a, b) => a[1].inserted - b[1].inserted
      );
      const toRemove = Math.ceil(max * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.store.delete(sorted[i][0]);
      }
    }
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching prefix (use sparingly). */
  invalidatePrefix(prefix: string): number {
    let n = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        n++;
      }
    }
    return n;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private sweep(): void {
    const now = Date.now();
    let n = 0;
    for (const [key, entry] of this.store) {
      if (entry.expires < now) {
        this.store.delete(key);
        n++;
      }
    }
    if (n > 0) {
      // console.log(`[cache:${this.name}] swept ${n} expired entries`);
    }
  }

  stop(): void {
    if (this.sweeper) clearInterval(this.sweeper);
    this.sweeper = null;
  }
}

/**
 * Public-read cache singleton.
 * 60s default TTL — public data is acceptable to be 60s stale.
 */
export const publicCache = new TTLCache("public", { maxEntries: 500 });

/**
 * Per-user cache (short TTL — user private data).
 * Keyed by `${userId}:${endpoint}`.
 */
export const userCache = new TTLCache("user", {
  maxEntries: 2000,
  sweepIntervalMs: 60_000,
});

/** Cache key helper. */
export const k = (...parts: (string | number | undefined | null)[]) =>
  parts
    .filter((p) => p !== undefined && p !== null && p !== "")
    .map(String)
    .join("|");

/**
 * Fastify helper: try cache, fall through to handler on miss.
 * Cached payloads are returned as JSON responses.
 */
export function cached<T>(
  cache: TTLCache<T>,
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = cache.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  return loader().then((value) => {
    cache.set(key, value, ttlMs);
    return value;
  });
}

/**
 * Invalidate all keys in a cache starting with the given prefix.
 * Convenience wrapper around `cache.invalidatePrefix(...)` so callers
 * don't have to know which cache instance owns the key.
 */
export function invalidatePrefix(prefix: string): number {
  let n = 0;
  n += publicCache.invalidatePrefix(prefix);
  n += userCache.invalidatePrefix(prefix);
  return n;
}
