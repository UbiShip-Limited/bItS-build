import { apiClient } from '../apiClient';

export interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalAppointments: number;
    totalCustomers: number;
    totalRequests: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    breakdown: Record<string, number>;
    trend: 'up' | 'down' | 'stable';
    growthRate: number;
  };
  appointments: {
    today: number;
    thisWeek: number;
    completionRate: number;
    noShowRate: number;
    utilizationRate: number;
  };
  customers: {
    new: number;
    returning: number;
    vip: number;
    retentionRate: number;
  };
  requests: {
    pending: number;
    approved: number;
    conversionRate: number;
  };
  trends: {
    revenue: Array<{ date: string; amount: number }>;
    appointments: Array<{ date: string; count: number }>;
    customers: Array<{ date: string; count: number }>;
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
    const response = await apiClient.get(`/analytics/dashboard?timeframe=${timeframe}`);
    return response.data;
  }

  async getRevenueAnalytics(timeframe: string = 'last30days'): Promise<RevenueAnalytics> {
    const response = await apiClient.get(`/analytics/revenue?timeframe=${timeframe}`);
    return response.data;
  }

  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    const response = await apiClient.get('/analytics/customers');
    return response.data;
  }

  async getAppointmentMetrics(timeframe: string = 'last30days') {
    const response = await apiClient.get(`/analytics/appointments?timeframe=${timeframe}`);
    return response.data;
  }

  async getRequestMetrics() {
    const response = await apiClient.get('/analytics/requests');
    return response.data;
  }

  async getBusinessTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly', metric: 'revenue' | 'appointments' | 'customers' = 'revenue') {
    const response = await apiClient.get(`/analytics/trends?period=${period}&metric=${metric}`);
    return response.data;
  }

  async getNotificationMetrics(timeframe: string = 'last30days'): Promise<NotificationMetrics> {
    const response = await apiClient.get(`/analytics/notifications?timeframe=${timeframe}`);
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
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    return response.data;
  }
}

export const analyticsService = new AnalyticsService();