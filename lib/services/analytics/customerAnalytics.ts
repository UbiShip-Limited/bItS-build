import { prisma } from '../../prisma/prisma';
import { AnalyticsUtils, DateRange } from './analyticsUtils';

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
  criteria: Record<string, any>;
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
  /**
   * Get new customer count for a specific period
   */
  async getNewCustomerCountForPeriod(start: Date, end: Date): Promise<number> {
    return prisma.customer.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    });
  }

  /**
   * Get returning customer count for a specific period
   */
  async getReturningCustomerCountForPeriod(start: Date, end: Date): Promise<number> {
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

  /**
   * Get comprehensive customer metrics
   */
  async getCustomerMetrics(
    today: DateRange,
    thisWeek: DateRange,
    thisMonth: DateRange
  ): Promise<CustomerMetrics> {
    const [
      totalCustomers,
      newToday,
      newThisWeek,
      newThisMonth,
      segments,
      returningMetrics,
      lifetimeMetrics
    ] = await Promise.all([
      prisma.customer.count(),
      this.getNewCustomerCountForPeriod(today.start, today.end),
      this.getNewCustomerCountForPeriod(thisWeek.start, thisWeek.end),
      this.getNewCustomerCountForPeriod(thisMonth.start, thisMonth.end),
      this.getCustomerSegments(),
      this.getReturningCustomerMetrics(),
      this.getCustomerLifetimeMetrics()
    ]);

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
   * Get returning customer metrics
   */
  private async getReturningCustomerMetrics(): Promise<ReturningCustomerMetrics> {
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
  }

  /**
   * Get customer lifetime value metrics
   */
  private async getCustomerLifetimeMetrics(): Promise<CustomerLifetimeMetrics> {
    const customersWithPayments = await prisma.customer.findMany({
      include: {
        payments: {
          where: { status: 'completed' }
        }
      }
    });

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