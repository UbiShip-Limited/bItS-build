import { cacheService } from './cacheService';
import {
  AnalyticsUtils,
  RevenueAnalyticsService,
  AppointmentAnalyticsService,
  CustomerAnalyticsService,
  RequestAnalyticsService,
  BusinessAnalyticsService,
  type RevenueBreakdown,
  type CustomerSegment,
  type BusinessTrends,
  type PredictiveMetrics
} from './analytics';

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

/**
 * Main Analytics Service - Coordinates all analytics modules
 * Provides comprehensive analytics for the admin dashboard
 */
export class AnalyticsService {
  private revenueService = new RevenueAnalyticsService();
  private appointmentService = new AppointmentAnalyticsService();
  private customerService = new CustomerAnalyticsService();
  private requestService = new RequestAnalyticsService();
  private businessService = new BusinessAnalyticsService();
  
  /**
   * Get comprehensive dashboard metrics (cached for 5 minutes)
   */
  async getDashboardMetrics(timeframe: string = 'current'): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_metrics_${timeframe}`;
    
    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();
      const today = AnalyticsUtils.getDateRange('today', now);
      const thisWeek = AnalyticsUtils.getDateRange('week', now);
      const thisMonth = AnalyticsUtils.getDateRange('month', now);
      const lastWeek = AnalyticsUtils.getDateRange('lastWeek', now);
      const lastMonth = AnalyticsUtils.getDateRange('lastMonth', now);

      // Execute all metrics queries in parallel for better performance
      const [
        revenueMetrics,
        appointmentMetrics,
        customerMetrics,
        requestMetrics,
        businessMetrics
      ] = await Promise.all([
        this.revenueService.getRevenueMetrics(today, thisWeek, thisMonth, lastWeek, lastMonth),
        this.appointmentService.getAppointmentMetrics(today, thisWeek, thisMonth),
        this.customerService.getCustomerMetrics(today, thisWeek, thisMonth),
        this.requestService.getRequestMetrics(today, thisWeek, thisMonth),
        this.businessService.getBusinessMetrics(thisWeek, thisMonth)
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
    return this.revenueService.getRevenueBreakdown(period);
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments(): Promise<CustomerSegment[]> {
    return this.customerService.getCustomerSegments();
  }

  /**
   * Get business trends over time
   */
  async getBusinessTrends(period: string = 'month'): Promise<BusinessTrends> {
    return this.businessService.getBusinessTrends(period);
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveMetrics(): Promise<PredictiveMetrics> {
    return this.businessService.getPredictiveMetrics();
  }
} 