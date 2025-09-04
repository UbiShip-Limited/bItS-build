import { ApiClient } from '../apiClient';

export interface DashboardMetrics {
  todayAppointments: {
    total: number;
    completed: number;
    remaining: number;
  };
  actionItems: {
    overdueRequests: number;
    unconfirmedAppointments: number;
    followUpsNeeded: number;
  };
  requests: {
    newCount: number;
    urgentCount: number;
    todayCount: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'appointment_booked' | 'payment_received' | 'request_submitted' | 'customer_registered' | 'appointment_completed';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    amount?: number;
    customerName?: string;
    appointmentTime?: Date;
    requestId?: string;
  };
}

export interface DashboardPriorityAction {
  id: string;
  type: 'overdue_request' | 'unconfirmed_appointment' | 'follow_up';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  link: string;
  createdAt: Date;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  priorityActions: DashboardPriorityAction[];
  recentActivity: DashboardActivity[];
  analytics?: any;
  timeframe?: string;
}

export class DashboardService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get dashboard metrics and recent activity
   */
  async getDashboardData(timeframe: string = 'today', includeAnalytics: boolean = true): Promise<DashboardData> {
    try {
      const params = new URLSearchParams({
        timeframe,
        includeAnalytics: includeAnalytics.toString()
      });
      const response = await this.apiClient.get<any>(`/dashboard/metrics?${params.toString()}`);
      
      // Handle new unified response format with success/data structure
      const responseData = response?.data || response;
      
      // Ensure response has the expected structure
      const data: DashboardData = {
        metrics: responseData?.metrics || {
          todayAppointments: { total: 0, completed: 0, remaining: 0 },
          actionItems: { overdueRequests: 0, unconfirmedAppointments: 0, followUpsNeeded: 0 },
          requests: { newCount: 0, urgentCount: 0, todayCount: 0 },
          revenue: { today: 0, thisWeek: 0, thisMonth: 0 }
        },
        priorityActions: responseData?.priorityActions || [],
        recentActivity: responseData?.recentActivity || [],
        analytics: responseData?.analytics || null,
        timeframe: responseData?.timeframe || timeframe
      };
      
      // Transform dates in the response
      if (data.recentActivity.length > 0) {
        data.recentActivity = data.recentActivity.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
      }
      
      if (data.priorityActions.length > 0) {
        data.priorityActions = data.priorityActions.map((action: any) => ({
          ...action,
          createdAt: new Date(action.createdAt)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Return default empty data on error
      return {
        metrics: {
          todayAppointments: { total: 0, completed: 0, remaining: 0 },
          actionItems: { overdueRequests: 0, unconfirmedAppointments: 0, followUpsNeeded: 0 },
          requests: { newCount: 0, urgentCount: 0, todayCount: 0 },
          revenue: { today: 0, thisWeek: 0, thisMonth: 0 }
        },
        priorityActions: [],
        recentActivity: []
      };
    }
  }

  /**
   * Get count of new tattoo requests
   */
  async getNewRequestsCount(): Promise<number> {
    try {
      const response = await this.apiClient.get<any>('/tattoo-requests', {
        params: {
          status: 'new',
          limit: 1
        }
      });
      return response?.pagination?.total || 0;
    } catch (error) {
      console.error('Failed to fetch new requests count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await this.apiClient.post(`/notifications/${notificationId}/read`);
  }

  /**
   * Get recent tattoo request submissions
   */
  async getRecentTattooRequests(limit: number = 5): Promise<DashboardActivity[]> {
    try {
      const response = await this.apiClient.get<any>('/tattoo-requests', {
        params: {
          status: 'new',
          limit,
          page: 1
        }
      });
      
      // Transform tattoo requests into activities
      return (response?.data || []).map((request: any) => ({
        id: `request-${request.id}`,
        type: 'request_submitted',
        title: 'New tattoo request',
        description: request.customer?.name || request.contactEmail || 'Anonymous',
        timestamp: new Date(request.createdAt),
        metadata: {
          customerName: request.customer?.name || request.contactEmail,
          requestId: request.id
        }
      }));
    } catch (error) {
      console.error('Failed to fetch recent tattoo requests:', error);
      return [];
    }
  }

  /**
   * Get just metrics without analytics (faster)
   */
  async getMetricsOnly(timeframe: string = 'today'): Promise<DashboardMetrics> {
    const data = await this.getDashboardData(timeframe, false);
    return data.metrics;
  }

  /**
   * Get analytics data only
   */
  async getAnalytics(timeframe: string = 'today'): Promise<any> {
    const data = await this.getDashboardData(timeframe, true);
    return data.analytics;
  }

  /**
   * Refresh dashboard data with real-time updates
   */
  async refreshDashboard(timeframe?: string): Promise<DashboardData> {
    return this.getDashboardData(timeframe || 'today', true);
  }
}

// Export a singleton instance
export const dashboardService = new DashboardService(new ApiClient());