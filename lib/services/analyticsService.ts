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
  private revenueService: RevenueAnalyticsService;
  private appointmentService: AppointmentAnalyticsService;
  private customerService: CustomerAnalyticsService;
  private requestService: RequestAnalyticsService;
  private businessService: BusinessAnalyticsService;

  constructor(private prisma: any) {
    this.revenueService = new RevenueAnalyticsService(prisma);
    this.appointmentService = new AppointmentAnalyticsService(prisma);
    this.customerService = new CustomerAnalyticsService(prisma);
    this.requestService = new RequestAnalyticsService(prisma);
    this.businessService = new BusinessAnalyticsService(prisma);
  }
  
  /**
   * Get comprehensive dashboard metrics (cached for 5 minutes)
   */
  async getDashboardMetrics(timeframe: string = 'today'): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_metrics_${timeframe}`;
    
    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();
      
      // Calculate date ranges based on the timeframe parameter
      let selectedRange = AnalyticsUtils.getDateRange(timeframe, now);
      
      // Always calculate these for comparison metrics
      const today = AnalyticsUtils.getDateRange('today', now);
      const thisWeek = AnalyticsUtils.getDateRange('week', now);
      const thisMonth = AnalyticsUtils.getDateRange('month', now);
      const lastWeek = AnalyticsUtils.getDateRange('lastWeek', now);
      const lastMonth = AnalyticsUtils.getDateRange('lastMonth', now);

      // Execute all metrics queries in parallel with error handling
      const [
        revenueMetrics,
        appointmentMetrics,
        customerMetrics,
        requestMetrics,
        businessMetrics
      ] = await Promise.allSettled([
        this.revenueService.getRevenueMetrics(today, thisWeek, thisMonth, lastWeek, lastMonth)
          .catch(error => {
            console.error('Failed to fetch revenue metrics:', error);
            return this.getDefaultRevenueMetrics();
          }),
        this.appointmentService.getAppointmentMetrics(today, thisWeek)
          .catch(error => {
            console.error('Failed to fetch appointment metrics:', error);
            return this.getDefaultAppointmentMetrics();
          }),
        this.customerService.getCustomerMetrics(today, thisWeek, thisMonth)
          .catch(error => {
            console.error('Failed to fetch customer metrics:', error);
            return this.getDefaultCustomerMetrics();
          }),
        this.requestService.getRequestMetrics(today, thisWeek, thisMonth)
          .catch(error => {
            console.error('Failed to fetch request metrics:', error);
            return this.getDefaultRequestMetrics();
          }),
        this.businessService.getBusinessMetrics()
          .catch(error => {
            console.error('Failed to fetch business metrics:', error);
            return this.getDefaultBusinessMetrics();
          })
      ]).then(results => results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      ));

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

  // Default fallback methods for when database is unavailable
  private getDefaultRevenueMetrics() {
    return {
      today: { amount: 0, trend: 0, currency: 'USD' },
      week: { amount: 0, trend: 0, target: 0 },
      month: { amount: 0, trend: 0, forecast: 0 },
      breakdown: {
        consultations: 0,
        tattoos: 0,
        touchups: 0,
        deposits: 0
      }
    };
  }

  private getDefaultAppointmentMetrics() {
    return {
      today: { count: 0, completed: 0, remaining: 0 },
      week: { scheduled: 0, completed: 0, cancelled: 0 },
      metrics: {
        averageDuration: 0,
        conversionRate: 0,
        noShowRate: 0,
        rebookingRate: 0
      }
    };
  }

  private getDefaultCustomerMetrics() {
    return {
      total: 0,
      new: { today: 0, week: 0, month: 0 },
      returning: { rate: 0, avgTimeBetweenVisits: 0 },
      segments: {
        newCustomers: 0,
        regularCustomers: 0,
        vipCustomers: 0
      },
      lifetime: {
        averageValue: 0,
        topSpender: { name: 'N/A', value: 0 }
      }
    };
  }

  private getDefaultRequestMetrics() {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      conversionRate: 0,
      averageResponseTime: 0
    };
  }

  private getDefaultBusinessMetrics() {
    return {
      totalStaff: 0,
      activeServices: 0,
      averageRating: 0,
      upcomingCapacity: 0
    };
  }
} 