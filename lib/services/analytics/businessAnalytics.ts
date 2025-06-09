import { AnalyticsUtils } from './analyticsUtils';
import { RevenueAnalyticsService } from './revenueAnalytics';
import { AppointmentAnalyticsService } from './appointmentAnalytics';
import { CustomerAnalyticsService } from './customerAnalytics';
import { RequestAnalyticsService } from './requestAnalytics';

export interface BusinessMetrics {
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
 * Service for business analytics, growth tracking, and predictive metrics
 */
export class BusinessAnalyticsService {
  private revenueService = new RevenueAnalyticsService();
  private appointmentService = new AppointmentAnalyticsService();
  private customerService = new CustomerAnalyticsService();
  private requestService = new RequestAnalyticsService();

  /**
   * Get comprehensive business metrics
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const [utilization, revenuePerHour, growthMetrics] = await Promise.all([
      this.appointmentService.getBookingUtilization(),
      this.revenueService.getRevenuePerHour(),
      this.getGrowthMetrics()
    ]);

    return {
      efficiency: {
        bookingUtilization: utilization,
        revenuePerHour,
        customerSatisfaction: 4.5 // This would come from actual feedback data
      },
      growth: growthMetrics
    };
  }

  /**
   * Get business trends over time
   */
  async getBusinessTrends(period: string = 'month'): Promise<BusinessTrends> {
    const dateRange = AnalyticsUtils.getDateRange(period, new Date());
    const intervals = AnalyticsUtils.getDateIntervals(dateRange.start, dateRange.end, period);

    const [revenue, appointments, customers, conversion] = await Promise.all([
      this.getRevenueTrends(intervals),
      this.getAppointmentTrends(intervals),
      this.getCustomerTrends(intervals),
      this.getConversionTrends(intervals)
    ]);

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
    const avgGrowthRate = AnalyticsUtils.calculateGrowthRate(revenueAmounts);
    const lastMonthRevenue = revenueAmounts[revenueAmounts.length - 1] || 0;
    
    // Customer growth prediction
    const customerData = lastThreeMonths.customers;
    const avgNewCustomers = customerData.length > 0 
      ? AnalyticsUtils.calculateAverage(customerData.map(c => c.new))
      : 0;
    const churnEstimate = avgNewCustomers * 0.1; // Assume 10% churn rate
    
    // Capacity utilization
    const appointmentCounts = lastThreeMonths.appointments.map(a => a.count);
    const avgAppointments = AnalyticsUtils.calculateAverage(appointmentCounts);
    const utilizationTrend = AnalyticsUtils.calculateGrowthRate(appointmentCounts);

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

  /**
   * Get growth metrics for customers, revenue, and appointments
   */
  private async getGrowthMetrics(): Promise<{
    customerGrowthRate: number;
    revenueGrowthRate: number;
    appointmentGrowthRate: number;
  }> {
    const now = new Date();
    const thisMonth = AnalyticsUtils.getDateRange('month', now);
    const lastMonth = AnalyticsUtils.getDateRange('lastMonth', now);

    const [
      thisMonthCustomers,
      lastMonthCustomers,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthAppointments,
      lastMonthAppointments
    ] = await Promise.all([
      this.customerService.getNewCustomerCountForPeriod(thisMonth.start, thisMonth.end),
      this.customerService.getNewCustomerCountForPeriod(lastMonth.start, lastMonth.end),
      this.revenueService.getRevenueForPeriod(thisMonth.start, thisMonth.end),
      this.revenueService.getRevenueForPeriod(lastMonth.start, lastMonth.end),
      this.appointmentService.getAppointmentCountForPeriod(thisMonth.start, thisMonth.end),
      this.appointmentService.getAppointmentCountForPeriod(lastMonth.start, lastMonth.end)
    ]);

    return {
      customerGrowthRate: AnalyticsUtils.calculatePercentageChange(lastMonthCustomers, thisMonthCustomers),
      revenueGrowthRate: AnalyticsUtils.calculatePercentageChange(lastMonthRevenue, thisMonthRevenue),
      appointmentGrowthRate: AnalyticsUtils.calculatePercentageChange(lastMonthAppointments, thisMonthAppointments)
    };
  }

  /**
   * Get revenue trends for intervals
   */
  private async getRevenueTrends(intervals: Array<{ start: Date; end: Date }>): Promise<Array<{ date: string; amount: number }>> {
    return Promise.all(
      intervals.map(async (interval) => ({
        date: interval.start.toISOString().split('T')[0],
        amount: await this.revenueService.getRevenueForPeriod(interval.start, interval.end)
      }))
    );
  }

  /**
   * Get appointment trends for intervals
   */
  private async getAppointmentTrends(intervals: Array<{ start: Date; end: Date }>): Promise<Array<{ date: string; count: number }>> {
    return Promise.all(
      intervals.map(async (interval) => ({
        date: interval.start.toISOString().split('T')[0],
        count: await this.appointmentService.getAppointmentCountForPeriod(interval.start, interval.end)
      }))
    );
  }

  /**
   * Get customer trends for intervals
   */
  private async getCustomerTrends(intervals: Array<{ start: Date; end: Date }>): Promise<Array<{ date: string; new: number; returning: number }>> {
    return Promise.all(
      intervals.map(async (interval) => {
        const [newCount, returningCount] = await Promise.all([
          this.customerService.getNewCustomerCountForPeriod(interval.start, interval.end),
          this.customerService.getReturningCustomerCountForPeriod(interval.start, interval.end)
        ]);
        
        return {
          date: interval.start.toISOString().split('T')[0],
          new: newCount,
          returning: returningCount
        };
      })
    );
  }

  /**
   * Get conversion trends for intervals
   */
  private async getConversionTrends(intervals: Array<{ start: Date; end: Date }>): Promise<Array<{ date: string; rate: number }>> {
    return Promise.all(
      intervals.map(async (interval) => ({
        date: interval.start.toISOString().split('T')[0],
        rate: await this.requestService.getConversionRateForPeriod(interval.start, interval.end)
      }))
    );
  }
} 