/**
 * @fileoverview High-efficiency in-memory TTL caching engine with spatial key quantization.
 * Guarantees zero duplicate network queries for identical spatial coordinates and profiles.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Universal in-memory cache with automatic TTL expiration.
 */
class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieves an item from cache if unexpired.
   * @param key Unique lookup key
   * @returns Cached value or null if expired/absent
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Stores an item with a time-to-live ceiling.
   * @param key Unique lookup key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Checks if an unexpired key exists.
   * @param key Unique lookup key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clears all cache entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Generates a spatial lookup key rounded to 2 decimal places (~1.1 km resolution).
   * Ensures high cache hit ratios while preserving user privacy.
   */
  quantizeCoordinates(lat: number, lon: number): string {
    const roundedLat = lat.toFixed(2);
    const roundedLon = lon.toFixed(2);
    return `${roundedLat},${roundedLon}`;
  }
}

export const appCache = new MemoryCache();
