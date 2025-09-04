import { apiClient, ApiClient } from '../apiClient';

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
  constructor(private apiClient: ApiClient) {}

  async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await this.apiClient.get<NotificationSettings>('/notifications/settings');
      // apiClient.get() already returns the data directly
      return response;
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      // Return fallback settings
      return {
        provider: 'Square Appointments',
        automaticReminders: true,
        reminderTiming: '24 hours before appointment',
        confirmationTiming: 'Immediately upon booking',
        smsEnabled: true,
        emailEnabled: true,
        squareDashboardUrl: 'https://squareup.com/dashboard/appointments/settings/notifications'
      };
    }
  }

  async getHistory(appointmentId: string): Promise<NotificationHistory[]> {
    try {
      const response = await this.apiClient.get<NotificationHistory[]>(`/notifications/history/${appointmentId}`);
      // apiClient.get() already returns the data directly
      return response;
    } catch (error) {
      console.error(`Failed to fetch notification history for appointment ${appointmentId}:`, error);
      return [];
    }
  }

  async getStats(startDate?: string, endDate?: string): Promise<NotificationStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await this.apiClient.get<NotificationStats>(`/notifications/stats?${params.toString()}`);
      // apiClient.get() already returns the data directly
      return response;
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      return {
        totalNotifications: 0,
        confirmationsSent: 0,
        remindersSent: 0,
        manualNotifications: 0,
        notificationsByDay: []
      };
    }
  }

  async sendManualReminder(appointmentId: string, type: 'reminder' | 'confirmation' | 'follow_up', message?: string) {
    try {
      const response = await this.apiClient.post('/notifications/send-manual', {
        appointmentId,
        type,
        message
      });
      // apiClient.post() already returns the data directly
      return response;
    } catch (error) {
      console.error(`Failed to send manual reminder for appointment ${appointmentId}:`, error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService(apiClient);