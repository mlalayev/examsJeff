/**
 * Centralized configuration for AI API rate limits
 * 
 * Adjust these values based on your needs:
 * - Increase limits if users complain they're too strict
 * - Decrease limits if experiencing abuse or server issues
 * - Different limits for different user roles (optional)
 */

export const RATE_LIMITS = {
  /**
   * AI Writing Scoring
   * Used by: /api/attempts/[attemptId]/writing/ai-score
   */
  AI_WRITING_SCORE: {
    maxRequests: 10,          // Maximum requests allowed
    windowMs: 60 * 1000,      // Time window (1 minute)
    description: 'AI writing scoring endpoint',
  },

  /**
   * AI Speaking Scoring
   * Used by: /api/attempts/[attemptId]/speaking/ai-score
   */
  AI_SPEAKING_SCORE: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    description: 'AI speaking scoring endpoint',
  },

  /**
   * Audio Transcription
   * Used by: /api/attempts/[attemptId]/speaking/transcribe
   * Note: More lenient since transcription is faster/cheaper
   */
  AUDIO_TRANSCRIBE: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    description: 'Audio transcription endpoint',
  },

  /**
   * Generic AI Writing Score
   * Used by: /api/ai-writing-score
   */
  GENERIC_AI_SCORE: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    description: 'Generic AI writing score endpoint',
  },
};

/**
 * OpenAI Client Configuration
 */
export const OPENAI_CONFIG = {
  timeout: 60000,           // 60 seconds timeout
  maxRetries: 3,            // Retry failed requests 3 times
};

/**
 * Route Configuration
 */
export const ROUTE_CONFIG = {
  maxDuration: 60,          // Maximum execution time in seconds (Vercel/Netlify limit)
};

/**
 * Role-based rate limits (optional - for future enhancement)
 * Uncomment and customize if you want different limits per role
 */
// export const ROLE_RATE_LIMITS = {
//   STUDENT: {
//     AI_WRITING_SCORE: { maxRequests: 5, windowMs: 60 * 1000 },
//     AI_SPEAKING_SCORE: { maxRequests: 5, windowMs: 60 * 1000 },
//   },
//   TEACHER: {
//     AI_WRITING_SCORE: { maxRequests: 20, windowMs: 60 * 1000 },
//     AI_SPEAKING_SCORE: { maxRequests: 20, windowMs: 60 * 1000 },
//   },
//   ADMIN: {
//     AI_WRITING_SCORE: { maxRequests: 50, windowMs: 60 * 1000 },
//     AI_SPEAKING_SCORE: { maxRequests: 50, windowMs: 60 * 1000 },
//   },
// };

/**
 * Helper function to get rate limit for an endpoint
 */
export function getRateLimit(endpoint: keyof typeof RATE_LIMITS) {
  return RATE_LIMITS[endpoint];
}

/**
 * Helper function to format rate limit for display
 */
export function formatRateLimit(limit: { maxRequests: number; windowMs: number }): string {
  const windowSeconds = limit.windowMs / 1000;
  const windowMinutes = windowSeconds / 60;
  
  if (windowMinutes >= 1) {
    return `${limit.maxRequests} requests per ${windowMinutes} minute${windowMinutes > 1 ? 's' : ''}`;
  }
  
  return `${limit.maxRequests} requests per ${windowSeconds} second${windowSeconds > 1 ? 's' : ''}`;
}

/**
 * Example usage:
 * 
 * import { RATE_LIMITS, getRateLimit } from '@/lib/rate-limit-config';
 * 
 * const limit = getRateLimit('AI_WRITING_SCORE');
 * const check = checkRateLimit(userId, limit.maxRequests, limit.windowMs);
 */
