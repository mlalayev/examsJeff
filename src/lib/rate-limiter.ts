/**
 * Simple in-memory rate limiter for API routes
 * Prevents abuse and protects against excessive OpenAI API calls
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (now > entry.resetAt) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - User ID or IP address
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60 * 1000 // 1 minute default
  ): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetAt) {
      // First request or expired window - allow it
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return false;
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return true;
    }

    // Increment counter
    entry.count++;
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(
    identifier: string,
    maxRequests: number = 10
  ): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset in seconds
   */
  getResetTime(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return 0;
    }
    return Math.ceil((entry.resetAt - Date.now()) / 1000);
  }

  /**
   * Clear rate limit for an identifier (useful for testing)
   */
  clear(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;

/**
 * Middleware helper for Next.js API routes
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000
): { limited: boolean; remaining: number; resetIn: number } {
  const limited = rateLimiter.isRateLimited(userId, maxRequests, windowMs);
  const remaining = rateLimiter.getRemaining(userId, maxRequests);
  const resetIn = rateLimiter.getResetTime(userId);

  return { limited, remaining, resetIn };
}
