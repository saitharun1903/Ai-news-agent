import { Redis } from "@upstash/redis";

// In-memory fallback cache if Upstash Redis is unconfigured or unreachable
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const memoryCache = new Map<string, CacheEntry<unknown>>();

let redisInstance: Redis | null = null;
let redisInitialized = false;

export function getRedisClient(): Redis | null {
  if (redisInitialized) return redisInstance;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    "";

  if (url && token && !url.includes("[SENSITIVE]")) {
    try {
      redisInstance = new Redis({
        url,
        token,
      });
    } catch (err) {
      console.warn("[Upstash] Failed to initialize Redis client; using in-memory cache:", err);
      redisInstance = null;
    }
  }

  redisInitialized = true;
  return redisInstance;
}

/**
 * Retrieve cached item from Upstash Redis or memory fallback.
 * Fails open: returns null on error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();

  if (client) {
    try {
      const data = await client.get<T>(key);
      if (data !== null && data !== undefined) {
        return data;
      }
    } catch (err) {
      console.warn(`[Upstash] cacheGet failed for key "${key}", failing open:`, err);
    }
  }

  // Fallback to in-memory cache
  const entry = memoryCache.get(key);
  if (entry) {
    if (Date.now() < entry.expiresAt) {
      return entry.value as T;
    }
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Store item in Upstash Redis and memory fallback with TTL in seconds.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> {
  // Always update memory fallback
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  const client = getRedisClient();
  if (client) {
    try {
      await client.set(key, value, { ex: ttlSeconds });
      return true;
    } catch (err) {
      console.warn(`[Upstash] cacheSet failed for key "${key}", failing open:`, err);
    }
  }

  return true;
}

/**
 * Delete key from Upstash Redis and memory cache.
 */
export async function cacheDel(key: string): Promise<boolean> {
  memoryCache.delete(key);

  const client = getRedisClient();
  if (client) {
    try {
      await client.del(key);
      return true;
    } catch (err) {
      console.warn(`[Upstash] cacheDel failed for key "${key}":`, err);
    }
  }

  return true;
}

/**
 * Cache key generators for Lunor
 */
export const CacheKeys = {
  newsHome: () => "news:home",
  newsCategory: (cat: string) => `news:category:${cat.toLowerCase()}`,
  newsTrending: () => "news:trending",
  researchTrending: () => "research:trending",
  researchRecommended: (userId: string, depth: string) =>
    `research:recommended:${userId}:${depth}`,
  search: (query: string) => `search:${query.trim().toLowerCase()}`,
  dailyBriefing: (date: string) => `briefing:daily:${date}`,
};
