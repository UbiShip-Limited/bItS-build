import { apiClient } from '../apiClient';

export interface NotificationSettings {
  provider: string;
  automaticReminders: boolean;
  reminderTiming: string;
  confirmationTiming: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  squareDashboardUrl: string;
}

export interface NotificationHistory {
  id: string;
  type: string;
  sentAt: string;
  details: any;
  automatic: boolean;
}

export interface NotificationStats {
  totalNotifications: number;
  confirmationsSent: number;
  remindersSent: number;
  manualNotifications: number;
  notificationsByDay: Array<{
    date: string;
    count: number;
  }>;
}

class NotificationService {
  async getSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get('/notifications/settings');
    return response.settings;
  }

  async getHistory(appointmentId: string): Promise<NotificationHistory[]> {
    const response = await apiClient.get(`/notifications/history/${appointmentId}`);
    return response.notifications;
  }

  async getStats(startDate?: string, endDate?: string): Promise<NotificationStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/notifications/stats?${params.toString()}`);
    return response.stats;
  }

  async sendManualReminder(appointmentId: string, type: 'reminder' | 'confirmation' | 'follow_up', message?: string) {
    const response = await apiClient.post('/notifications/send-manual', {
      appointmentId,
      type,
      message
    });
    return response;
  }
}

export const notificationService = new NotificationService();