import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "./index";

// In-memory fallback sliding window rate limiter
interface HitRecord {
  timestamps: number[];
}
const memoryHits = new Map<string, HitRecord>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = memoryHits.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryHits.set(key, record);
  }

  // Filter out timestamps older than window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const reset = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.max(1, reset),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

// Lazy-initialized Upstash ratelimiters
let aiRatelimit: Ratelimit | null = null;
let searchRatelimit: Ratelimit | null = null;
let apiRatelimit: Ratelimit | null = null;

function getLimiter(type: "ai" | "search" | "api") {
  const redis = getRedisClient();
  if (!redis) return null;

  if (type === "ai") {
    if (!aiRatelimit) {
      aiRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(15, "60 s"),
        prefix: "ratelimit:ai",
      });
    }
    return aiRatelimit;
  }

  if (type === "search") {
    if (!searchRatelimit) {
      searchRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "60 s"),
        prefix: "ratelimit:search",
      });
    }
    return searchRatelimit;
  }

  if (!apiRatelimit) {
    apiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "60 s"),
      prefix: "ratelimit:api",
    });
  }
  return apiRatelimit;
}

/**
 * Check rate limit for a client identifier (e.g. IP or userId).
 * Fails open: returns success = true if Redis errors.
 */
export async function checkRateLimit(
  identifier: string,
  type: "ai" | "search" | "api" = "api"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = getLimiter(type);

  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (err) {
      console.warn(`[Upstash Ratelimit] Failed to check limit for ${identifier}, failing open:`, err);
      // Fall through to memory rate limiter
    }
  }

  // Use in-memory sliding window
  const limits = {
    ai: { limit: 15, windowMs: 60 * 1000 },
    search: { limit: 60, windowMs: 60 * 1000 },
    api: { limit: 120, windowMs: 60 * 1000 },
  }[type];

  return memoryRateLimit(`${type}:${identifier}`, limits.limit, limits.windowMs);
}
