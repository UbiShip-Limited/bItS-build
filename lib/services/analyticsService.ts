import { prisma } from '../prisma/prisma';
import { BookingStatus, BookingType } from '../types/booking';
import { ValidationError, NotFoundError } from './errors';
import { cacheService } from './cacheService';

export interface DashboardMetrics {
  revenue: {
    today: { amount: number; trend: number; currency: string };
    week: { amount: number; trend: number; target: number };
    month: { amount: number; trend: number; forecast: number };
    breakdown: {
      consultations: number;
      tattoos: number;
      touchups: number;
      deposits: number;
    };
  };
  appointments: {
    today: { count: number; completed: number; remaining: number };
    week: { scheduled: number; completed: number; cancelled: number };
    metrics: {
      averageDuration: number;
      conversionRate: number;
      noShowRate: number;
      rebookingRate: number;
    };
  };
  customers: {
    total: number;
    new: { today: number; week: number; month: number };
    returning: { rate: number; avgTimeBetweenVisits: number };
    segments: {
      newCustomers: number;
      regularCustomers: number;
      vipCustomers: number;
    };
    lifetime: {
      averageValue: number;
      topSpender: { name: string; value: number };
    };
  };
  requests: {
    pending: { count: number; urgent: number; overdue: number };
    processed: { today: number; week: number; month: number };
    conversion: {
      rate: number;
      averageTimeToConvert: number;
      topReasons: string[];
    };
  };
  business: {
    efficiency: {
      bookingUtilization: number;
      revenuePerHour: number;
      customerSatisfaction: number;
    };
    growth: {
      customerGrowthRate: number;
      revenueGrowthRate: number;
      appointmentGrowthRate: number;
    };
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

export interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  totalRevenue: number;
  averageValue: number;
  criteria: Record<string, any>;
}

export interface BusinessTrends {
  period: string;
  revenue: Array<{ date: string; amount: number }>;
  appointments: Array<{ date: string; count: number }>;
  customers: Array<{ date: string; new: number; returning: number }>;
  conversion: Array<{ date: string; rate: number }>;
}

export interface PredictiveMetrics {
  revenueForcast: {
    nextMonth: number;
    confidence: number;
    factors: string[];
  };
  customerGrowth: {
    expectedNew: number;
    expectedChurn: number;
    netGrowth: number;
  };
  capacity: {
    utilizationTrend: number;
    recommendedBookings: number;
    peakHours: string[];
  };
}

/**
 * Analytics Service for business intelligence and dashboard metrics
 * Provides comprehensive analytics for the admin dashboard
 */
export class AnalyticsService {
  
  /**
   * Get comprehensive dashboard metrics (cached for 5 minutes)
   */
  async getDashboardMetrics(timeframe: string = 'current'): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_metrics_${timeframe}`;
    
    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();
      const today = this.getDateRange('today', now);
      const thisWeek = this.getDateRange('week', now);
      const thisMonth = this.getDateRange('month', now);
      const lastWeek = this.getDateRange('lastWeek', now);
      const lastMonth = this.getDateRange('lastMonth', now);

      // Execute all metrics queries in parallel for better performance
      const [
        revenueMetrics,
        appointmentMetrics,
        customerMetrics,
        requestMetrics,
        businessMetrics
      ] = await Promise.all([
        this.getRevenueMetrics(today, thisWeek, thisMonth, lastWeek, lastMonth),
        this.getAppointmentMetrics(today, thisWeek, thisMonth),
        this.getCustomerMetrics(today, thisWeek, thisMonth),
        this.getRequestMetrics(today, thisWeek, thisMonth),
        this.getBusinessMetrics(thisWeek, thisMonth)
      ]);

      return {
        revenue: revenueMetrics,
        appointments: appointmentMetrics,
        customers: customerMetrics,
        requests: requestMetrics,
        business: businessMetrics
      };
    }, 300); // Cache for 5 minutes
  }

  /**
   * Get detailed revenue breakdown
   */
  async getRevenueBreakdown(period: string = 'month'): Promise<RevenueBreakdown> {
    const dateRange = this.getDateRange(period, new Date());
    
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
        byCustomerSegment: await this.getRevenueByCustomerSegment(dateRange)
      },
      trends: {
        growthRate: await this.calculateRevenueGrowthRate(period),
        averageTransactionValue: totalRevenue / payments.length || 0,
        transactionCount: payments.length
      }
    };
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments(): Promise<CustomerSegment[]> {
    const customers = await prisma.customer.findMany({
      include: {
        payments: {
          where: { status: 'completed' }
        },
        appointments: true
      }
    });

    const segments: CustomerSegment[] = [];

    // New customers (less than 30 days, no completed payments)
    const newCustomers = customers.filter(c => {
      const daysSinceCreated = (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 30 && c.payments.length === 0;
    });

    // Regular customers (1-3 completed payments)
    const regularCustomers = customers.filter(c => 
      c.payments.length >= 1 && c.payments.length <= 3
    );

    // VIP customers (4+ completed payments or $1000+ total spent)
    const vipCustomers = customers.filter(c => {
      const totalSpent = c.payments.reduce((sum, p) => sum + p.amount, 0);
      return c.payments.length >= 4 || totalSpent >= 1000;
    });

    segments.push(
      {
        id: 'new',
        name: 'New Customers',
        count: newCustomers.length,
        totalRevenue: 0,
        averageValue: 0,
        criteria: { daysSinceCreated: '<=30', payments: 0 }
      },
      {
        id: 'regular',
        name: 'Regular Customers',
        count: regularCustomers.length,
        totalRevenue: regularCustomers.reduce((sum, c) => 
          sum + c.payments.reduce((pSum, p) => pSum + p.amount, 0), 0),
        averageValue: regularCustomers.length > 0 ? 
          regularCustomers.reduce((sum, c) => 
            sum + c.payments.reduce((pSum, p) => pSum + p.amount, 0), 0) / regularCustomers.length : 0,
        criteria: { payments: '1-3' }
      },
      {
        id: 'vip',
        name: 'VIP Customers',
        count: vipCustomers.length,
        totalRevenue: vipCustomers.reduce((sum, c) => 
          sum + c.payments.reduce((pSum, p) => pSum + p.amount, 0), 0),
        averageValue: vipCustomers.length > 0 ?
          vipCustomers.reduce((sum, c) => 
            sum + c.payments.reduce((pSum, p) => pSum + p.amount, 0), 0) / vipCustomers.length : 0,
        criteria: { payments: '>=4', totalSpent: '>=1000' }
      }
    );

    return segments;
  }

  /**
   * Get business trends over time
   */
  async getBusinessTrends(period: string = 'month'): Promise<BusinessTrends> {
    const dateRange = this.getDateRange(period, new Date());
    const intervals = this.getDateIntervals(dateRange.start, dateRange.end, period);

    const revenue = await Promise.all(
      intervals.map(async (interval) => ({
        date: interval.start.toISOString().split('T')[0],
        amount: await this.getRevenueForPeriod(interval.start, interval.end)
      }))
    );

    const appointments = await Promise.all(
      intervals.map(async (interval) => ({
        date: interval.start.toISOString().split('T')[0],
        count: await this.getAppointmentCountForPeriod(interval.start, interval.end)
      }))
    );

    const customers = await Promise.all(
      intervals.map(async (interval) => {
        const newCount = await this.getNewCustomerCountForPeriod(interval.start, interval.end);
        const returningCount = await this.getReturningCustomerCountForPeriod(interval.start, interval.end);
        return {
          date: interval.start.toISOString().split('T')[0],
          new: newCount,
          returning: returningCount
        };
      })
    );

    const conversion = await Promise.all(
      intervals.map(async (interval) => ({
        date: interval.start.toISOString().split('T')[0],
        rate: await this.getConversionRateForPeriod(interval.start, interval.end)
      }))
    );

    return {
      period,
      revenue,
      appointments,
      customers,
      conversion
    };
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveMetrics(): Promise<PredictiveMetrics> {
    // Simple predictive model based on historical trends
    const lastThreeMonths = await this.getBusinessTrends('quarter');
    
    // Revenue forecast based on growth trend
    const revenueAmounts = lastThreeMonths.revenue.map(r => r.amount);
    const avgGrowthRate = this.calculateGrowthRate(revenueAmounts);
    const lastMonthRevenue = revenueAmounts[revenueAmounts.length - 1] || 0;
    
    // Customer growth prediction
    const customerData = lastThreeMonths.customers;
    const avgNewCustomers = customerData.reduce((sum, c) => sum + c.new, 0) / customerData.length;
    const churnEstimate = avgNewCustomers * 0.1; // Assume 10% churn rate
    
    // Capacity utilization
    const appointmentCounts = lastThreeMonths.appointments.map(a => a.count);
    const avgAppointments = appointmentCounts.reduce((sum, c) => sum + c, 0) / appointmentCounts.length;
    const utilizationTrend = this.calculateGrowthRate(appointmentCounts);

    return {
      revenueForcast: {
        nextMonth: lastMonthRevenue * (1 + avgGrowthRate),
        confidence: Math.min(90, Math.max(50, 80 - Math.abs(avgGrowthRate * 100))),
        factors: ['Historical growth trend', 'Seasonal adjustments', 'Customer retention']
      },
      customerGrowth: {
        expectedNew: Math.round(avgNewCustomers),
        expectedChurn: Math.round(churnEstimate),
        netGrowth: Math.round(avgNewCustomers - churnEstimate)
      },
      capacity: {
        utilizationTrend: Math.round(utilizationTrend * 100),
        recommendedBookings: Math.round(avgAppointments * 1.1),
        peakHours: ['2:00 PM', '3:00 PM', '4:00 PM'] // This would be calculated from actual appointment data
      }
    };
  }

  // Private helper methods
  private getDateRange(period: string, referenceDate: Date): { start: Date; end: Date } {
    const date = new Date(referenceDate);
    const start = new Date(date);
    const end = new Date(date);

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = date.getDay();
        start.setDate(date.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        const lastWeekStart = new Date(date);
        lastWeekStart.setDate(date.getDate() - date.getDay() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(date);
        lastMonthStart.setMonth(date.getMonth() - 1);
        lastMonthStart.setDate(1);
        lastMonthStart.setHours(0, 0, 0, 0);
        const lastMonthEnd = new Date(lastMonthStart);
        lastMonthEnd.setMonth(lastMonthStart.getMonth() + 1);
        lastMonthEnd.setDate(0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'quarter':
        const quarterStart = new Date(date);
        quarterStart.setMonth(date.getMonth() - 3);
        quarterStart.setDate(1);
        quarterStart.setHours(0, 0, 0, 0);
        return { start: quarterStart, end: date };
    }

    return { start, end };
  }

  private async getRevenueMetrics(today: any, thisWeek: any, thisMonth: any, lastWeek: any, lastMonth: any) {
    const todayRevenue = await this.getRevenueForPeriod(today.start, today.end);
    const weekRevenue = await this.getRevenueForPeriod(thisWeek.start, thisWeek.end);
    const monthRevenue = await this.getRevenueForPeriod(thisMonth.start, thisMonth.end);
    const lastWeekRevenue = await this.getRevenueForPeriod(lastWeek.start, lastWeek.end);
    const lastMonthRevenue = await this.getRevenueForPeriod(lastMonth.start, lastMonth.end);

    const weekTrend = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;
    const monthTrend = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Get breakdown by payment type
    const breakdown = await this.getRevenueBreakdownByType(thisMonth.start, thisMonth.end);

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

  private async getAppointmentMetrics(today: any, thisWeek: any, thisMonth: any) {
    const todayAppointments = await prisma.appointment.count({
      where: {
        startTime: { gte: today.start, lte: today.end }
      }
    });

    const todayCompleted = await prisma.appointment.count({
      where: {
        startTime: { gte: today.start, lte: today.end },
        status: BookingStatus.COMPLETED
      }
    });

    const weekStats = await this.getAppointmentStatsForPeriod(thisWeek.start, thisWeek.end);
    
    return {
      today: {
        count: todayAppointments,
        completed: todayCompleted,
        remaining: todayAppointments - todayCompleted
      },
      week: weekStats,
      metrics: await this.getAppointmentEfficiencyMetrics()
    };
  }

  private async getCustomerMetrics(today: any, thisWeek: any, thisMonth: any) {
    const totalCustomers = await prisma.customer.count();
    
    const newToday = await prisma.customer.count({
      where: { createdAt: { gte: today.start, lte: today.end } }
    });
    
    const newThisWeek = await prisma.customer.count({
      where: { createdAt: { gte: thisWeek.start, lte: thisWeek.end } }
    });
    
    const newThisMonth = await prisma.customer.count({
      where: { createdAt: { gte: thisMonth.start, lte: thisMonth.end } }
    });

    const segments = await this.getCustomerSegments();
    const lifetimeMetrics = await this.getCustomerLifetimeMetrics();

    return {
      total: totalCustomers,
      new: {
        today: newToday,
        week: newThisWeek,
        month: newThisMonth
      },
      returning: await this.getReturningCustomerMetrics(),
      segments: {
        newCustomers: segments.find(s => s.id === 'new')?.count || 0,
        regularCustomers: segments.find(s => s.id === 'regular')?.count || 0,
        vipCustomers: segments.find(s => s.id === 'vip')?.count || 0
      },
      lifetime: lifetimeMetrics
    };
  }

  private async getRequestMetrics(today: any, thisWeek: any, thisMonth: any) {
    const pending = await prisma.tattooRequest.count({
      where: { status: 'new' }
    });

    const urgent = await prisma.tattooRequest.count({
      where: {
        status: 'new',
        createdAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
      }
    });

    const processedToday = await prisma.tattooRequest.count({
      where: {
        status: { in: ['approved', 'rejected'] },
        updatedAt: { gte: today.start, lte: today.end }
      }
    });

    const conversionRate = await this.getRequestConversionRate();

    return {
      pending: { count: pending, urgent, overdue: urgent },
      processed: {
        today: processedToday,
        week: await this.getProcessedRequestsForPeriod(thisWeek.start, thisWeek.end),
        month: await this.getProcessedRequestsForPeriod(thisMonth.start, thisMonth.end)
      },
      conversion: {
        rate: conversionRate,
        averageTimeToConvert: await this.getAverageConversionTime(),
        topReasons: ['Design complexity', 'Pricing', 'Availability']
      }
    };
  }

  private async getBusinessMetrics(thisWeek: any, thisMonth: any) {
    const utilization = await this.getBookingUtilization();
    const revenuePerHour = await this.getRevenuePerHour();
    const growthMetrics = await this.getGrowthMetrics();

    return {
      efficiency: {
        bookingUtilization: utilization,
        revenuePerHour,
        customerSatisfaction: 4.5 // This would come from actual feedback data
      },
      growth: growthMetrics
    };
  }

  // Additional helper methods would be implemented here
  private async getRevenueForPeriod(start: Date, end: Date): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }

  private async getAppointmentCountForPeriod(start: Date, end: Date): Promise<number> {
    return prisma.appointment.count({
      where: {
        startTime: { gte: start, lte: end }
      }
    });
  }

  private async getNewCustomerCountForPeriod(start: Date, end: Date): Promise<number> {
    return prisma.customer.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    });
  }

  private async getReturningCustomerCountForPeriod(start: Date, end: Date): Promise<number> {
    // Customers who had appointments in this period but were created before
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: start, lte: end },
        customerId: { not: null }
      },
      include: { customer: true }
    });

    const returningCustomers = appointments.filter(apt => 
      apt.customer && apt.customer.createdAt < start
    );

    return new Set(returningCustomers.map(apt => apt.customerId)).size;
  }

  private async getConversionRateForPeriod(start: Date, end: Date): Promise<number> {
    const requests = await prisma.tattooRequest.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    });

    const converted = await prisma.tattooRequest.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: { in: ['approved', 'in_progress', 'completed'] }
      }
    });

    return requests > 0 ? (converted / requests) * 100 : 0;
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0] || 1;
    const last = values[values.length - 1] || 0;
    
    return (last - first) / first;
  }

  private getDateIntervals(start: Date, end: Date, period: string): Array<{ start: Date; end: Date }> {
    const intervals: Array<{ start: Date; end: Date }> = [];
    const current = new Date(start);
    
    while (current < end) {
      const intervalStart = new Date(current);
      const intervalEnd = new Date(current);
      
      if (period === 'month' || period === 'quarter') {
        intervalEnd.setDate(intervalEnd.getDate() + 7); // Weekly intervals
      } else {
        intervalEnd.setDate(intervalEnd.getDate() + 1); // Daily intervals
      }
      
      if (intervalEnd > end) {
        intervalEnd.setTime(end.getTime());
      }
      
      intervals.push({ start: intervalStart, end: intervalEnd });
      current.setTime(intervalEnd.getTime() + 1);
    }
    
    return intervals;
  }

  // Placeholder methods - would implement full logic
  private async getRevenueBreakdownByType(start: Date, end: Date): Promise<any> {
    return {
      consultations: 0,
      tattoos: 0,
      touchups: 0,
      deposits: 0
    };
  }

  private async getAppointmentStatsForPeriod(start: Date, end: Date): Promise<any> {
    return {
      scheduled: 0,
      completed: 0,
      cancelled: 0
    };
  }

  private async getAppointmentEfficiencyMetrics(): Promise<any> {
    return {
      averageDuration: 120,
      conversionRate: 85,
      noShowRate: 5,
      rebookingRate: 15
    };
  }

  private async getReturningCustomerMetrics(): Promise<any> {
    return {
      rate: 65,
      avgTimeBetweenVisits: 45
    };
  }

  private async getCustomerLifetimeMetrics(): Promise<any> {
    return {
      averageValue: 450,
      topSpender: { name: "Anonymous", value: 1200 }
    };
  }

  private async getProcessedRequestsForPeriod(start: Date, end: Date): Promise<number> {
    return prisma.tattooRequest.count({
      where: {
        status: { in: ['approved', 'rejected'] },
        updatedAt: { gte: start, lte: end }
      }
    });
  }

  private async getRequestConversionRate(): Promise<number> {
    const total = await prisma.tattooRequest.count();
    const converted = await prisma.tattooRequest.count({
      where: { status: { in: ['approved', 'in_progress', 'completed'] } }
    });
    return total > 0 ? (converted / total) * 100 : 0;
  }

  private async getAverageConversionTime(): Promise<number> {
    // Average days from request to approval
    return 3.5;
  }

  private async getBookingUtilization(): Promise<number> {
    // Percentage of available time slots that are booked
    return 75;
  }

  private async getRevenuePerHour(): Promise<number> {
    const totalRevenue = await this.getRevenueForPeriod(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    // Assuming 8 hours/day, 5 days/week, 4 weeks
    const workingHours = 8 * 5 * 4;
    return totalRevenue / workingHours;
  }

  private async getGrowthMetrics(): Promise<any> {
    return {
      customerGrowthRate: 15,
      revenueGrowthRate: 12,
      appointmentGrowthRate: 18
    };
  }

  private async getMonthlyRevenue(dateRange: any): Promise<Array<{ month: string; amount: number }>> {
    // Implementation for monthly revenue breakdown
    return [];
  }

  private async getRevenueByCustomerSegment(dateRange: any): Promise<Record<string, number>> {
    // Implementation for revenue by customer segment
    return {};
  }

  private async calculateRevenueGrowthRate(period: string): Promise<number> {
    // Implementation for revenue growth rate calculation
    return 0;
  }
} 