import { AnalyticsUtils, DateRange } from './analyticsUtils';
import type { PrismaClient } from '@prisma/client';

export interface CustomerMetrics {
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
}

export interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  totalRevenue: number;
  averageValue: number;
  criteria: Record<string, string | number>;
}

export interface ReturningCustomerMetrics {
  rate: number;
  avgTimeBetweenVisits: number;
}

export interface CustomerLifetimeMetrics {
  averageValue: number;
  topSpender: { name: string; value: number };
}

/**
 * Service for customer analytics and segmentation
 */
export class CustomerAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get new customer count for a specific period
   */
  async getNewCustomerCountForPeriod(start: Date, end: Date): Promise<number> {
    try {
      return await this.prisma.customer.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      });
    } catch (error) {
      console.error('Error getting new customer count:', error);
      return 0; // Return 0 as fallback
    }
  }

  /**
   * Get returning customer count for a specific period
   */
  async getReturningCustomerCountForPeriod(start: Date, end: Date): Promise<number> {
    try {
      // Customers who had appointments in this period but were created before
      const appointments = await this.prisma.appointment.findMany({
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
    } catch (error) {
      console.error('Error getting returning customer count:', error);
      return 0; // Return 0 as fallback
    }
  }

  /**
   * Get comprehensive customer metrics
   */
  async getCustomerMetrics(
    today: DateRange,
    thisWeek: DateRange,
    thisMonth: DateRange
  ): Promise<CustomerMetrics> {
    // Use Promise.allSettled to handle individual failures
    const results = await Promise.allSettled([
      this.prisma.customer.count().catch(() => 0),
      this.getNewCustomerCountForPeriod(today.start, today.end),
      this.getNewCustomerCountForPeriod(thisWeek.start, thisWeek.end),
      this.getNewCustomerCountForPeriod(thisMonth.start, thisMonth.end),
      this.getCustomerSegments(),
      this.getReturningCustomerMetrics(),
      this.getCustomerLifetimeMetrics()
    ]);

    // Extract values with fallbacks
    const totalCustomers = results[0].status === 'fulfilled' ? results[0].value : 0;
    const newToday = results[1].status === 'fulfilled' ? results[1].value : 0;
    const newThisWeek = results[2].status === 'fulfilled' ? results[2].value : 0;
    const newThisMonth = results[3].status === 'fulfilled' ? results[3].value : 0;
    const segments = results[4].status === 'fulfilled' ? results[4].value : [];
    const returningMetrics = results[5].status === 'fulfilled' ? results[5].value : { rate: 0, avgTimeBetweenVisits: 0 };
    const lifetimeMetrics = results[6].status === 'fulfilled' ? results[6].value : { averageValue: 0, topSpender: { name: "N/A", value: 0 } };

    return {
      total: totalCustomers,
      new: {
        today: newToday,
        week: newThisWeek,
        month: newThisMonth
      },
      returning: returningMetrics,
      segments: {
        newCustomers: segments.find(s => s.id === 'new')?.count || 0,
        regularCustomers: segments.find(s => s.id === 'regular')?.count || 0,
        vipCustomers: segments.find(s => s.id === 'vip')?.count || 0
      },
      lifetime: lifetimeMetrics
    };
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments(): Promise<CustomerSegment[]> {
    let customers;
    try {
      customers = await this.prisma.customer.findMany({
        include: {
          payments: {
            where: { status: 'completed' }
          },
          appointments: true
        }
      });
    } catch (error) {
      console.error('Error getting customer segments:', error);
      return []; // Return empty array as fallback
    }

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
   * Get returning customer metrics
   */
  private async getReturningCustomerMetrics(): Promise<ReturningCustomerMetrics> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const totalCustomers = await this.getNewCustomerCountForPeriod(thirtyDaysAgo, now);
      const returningCustomers = await this.getReturningCustomerCountForPeriod(thirtyDaysAgo, now);
      
      const rate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
      
      // Simplified calculation - would need more complex logic to track actual visit intervals
      const avgTimeBetweenVisits = 45; // days
      
      return {
        rate,
        avgTimeBetweenVisits
      };
    } catch (error) {
      console.error('Error getting returning customer metrics:', error);
      return {
        rate: 0,
        avgTimeBetweenVisits: 0
      };
    }
  }

  /**
   * Get customer lifetime value metrics
   */
  private async getCustomerLifetimeMetrics(): Promise<CustomerLifetimeMetrics> {
    let customersWithPayments;
    try {
      customersWithPayments = await this.prisma.customer.findMany({
        include: {
          payments: {
            where: { status: 'completed' }
          }
        }
      });
    } catch (error) {
      console.error('Error getting customer lifetime metrics:', error);
      return {
        averageValue: 0,
        topSpender: { name: "N/A", value: 0 }
      };
    }

    const customerValues = customersWithPayments
      .map(c => c.payments.reduce((sum, p) => sum + p.amount, 0))
      .filter(value => value > 0);

    const averageValue = customerValues.length > 0 
      ? AnalyticsUtils.calculateAverage(customerValues) 
      : 0;

    // Find top spender
    let topSpender = { name: "Anonymous", value: 0 };
    
    if (customersWithPayments.length > 0) {
      const topCustomer = customersWithPayments.reduce((top, current) => {
        const currentValue = current.payments.reduce((sum, p) => sum + p.amount, 0);
        const topValue = top.payments.reduce((sum, p) => sum + p.amount, 0);
        return currentValue > topValue ? current : top;
      });
      
      const topValue = topCustomer.payments.reduce((sum, p) => sum + p.amount, 0);
      topSpender = {
        name: topCustomer.name || "Anonymous",
        value: topValue
      };
    }

    return {
      averageValue,
      topSpender
    };
  }
} 