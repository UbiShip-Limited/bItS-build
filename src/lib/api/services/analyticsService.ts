import { apiClient } from '../apiClient';

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

export interface RevenueAnalytics {
  total: number;
  breakdown: {
    consultations: number;
    tattooDeposits: number;
    tattooFinal: number;
    touchUps: number;
  };
  trends: Array<{
    date: string;
    amount: number;
    type: string;
  }>;
  topPaymentTypes: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  averageTransactionValue: number;
  projections: {
    nextMonth: number;
    nextQuarter: number;
  };
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  segments: {
    new: number;
    regular: number;
    vip: number;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    appointmentCount: number;
  }>;
  retentionRate: number;
  averageLifetimeValue: number;
}

export interface NotificationMetrics {
  totalNotificationsSent: number;
  confirmationsSent: number;
  remindersSent: number;
  responseRate: number;
  notificationsByType: {
    email: number;
    sms: number;
  };
}

class AnalyticsService {
  async getDashboardMetrics(timeframe: string = 'today'): Promise<DashboardMetrics> {
    const response = await apiClient.get<{ success: boolean; data: DashboardMetrics }>(`/analytics/dashboard?timeframe=${timeframe}`);
    return response.data;
  }

  async getRevenueAnalytics(timeframe: string = 'last30days'): Promise<RevenueAnalytics> {
    const response = await apiClient.get<{ success: boolean; data: RevenueAnalytics }>(`/analytics/revenue?timeframe=${timeframe}`);
    return response.data;
  }

  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    const response = await apiClient.get<{ success: boolean; data: CustomerAnalytics }>('/analytics/customers');
    return response.data;
  }

  async getAppointmentMetrics(timeframe: string = 'last30days') {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/analytics/appointments?timeframe=${timeframe}`);
    return response.data;
  }

  async getRequestMetrics() {
    const response = await apiClient.get<{ success: boolean; data: any }>('/analytics/requests');
    return response.data;
  }

  async getBusinessTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly', metric: 'revenue' | 'appointments' | 'customers' = 'revenue') {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/analytics/trends?period=${period}&metric=${metric}`);
    return response.data;
  }

  async getNotificationMetrics(timeframe: string = 'last30days'): Promise<NotificationMetrics> {
    const response = await apiClient.get<{ success: boolean; data: NotificationMetrics }>(`/analytics/notifications?timeframe=${timeframe}`);
    return response.data;
  }

  async exportAnalytics(type: 'revenue' | 'appointments' | 'customers' | 'full', format: 'csv' | 'json' = 'csv', startDate?: string, endDate?: string) {
    const params = new URLSearchParams({
      type,
      format,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });

    const response = await apiClient.get(`/analytics/export?${params.toString()}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    });

    if (format === 'csv') {
      // Create a download link for CSV
      const blob = new Blob([(response as any).data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    return (response as any).data;
  }
}

export const analyticsService = new AnalyticsService();