import { AnalyticsUtils, DateRange } from './analyticsUtils';
import type { PrismaClient } from '@prisma/client';

export interface RequestMetrics {
  pending: { count: number; urgent: number; overdue: number };
  processed: { today: number; week: number; month: number };
  conversion: {
    rate: number;
    averageTimeToConvert: number;
    topReasons: string[];
  };
}

/**
 * Service for request analytics and conversion tracking
 */
export class RequestAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive request metrics
   */
  async getRequestMetrics(
    today: DateRange,
    thisWeek: DateRange,
    thisMonth: DateRange
  ): Promise<RequestMetrics> {
    const [
      pending,
      urgent,
      processedToday,
      processedWeek,
      processedMonth,
      conversionRate,
      averageConversionTime
    ] = await Promise.all([
      this.getPendingRequestCount(),
      this.getUrgentRequestCount(),
      this.getProcessedRequestsForPeriod(today.start, today.end),
      this.getProcessedRequestsForPeriod(thisWeek.start, thisWeek.end),
      this.getProcessedRequestsForPeriod(thisMonth.start, thisMonth.end),
      this.getRequestConversionRate(),
      this.getAverageConversionTime()
    ]);

    return {
      pending: { 
        count: pending, 
        urgent, 
        overdue: urgent // Using urgent as proxy for overdue
      },
      processed: {
        today: processedToday,
        week: processedWeek,
        month: processedMonth
      },
      conversion: {
        rate: conversionRate,
        averageTimeToConvert: averageConversionTime,
        topReasons: ['Design complexity', 'Pricing', 'Availability']
      }
    };
  }

  /**
   * Get conversion rate for a specific period
   */
  async getConversionRateForPeriod(start: Date, end: Date): Promise<number> {
    const [requests, converted] = await Promise.all([
      this.prisma.tattooRequest.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),
      this.prisma.tattooRequest.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ['approved', 'in_progress', 'completed'] }
        }
      })
    ]);

    return requests > 0 ? (converted / requests) * 100 : 0;
  }

  /**
   * Get count of pending requests
   */
  private async getPendingRequestCount(): Promise<number> {
    return this.prisma.tattooRequest.count({
      where: { status: 'new' }
    });
  }

  /**
   * Get count of urgent requests (older than 7 days)
   */
  private async getUrgentRequestCount(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return this.prisma.tattooRequest.count({
      where: {
        status: 'new',
        createdAt: { lte: sevenDaysAgo }
      }
    });
  }

  /**
   * Get processed requests for a period
   */
  private async getProcessedRequestsForPeriod(start: Date, end: Date): Promise<number> {
    return this.prisma.tattooRequest.count({
      where: {
        status: { in: ['approved', 'rejected'] },
        updatedAt: { gte: start, lte: end }
      }
    });
  }

  /**
   * Get overall request conversion rate
   */
  private async getRequestConversionRate(): Promise<number> {
    const [total, converted] = await Promise.all([
      this.prisma.tattooRequest.count(),
      this.prisma.tattooRequest.count({
        where: { status: { in: ['approved', 'in_progress', 'completed'] } }
      })
    ]);

    return total > 0 ? (converted / total) * 100 : 0;
  }

  /**
   * Get average time to convert requests (in days)
   */
  private async getAverageConversionTime(): Promise<number> {
    const convertedRequests = await this.prisma.tattooRequest.findMany({
      where: {
        status: { in: ['approved', 'in_progress', 'completed'] }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (convertedRequests.length === 0) return 3.5; // Default value

    const conversionTimes = convertedRequests.map(request => {
      const timeDiff = request.updatedAt.getTime() - request.createdAt.getTime();
      return timeDiff / (1000 * 60 * 60 * 24); // Convert to days
    });

    return AnalyticsUtils.calculateAverage(conversionTimes);
  }
} 