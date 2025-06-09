import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimitService {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  private readonly RATE_LIMITS = {
    PAYMENT_CREATION: { limit: 5, window: 60 * 1000 }, // 5 payments per minute per user
    PAYMENT_LINKS: { limit: 10, window: 60 * 1000 }, // 10 payment links per minute per user
    REFUNDS: { limit: 3, window: 60 * 1000 }, // 3 refunds per minute per user
    GENERAL: { limit: 100, window: 60 * 1000 } // 100 requests per minute per user
  };

  checkRateLimit(identifier: string, limitType: keyof typeof this.RATE_LIMITS): boolean {
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
      return true;
    }

    if (existing.count >= limit.limit) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    existing.count++;
    return true;
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

export function paymentRateLimit(limitType: keyof typeof rateLimitService['RATE_LIMITS'] = 'GENERAL') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const identifier = request.user?.id || request.ip;
    
    if (!rateLimitService.checkRateLimit(identifier, limitType)) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60
      });
    }
  };
}

export { rateLimitService }; 