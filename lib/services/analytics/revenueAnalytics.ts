import { prisma } from '../../prisma/prisma';
import { AnalyticsUtils, DateRange } from './analyticsUtils';

export interface RevenueMetrics {
  today: { amount: number; trend: number; currency: string };
  week: { amount: number; trend: number; target: number };
  month: { amount: number; trend: number; forecast: number };
  breakdown: {
    consultations: number;
    tattoos: number;
    touchups: number;
    deposits: number;
  };
}

export interface RevenueBreakdown {
  totalRevenue: number;
  period: string;
  breakdown: {
    byPaymentType: Record<string, number>;
    byService: Record<string, number>;
    byMonth: Array<{ month: string; amount: number }>;
    byCustomerSegment: Record<string, number>;
  };
  trends: {
    growthRate: number;
    averageTransactionValue: number;
    transactionCount: number;
  };
}

/**
 * Service for revenue analytics and calculations
 */
export class RevenueAnalyticsService {
  /**
   * Get revenue for a specific period
   */
  async getRevenueForPeriod(start: Date, end: Date): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }

  /**
   * Get comprehensive revenue metrics
   */
  async getRevenueMetrics(
    today: DateRange,
    thisWeek: DateRange,
    thisMonth: DateRange,
    lastWeek: DateRange,
    lastMonth: DateRange
  ): Promise<RevenueMetrics> {
    const [
      todayRevenue,
      weekRevenue,
      monthRevenue,
      lastWeekRevenue,
      lastMonthRevenue,
      breakdown
    ] = await Promise.all([
      this.getRevenueForPeriod(today.start, today.end),
      this.getRevenueForPeriod(thisWeek.start, thisWeek.end),
      this.getRevenueForPeriod(thisMonth.start, thisMonth.end),
      this.getRevenueForPeriod(lastWeek.start, lastWeek.end),
      this.getRevenueForPeriod(lastMonth.start, lastMonth.end),
      this.getRevenueBreakdownByType(thisMonth.start, thisMonth.end)
    ]);

    const weekTrend = AnalyticsUtils.calculatePercentageChange(lastWeekRevenue, weekRevenue);
    const monthTrend = AnalyticsUtils.calculatePercentageChange(lastMonthRevenue, monthRevenue);

    return {
      today: { 
        amount: todayRevenue, 
        trend: 0, // Would need yesterday's data for trend
        currency: 'USD' 
      },
      week: { 
        amount: weekRevenue, 
        trend: weekTrend,
        target: weekRevenue * 1.1 // 10% growth target
      },
      month: { 
        amount: monthRevenue, 
        trend: monthTrend,
        forecast: monthRevenue * 1.05 // 5% forecast increase
      },
      breakdown
    };
  }

  /**
   * Get detailed revenue breakdown
   */
  async getRevenueBreakdown(period: string = 'month'): Promise<RevenueBreakdown> {
    const dateRange = AnalyticsUtils.getDateRange(period, new Date());
    
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: {
        customer: true
      }
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Breakdown by payment type
    const byPaymentType = payments.reduce((acc, payment) => {
      const type = payment.paymentType || 'other';
      acc[type] = (acc[type] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    // Breakdown by service (approximated from payment type)
    const byService = {
      consultations: byPaymentType['consultation'] || 0,
      drawings: byPaymentType['drawing_consultation'] || 0,
      tattoos: (byPaymentType['tattoo_deposit'] || 0) + (byPaymentType['tattoo_final'] || 0),
      other: byPaymentType['other'] || 0
    };

    // Monthly breakdown for trends
    const byMonth = await this.getMonthlyRevenue(dateRange);

    return {
      totalRevenue,
      period,
      breakdown: {
        byPaymentType,
        byService,
        byMonth,
        byCustomerSegment: await this.getRevenueByCustomerSegment()
      },
      trends: {
        growthRate: await this.calculateRevenueGrowthRate(period),
        averageTransactionValue: totalRevenue / payments.length || 0,
        transactionCount: payments.length
      }
    };
  }

  /**
   * Get revenue per hour calculation
   */
  async getRevenuePerHour(): Promise<number> {
    const totalRevenue = await this.getRevenueForPeriod(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    // Assuming 8 hours/day, 5 days/week, 4 weeks
    const workingHours = 8 * 5 * 4;
    return totalRevenue / workingHours;
  }

  /**
   * Get revenue breakdown by payment type for a period
   */
  private async getRevenueBreakdownByType(start: Date, end: Date): Promise<{
    consultations: number;
    tattoos: number;
    touchups: number;
    deposits: number;
  }> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: start, lte: end }
      }
    });

    const breakdown = {
      consultations: 0,
      tattoos: 0,
      touchups: 0,
      deposits: 0
    };

    payments.forEach(payment => {
      switch (payment.paymentType) {
        case 'consultation':
        case 'drawing_consultation':
          breakdown.consultations += payment.amount;
          break;
        case 'tattoo_deposit':
          breakdown.deposits += payment.amount;
          break;
        case 'tattoo_final':
          breakdown.tattoos += payment.amount;
          break;
        case 'touchup':
          breakdown.touchups += payment.amount;
          break;
      }
    });

    return breakdown;
  }

  /**
   * Get monthly revenue breakdown
   */
  private async getMonthlyRevenue(dateRange: DateRange): Promise<Array<{ month: string; amount: number }>> {
    // This is a simplified implementation - would need more complex logic for actual monthly breakdown
    const intervals = AnalyticsUtils.getDateIntervals(dateRange.start, dateRange.end, 'month');
    
    return Promise.all(
      intervals.map(async (interval) => ({
        month: interval.start.toISOString().split('T')[0],
        amount: await this.getRevenueForPeriod(interval.start, interval.end)
      }))
    );
  }

  /**
   * Get revenue by customer segment
   */
  private async getRevenueByCustomerSegment(): Promise<Record<string, number>> {
    // Simplified implementation - would need more complex customer segmentation logic
    return {
      new: 0,
      regular: 0,
      vip: 0
    };
  }

  /**
   * Calculate revenue growth rate for a period
   */
  private async calculateRevenueGrowthRate(period: string): Promise<number> {
    const currentRange = AnalyticsUtils.getDateRange(period, new Date());
    const previousRange = AnalyticsUtils.getDateRange(`last${period.charAt(0).toUpperCase() + period.slice(1)}`, new Date());
    
    const [currentRevenue, previousRevenue] = await Promise.all([
      this.getRevenueForPeriod(currentRange.start, currentRange.end),
      this.getRevenueForPeriod(previousRange.start, previousRange.end)
    ]);

    return AnalyticsUtils.calculatePercentageChange(previousRevenue, currentRevenue);
  }
} 