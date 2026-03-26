/**
 * Enhanced rate limiter with IP-based tracking and login attempt protection
 * Production-grade implementation with slowdown and lockout features
 * 
 * For multi-server deployments, consider migrating to Redis-based solution
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  firstAttempt: number;
}

interface LoginAttemptEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

class EnhancedRateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private loginAttempts: Map<string, LoginAttemptEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean rate limit entries
      for (const [key, entry] of this.requests.entries()) {
        if (now > entry.resetAt) {
          this.requests.delete(key);
        }
      }
      
      // Clean login attempt entries older than 1 hour
      for (const [key, entry] of this.loginAttempts.entries()) {
        if (now - entry.lastAttempt > 3600000) {
          this.loginAttempts.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get client identifier (IP address) from request
   */
  getClientIdentifier(request: NextRequest | Request): string {
    if (request instanceof NextRequest) {
      // Try to get real IP from headers (considering proxies)
      const forwarded = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const cfConnectingIp = request.headers.get("cf-connecting-ip");
      
      // Cloudflare IP
      if (cfConnectingIp) return cfConnectingIp;
      
      // Real IP from Nginx
      if (realIp) return realIp;
      
      // X-Forwarded-For (take first IP)
      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      
      // Fallback to connection IP
      return request.ip || "unknown";
    }
    
    // Standard Request object
    const headers = request.headers;
    const forwarded = headers.get("x-forwarded-for");
    const realIp = headers.get("x-real-ip");
    const cfConnectingIp = headers.get("cf-connecting-ip");
    
    if (cfConnectingIp) return cfConnectingIp;
    if (realIp) return realIp;
    if (forwarded) return forwarded.split(",")[0].trim();
    
    return "unknown";
  }

  /**
   * Check if a request should be rate limited
   */
  isRateLimited(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60 * 1000
  ): { limited: boolean; remaining: number; resetIn: number; retryAfter: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetAt) {
      // First request or expired window
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
        firstAttempt: now,
      });
      return { limited: false, remaining: maxRequests - 1, resetIn: windowMs, retryAfter: 0 };
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const resetIn = Math.ceil((entry.resetAt - now) / 1000);
      return { limited: true, remaining: 0, resetIn, retryAfter: resetIn };
    }

    // Increment counter
    entry.count++;
    const remaining = maxRequests - entry.count;
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);
    
    return { limited: false, remaining, resetIn, retryAfter: 0 };
  }

  /**
   * Track failed login attempt with exponential backoff
   * Returns locked status and seconds until unlock
   */
  trackFailedLogin(identifier: string): { locked: boolean; unlockIn: number; attempts: number } {
    const now = Date.now();
    const entry = this.loginAttempts.get(identifier);

    if (!entry) {
      // First failed attempt
      this.loginAttempts.set(identifier, {
        failedAttempts: 1,
        lockedUntil: null,
        lastAttempt: now,
      });
      return { locked: false, unlockIn: 0, attempts: 1 };
    }

    // Check if account is locked
    if (entry.lockedUntil && now < entry.lockedUntil) {
      const unlockIn = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, unlockIn, attempts: entry.failedAttempts };
    }

    // Reset lock if expired
    if (entry.lockedUntil && now >= entry.lockedUntil) {
      entry.failedAttempts = 1;
      entry.lockedUntil = null;
      entry.lastAttempt = now;
      return { locked: false, unlockIn: 0, attempts: 1 };
    }

    // Increment failed attempts
    entry.failedAttempts++;
    entry.lastAttempt = now;

    // Apply exponential lockout
    // 5 attempts = 1 min, 10 attempts = 5 min, 15 attempts = 15 min, 20+ = 1 hour
    let lockoutDuration = 0;
    if (entry.failedAttempts >= 20) {
      lockoutDuration = 60 * 60 * 1000; // 1 hour
    } else if (entry.failedAttempts >= 15) {
      lockoutDuration = 15 * 60 * 1000; // 15 minutes
    } else if (entry.failedAttempts >= 10) {
      lockoutDuration = 5 * 60 * 1000; // 5 minutes
    } else if (entry.failedAttempts >= 5) {
      lockoutDuration = 60 * 1000; // 1 minute
    }

    if (lockoutDuration > 0) {
      entry.lockedUntil = now + lockoutDuration;
      const unlockIn = Math.ceil(lockoutDuration / 1000);
      return { locked: true, unlockIn, attempts: entry.failedAttempts };
    }

    return { locked: false, unlockIn: 0, attempts: entry.failedAttempts };
  }

  /**
   * Check if login is currently locked
   */
  isLoginLocked(identifier: string): { locked: boolean; unlockIn: number; attempts: number } {
    const now = Date.now();
    const entry = this.loginAttempts.get(identifier);

    if (!entry || !entry.lockedUntil) {
      return { locked: false, unlockIn: 0, attempts: entry?.failedAttempts || 0 };
    }

    if (now < entry.lockedUntil) {
      const unlockIn = Math.ceil((entry.lockedUntil - now) / 1000);
      return { locked: true, unlockIn, attempts: entry.failedAttempts };
    }

    return { locked: false, unlockIn: 0, attempts: entry.failedAttempts };
  }

  /**
   * Reset failed login attempts (call on successful login)
   */
  resetLoginAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, maxRequests: number = 10): number {
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
   * Clear rate limit for an identifier (admin/testing only)
   */
  clear(identifier: string): void {
    this.requests.delete(identifier);
    this.loginAttempts.delete(identifier);
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
    this.loginAttempts.clear();
  }
}

// Singleton instance
const rateLimiter = new EnhancedRateLimiter();

// Cleanup on process termination
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => rateLimiter.destroy());
  process.on("SIGINT", () => rateLimiter.destroy());
}

export default rateLimiter;

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  AUTH: {
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || "5"),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || "300000"),
  },
  AI: {
    max: parseInt(process.env.RATE_LIMIT_AI_MAX || "10"),
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS || "60000"),
  },
  UPLOAD: {
    max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || "20"),
    windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS || "60000"),
  },
  API: {
    max: parseInt(process.env.RATE_LIMIT_API_MAX || "100"),
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || "60000"),
  },
  ADMIN: {
    max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || "30"),
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || "60000"),
  },
};

/**
 * Middleware helper for API routes with automatic response
 */
export async function applyRateLimit(
  request: NextRequest | Request,
  preset: keyof typeof RateLimitPresets = "API"
): Promise<NextResponse | null> {
  const clientId = rateLimiter.getClientIdentifier(request);
  const config = RateLimitPresets[preset];
  const result = rateLimiter.isRateLimited(clientId, config.max, config.windowMs);

  if (result.limited) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": result.retryAfter.toString(),
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetIn.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Check login attempts before authentication
 */
export async function checkLoginAttempts(
  request: NextRequest | Request
): Promise<NextResponse | null> {
  const clientId = rateLimiter.getClientIdentifier(request);
  const lockStatus = rateLimiter.isLoginLocked(clientId);

  if (lockStatus.locked) {
    return NextResponse.json(
      {
        error: "Account temporarily locked",
        message: `Too many failed login attempts. Please try again in ${lockStatus.unlockIn} seconds.`,
        retryAfter: lockStatus.unlockIn,
        attempts: lockStatus.attempts,
      },
      {
        status: 429,
        headers: {
          "Retry-After": lockStatus.unlockIn.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Track failed login (call when login fails)
 */
export function trackFailedLogin(request: NextRequest | Request): void {
  const clientId = rateLimiter.getClientIdentifier(request);
  rateLimiter.trackFailedLogin(clientId);
}

/**
 * Reset login attempts (call on successful login)
 */
export function resetLoginAttempts(request: NextRequest | Request): void {
  const clientId = rateLimiter.getClientIdentifier(request);
  rateLimiter.resetLoginAttempts(clientId);
}
