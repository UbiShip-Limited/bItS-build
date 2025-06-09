
import { PrismaClient } from '@prisma/client';
import SquareClient from '../square/index';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PaymentCacheData {
  payments: unknown[];
  total: number;
  lastUpdated: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class PaymentCacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private rateLimitTracker: Map<string, RateLimitEntry> = new Map();
  private readonly CACHE_TTL = {
    PAYMENTS_LIST: 5 * 60 * 1000, // 5 minutes
    PAYMENT_DETAILS: 10 * 60 * 1000, // 10 minutes
    CUSTOMER_PAYMENTS: 3 * 60 * 1000, // 3 minutes
    ANALYTICS: 15 * 60 * 1000 // 15 minutes
  };
  
  private readonly RATE_LIMITS = {
    SQUARE_API: { limit: 100, window: 60 * 1000 }, // 100 requests per minute
    PAYMENT_PROCESSING: { limit: 10, window: 60 * 1000 }, // 10 payments per minute per customer
    WEBHOOK_PROCESSING: { limit: 500, window: 60 * 1000 } // 500 webhook events per minute
  };

  constructor(
    private prisma: PrismaClient,
    private squareClient: ReturnType<typeof SquareClient.fromEnv>
  ) {}

  /**
   * Get cached payments list with intelligent cache invalidation
   */
  async getCachedPayments(
    cacheKey: string,
    fetcher: () => Promise<PaymentCacheData>
  ): Promise<PaymentCacheData> {
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data as PaymentCacheData;
    }

    // Check if we're being rate limited before making the request
    if (!this.checkRateLimit('SQUARE_API', 'global')) {
      // If rate limited, return stale cache if available
      if (cached) {
        return cached.data as PaymentCacheData;
      }
      throw new Error('Rate limit exceeded and no cached data available');
    }

    try {
      const data = await fetcher();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL.PAYMENTS_LIST
      });

      return data;
    } catch (error) {
      // On error, return stale cache if available
      if (cached) {
        console.warn('Returning stale cache due to error:', error.message);
        return cached.data as PaymentCacheData;
      }
      throw error;
    }
  }

  /**
   * Intelligent cache invalidation for payment-related data
   */
  invalidatePaymentCache(customerId?: string, paymentId?: string) {
    const keysToInvalidate: string[] = [];

    // Invalidate general payment caches
    keysToInvalidate.push('payments:all', 'payments:recent', 'analytics:payments');

    // Invalidate customer-specific caches
    if (customerId) {
      keysToInvalidate.push(`payments:customer:${customerId}`);
    }

    // Invalidate specific payment cache
    if (paymentId) {
      keysToInvalidate.push(`payment:${paymentId}`);
    }

    keysToInvalidate.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * Rate limiting implementation to prevent Square API abuse
   */
  checkRateLimit(limitType: keyof typeof this.RATE_LIMITS, identifier: string): boolean {
    const key = `${limitType}:${identifier}`;
    const limit = this.RATE_LIMITS[limitType];
    const now = Date.now();
    
    const existing = this.rateLimitTracker.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Reset or initialize counter
      this.rateLimitTracker.set(key, {
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

  /**
   * Background payment synchronization with Square
   */
  async backgroundSyncPayments(): Promise<void> {
    try {
      console.log('Starting background payment sync with Square...');
      
      if (!this.checkRateLimit('SQUARE_API', 'background-sync')) {
        console.warn('Skipping background sync due to rate limit');
        return;
      }

      // Get recent payments from Square
      const squarePayments = await this.squareClient.getPayments(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        new Date().toISOString(),
        undefined,
        50
      );

      if (!squarePayments.result?.payments) {
        return;
      }

      let syncedCount = 0;
      const processPromises = squarePayments.result.payments.map(async (squarePayment) => {
        if (squarePayment.status !== 'COMPLETED') return;

        const existingPayment = await this.prisma.payment.findUnique({
          where: { squareId: squarePayment.id }
        });

        if (!existingPayment && squarePayment.referenceId) {
          await this.prisma.payment.create({
            data: {
              amount: Number(squarePayment.amountMoney?.amount || 0) / 100,
              status: 'completed',
              paymentMethod: squarePayment.sourceType || 'unknown',
              squareId: squarePayment.id,
              referenceId: squarePayment.referenceId,
              paymentDetails: JSON.parse(JSON.stringify(squarePayment))
            }
          });
          syncedCount++;
        }
      });

      await Promise.all(processPromises);
      
      // Invalidate relevant caches after sync
      this.invalidatePaymentCache();
      
      console.log(`Background sync completed. Synced ${syncedCount} new payments.`);
    } catch (error) {
      console.error('Background payment sync failed:', error);
    }
  }

  /**
   * Asynchronous webhook processing with queue-like behavior
   */
  async processWebhookAsync(eventData: { event_id?: string; type?: string; data?: unknown }): Promise<void> {
    const eventId = eventData.event_id || 'unknown';
    
    if (!this.checkRateLimit('WEBHOOK_PROCESSING', 'global')) {
      console.warn(`Webhook ${eventId} skipped due to rate limit`);
      return;
    }

    // Process in background without blocking the webhook response
    setImmediate(async () => {
      try {
        await this.processWebhookEvent(eventData);
        
        // Invalidate relevant caches
        if (eventData.type?.startsWith('payment.')) {
          this.invalidatePaymentCache();
        }
      } catch (error) {
        console.error(`Async webhook processing failed for ${eventId}:`, error);
        
        // Log to audit for debugging
        await this.prisma.auditLog.create({
          data: {
            action: 'webhook_processing_failed',
            resource: 'webhook',
            resourceId: eventId,
            details: {
              error: error.message,
              eventType: eventData.type
            }
          }
        }).catch(dbError => {
          console.error('Failed to log webhook error:', dbError);
        });
      }
    });
  }

  /**
   * Get payment analytics with caching
   */
  async getPaymentAnalytics(startDate: Date, endDate: Date) {
    const cacheKey = `analytics:payments:${startDate.getTime()}-${endDate.getTime()}`;
    
    return this.getCachedPayments(cacheKey, async () => {
      const [payments, revenue, paymentsByType] = await Promise.all([
        this.prisma.payment.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'completed'
          }
        }),
        this.prisma.payment.aggregate({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'completed'
          },
          _sum: { amount: true }
        }),
        this.prisma.payment.groupBy({
          by: ['paymentType'],
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'completed'
          },
          _count: true,
          _sum: { amount: true }
        })
      ]);

      return {
        payments: [],
        total: payments,
        revenue: revenue._sum.amount || 0,
        paymentsByType,
        lastUpdated: Date.now()
      };
    });
  }

  /**
   * Cleanup expired cache entries and rate limit trackers
   */
  cleanupCache(): void {
    const now = Date.now();
    
    // Clean expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
      }
    }

    // Clean expired rate limit entries
    for (const [key, entry] of this.rateLimitTracker.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitTracker.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isCacheValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      rateLimitTrackers: this.rateLimitTracker.size,
      memoryUsage: process.memoryUsage()
    };
  }

  private isCacheValid(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private async processWebhookEvent(eventData: { type?: string; data?: unknown }): Promise<void> {
    // This would contain the actual webhook processing logic
    // For now, it's a placeholder that could be extended
    
    switch (eventData.type) {
      case 'payment.created':
      case 'payment.updated':
        await this.handlePaymentWebhook(eventData.data);
        break;
      case 'invoice.payment_made':
        await this.handleInvoiceWebhook(eventData.data);
        break;
      default:
        console.log(`Unhandled webhook type: ${eventData.type}`);
    }
  }

  private async handlePaymentWebhook(data: unknown): Promise<void> {
    // Implementation for payment webhook handling
    // This would update local payment records
  }

  private async handleInvoiceWebhook(data: unknown): Promise<void> {
    // Implementation for invoice webhook handling
    // This would update local invoice records
  }
} 