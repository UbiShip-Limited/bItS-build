/**
 * Client-side rate limiting to prevent abuse
 * Works in conjunction with server-side rate limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class ClientRateLimiter {
  private limits: Map<string, RequestRecord> = new Map();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if request is allowed
   */
  isAllowed(endpoint: string): boolean {
    const now = Date.now();
    const record = this.limits.get(endpoint);

    // No record exists, allow request
    if (!record) {
      this.limits.set(endpoint, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    // Check if window has expired
    if (now > record.resetTime) {
      // Reset the window
      this.limits.set(endpoint, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    // Within window, check count
    if (record.count >= this.config.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(endpoint: string): number {
    const record = this.limits.get(endpoint);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  /**
   * Clear rate limit for an endpoint
   */
  clear(endpoint?: string): void {
    if (endpoint) {
      this.limits.delete(endpoint);
    } else {
      this.limits.clear();
    }
  }
}

// Rate limit configurations for different endpoint types
const rateLimiters = {
  // Standard API calls
  standard: new ClientRateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minute
  }),

  // Authentication endpoints
  auth: new ClientRateLimiter({
    maxRequests: 5,
    windowMs: 5 * 60 * 1000 // 5 minutes
  }),

  // Public submission endpoints (tattoo requests)
  submission: new ClientRateLimiter({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000 // 1 hour
  }),

  // File uploads
  upload: new ClientRateLimiter({
    maxRequests: 10,
    windowMs: 10 * 60 * 1000 // 10 minutes
  })
};

/**
 * Check if API call is rate limited
 */
export function checkRateLimit(endpoint: string, type: keyof typeof rateLimiters = 'standard'): boolean {
  const limiter = rateLimiters[type];
  return limiter.isAllowed(endpoint);
}

/**
 * Get time until rate limit resets
 */
export function getRateLimitResetTime(endpoint: string, type: keyof typeof rateLimiters = 'standard'): number {
  const limiter = rateLimiters[type];
  return limiter.getResetTime(endpoint);
}

/**
 * Wrapper for fetch with rate limiting
 */
export async function rateLimitedFetch(
  url: string,
  options?: RequestInit,
  type: keyof typeof rateLimiters = 'standard'
): Promise<Response> {
  if (!checkRateLimit(url, type)) {
    const resetTime = getRateLimitResetTime(url, type);
    const seconds = Math.ceil(resetTime / 1000);
    throw new Error(`Rate limit exceeded. Please try again in ${seconds} seconds.`);
  }

  return fetch(url, options);
}