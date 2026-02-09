/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution like @upstash/ratelimit
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  vote: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 votes per hour
  api: { max: 100, windowMs: 60 * 1000 }, // 100 requests per minute
} as const;

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limitType - Type of rate limit to apply
 * @returns Object with allowed status and remaining attempts
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = RATE_LIMITS[limitType];
  const now = Date.now();
  const key = `${identifier}:${limitType}`;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + limit.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: limit.max - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= limit.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limit.max - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown";
  return ip;
}

/**
 * Clean up expired entries periodically
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean up every minute
}
