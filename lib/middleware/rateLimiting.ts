import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimitService {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  private readonly RATE_LIMITS = {
    // Payment-specific limits
    PAYMENT_CREATION: { limit: 5, window: 60 * 1000 }, // 5 payments per minute per user
    PAYMENT_LINKS: { limit: 10, window: 60 * 1000 }, // 10 payment links per minute per user
    REFUNDS: { limit: 3, window: 60 * 1000 }, // 3 refunds per minute per user
    
    // General endpoint categories
    AUTH: { limit: 10, window: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
    WRITE_HEAVY: { limit: 20, window: 60 * 1000 }, // 20 writes per minute
    READ_HEAVY: { limit: 60, window: 60 * 1000 }, // 60 reads per minute
    UPLOAD: { limit: 5, window: 60 * 1000 }, // 5 uploads per minute
    WEBHOOK: { limit: 100, window: 60 * 1000 }, // 100 webhook calls per minute
    PUBLIC_SUBMISSION: { limit: 3, window: 60 * 60 * 1000 }, // 3 submissions per hour (for tattoo requests)
    GENERAL: { limit: 100, window: 60 * 1000 } // 100 requests per minute per user
  };

  checkRateLimit(identifier: string, limitType: keyof typeof this.RATE_LIMITS): RateLimitInfo | false {
    const key = `${limitType}:${identifier}`;
    const limit = this.RATE_LIMITS[limitType];
    const now = Date.now();
    
    const existing = this.limits.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Reset or initialize counter
      this.limits.set(key, {
        count: 1,
        resetTime: now + limit.window
      });
      return {
        limit: limit.limit,
        remaining: limit.limit - 1,
        reset: Math.floor((now + limit.window) / 1000)
      };
    }

    if (existing.count >= limit.limit) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    existing.count++;
    return {
      limit: limit.limit,
      remaining: limit.limit - existing.count,
      reset: Math.floor(existing.resetTime / 1000)
    };
  }

  getRateLimitInfo(identifier: string, limitType: keyof typeof this.RATE_LIMITS): RateLimitInfo {
    const key = `${limitType}:${identifier}`;
    const limit = this.RATE_LIMITS[limitType];
    const existing = this.limits.get(key);
    const now = Date.now();
    
    if (!existing || now > existing.resetTime) {
      return {
        limit: limit.limit,
        remaining: limit.limit,
        reset: Math.floor((now + limit.window) / 1000)
      };
    }
    
    return {
      limit: limit.limit,
      remaining: Math.max(0, limit.limit - existing.count),
      reset: Math.floor(existing.resetTime / 1000)
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

const rateLimitService = new RateLimitService();

// Cleanup every 5 minutes
setInterval(() => rateLimitService.cleanup(), 5 * 60 * 1000);

// Generic rate limit middleware
export function rateLimit(limitType: keyof typeof rateLimitService['RATE_LIMITS'] = 'GENERAL') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const identifier = request.user?.id || request.ip;
    
    const rateLimitInfo = rateLimitService.checkRateLimit(identifier, limitType);
    
    if (rateLimitInfo === false) {
      // Get current rate limit info for headers
      const info = rateLimitService.getRateLimitInfo(identifier, limitType);
      
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', info.limit.toString());
      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', info.reset.toString());
      reply.header('Retry-After', Math.max(1, info.reset - Math.floor(Date.now() / 1000)).toString());
      
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: info.reset
      });
    }
    
    // Set rate limit headers for successful requests
    reply.header('X-RateLimit-Limit', rateLimitInfo.limit.toString());
    reply.header('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    reply.header('X-RateLimit-Reset', rateLimitInfo.reset.toString());
  };
}

// Legacy function name for backward compatibility
export const paymentRateLimit = rateLimit;

// Specific rate limit functions for common use cases
export const authRateLimit = () => rateLimit('AUTH');
export const writeRateLimit = () => rateLimit('WRITE_HEAVY');
export const readRateLimit = () => rateLimit('READ_HEAVY');
export const uploadRateLimit = () => rateLimit('UPLOAD');
export const webhookRateLimit = () => rateLimit('WEBHOOK');
export const publicSubmissionRateLimit = () => rateLimit('PUBLIC_SUBMISSION');

export { rateLimitService }; 