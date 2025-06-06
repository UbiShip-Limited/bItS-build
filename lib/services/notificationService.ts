import { prisma } from '../prisma/prisma';
import { ValidationError, NotFoundError } from './errors';

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  data?: any;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  REQUEST_SUBMITTED = 'request_submitted',
  REQUEST_APPROVED = 'request_approved',
  REQUEST_REJECTED = 'request_rejected',
  CUSTOMER_MESSAGE = 'customer_message',
  SYSTEM_ALERT = 'system_alert',
  REMINDER = 'reminder',
  LOW_AVAILABILITY = 'low_availability',
  REVENUE_MILESTONE = 'revenue_milestone'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationData {
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  data?: any;
  expiresAt?: Date;
}

export interface RealtimeUpdate {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  from?: Date;
  to?: Date;
}

/**
 * Notification Service for real-time updates and system notifications
 * Handles creation, delivery, and management of notifications
 */
export class NotificationService {
  private realtimeCallbacks: Map<string, ((update: RealtimeUpdate) => void)[]> = new Map();

  /**
   * Create a new notification
   */
  async createNotification(notificationData: NotificationData): Promise<Notification> {
    // For now, we'll store notifications in audit log until we add a notifications table
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: notificationData.userId,
        action: 'notification_created',
        resource: 'Notification',
        resourceType: 'notification',
        details: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority || NotificationPriority.MEDIUM,
          data: notificationData.data,
          read: false,
          expiresAt: notificationData.expiresAt
        }
      }
    });

    const notification: Notification = {
      id: auditLog.id,
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority || NotificationPriority.MEDIUM,
      data: notificationData.data,
      read: false,
      createdAt: auditLog.createdAt,
      expiresAt: notificationData.expiresAt
    };

    // Trigger real-time update
    await this.triggerRealtimeUpdate({
      id: notification.id,
      type: 'notification_created',
      data: notification,
      timestamp: new Date(),
      userId: notificationData.userId
    });

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string, 
    filters?: NotificationFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const where: any = {
      action: 'notification_created',
      userId: userId
    };

    if (filters?.type) {
      where.details = { path: ['type'], equals: filters.type };
    }
    if (filters?.priority) {
      where.details = { path: ['priority'], equals: filters.priority };
    }
    if (filters?.read !== undefined) {
      where.details = { path: ['read'], equals: filters.read };
    }
    if (filters?.from) {
      where.createdAt = { ...where.createdAt, gte: filters.from };
    }
    if (filters?.to) {
      where.createdAt = { ...where.createdAt, lte: filters.to };
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    const unreadCount = await prisma.auditLog.count({
      where: {
        ...where,
        details: { path: ['read'], equals: false }
      }
    });

    const notifications: Notification[] = auditLogs.map(log => ({
      id: log.id,
      userId: log.userId || undefined,
      title: log.details?.title || '',
      message: log.details?.message || '',
      type: log.details?.type || NotificationType.SYSTEM_ALERT,
      priority: log.details?.priority || NotificationPriority.MEDIUM,
      data: log.details?.data,
      read: log.details?.read || false,
      readAt: log.details?.readAt ? new Date(log.details.readAt) : undefined,
      createdAt: log.createdAt,
      expiresAt: log.details?.expiresAt ? new Date(log.details.expiresAt) : undefined
    }));

    return { data: notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId?: string): Promise<void> {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: notificationId }
    });

    if (!auditLog) {
      throw new NotFoundError('Notification', notificationId);
    }

    if (userId && auditLog.userId !== userId) {
      throw new ValidationError('Cannot mark notification as read for another user');
    }

    await prisma.auditLog.update({
      where: { id: notificationId },
      data: {
        details: {
          ...(auditLog.details as any),
          read: true,
          readAt: new Date().toISOString()
        }
      }
    });

    // Trigger real-time update
    await this.triggerRealtimeUpdate({
      id: notificationId,
      type: 'notification_read',
      data: { notificationId, readAt: new Date() },
      timestamp: new Date(),
      userId: userId
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'notification_created',
        details: { path: ['read'], equals: false }
      }
    });

    const readAt = new Date().toISOString();

    await Promise.all(
      notifications.map(notification =>
        prisma.auditLog.update({
          where: { id: notification.id },
          data: {
            details: {
              ...notification.details,
              read: true,
              readAt
            }
          }
        })
      )
    );

    // Trigger real-time update
    await this.triggerRealtimeUpdate({
      id: 'bulk_read',
      type: 'notifications_marked_read',
      data: { count: notifications.length, readAt },
      timestamp: new Date(),
      userId
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId?: string): Promise<void> {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: notificationId }
    });

    if (!auditLog) {
      throw new NotFoundError('Notification', notificationId);
    }

    if (userId && auditLog.userId !== userId) {
      throw new ValidationError('Cannot delete notification for another user');
    }

    await prisma.auditLog.delete({
      where: { id: notificationId }
    });

    // Trigger real-time update
    await this.triggerRealtimeUpdate({
      id: notificationId,
      type: 'notification_deleted',
      data: { notificationId },
      timestamp: new Date(),
      userId: userId
    });
  }

  /**
   * Get real-time updates for a user
   */
  async getRealtimeUpdates(userId: string): Promise<RealtimeUpdate[]> {
    // Get recent system events that should trigger real-time updates
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId },
          { action: { in: ['appointment_created', 'payment_received', 'request_submitted'] } }
        ],
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return recentLogs.map(log => ({
      id: log.id,
      type: log.action,
      data: log.details,
      timestamp: log.createdAt,
      userId: log.userId || undefined
    }));
  }

  /**
   * Subscribe to real-time updates
   */
  async subscribeToUpdates(userId: string, callback: (update: RealtimeUpdate) => void): Promise<void> {
    if (!this.realtimeCallbacks.has(userId)) {
      this.realtimeCallbacks.set(userId, []);
    }
    this.realtimeCallbacks.get(userId)!.push(callback);
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribeFromUpdates(userId: string, callback?: (update: RealtimeUpdate) => void): Promise<void> {
    if (!this.realtimeCallbacks.has(userId)) {
      return;
    }

    if (callback) {
      const callbacks = this.realtimeCallbacks.get(userId)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.realtimeCallbacks.delete(userId);
    }
  }

  /**
   * Trigger a real-time update
   */
  private async triggerRealtimeUpdate(update: RealtimeUpdate): Promise<void> {
    // Log the update for debugging
    console.log('Real-time update triggered:', update);

    // If userId is specified, notify that user
    if (update.userId && this.realtimeCallbacks.has(update.userId)) {
      const callbacks = this.realtimeCallbacks.get(update.userId)!;
      callbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in real-time callback:', error);
        }
      });
    }

    // For system-wide updates, notify all subscribed users
    if (!update.userId || ['payment_received', 'appointment_created'].includes(update.type)) {
      this.realtimeCallbacks.forEach((callbacks, userId) => {
        callbacks.forEach(callback => {
          try {
            callback(update);
          } catch (error) {
            console.error('Error in real-time callback:', error);
          }
        });
      });
    }
  }

  /**
   * Create appointment-related notifications
   */
  async createAppointmentNotification(
    action: 'created' | 'updated' | 'cancelled',
    appointmentId: string,
    customerId?: string,
    data?: any
  ): Promise<void> {
    const messages = {
      created: 'New appointment has been created',
      updated: 'Appointment has been updated',
      cancelled: 'Appointment has been cancelled'
    };

    const types = {
      created: NotificationType.APPOINTMENT_CREATED,
      updated: NotificationType.APPOINTMENT_UPDATED,
      cancelled: NotificationType.APPOINTMENT_CANCELLED
    };

    await this.createNotification({
      title: `Appointment ${action}`,
      message: messages[action],
      type: types[action],
      priority: action === 'cancelled' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      data: { appointmentId, customerId, ...data }
    });
  }

  /**
   * Create payment-related notifications
   */
  async createPaymentNotification(
    action: 'received' | 'failed',
    paymentId: string,
    amount: number,
    customerId?: string
  ): Promise<void> {
    const messages = {
      received: `Payment of $${amount} received`,
      failed: `Payment of $${amount} failed`
    };

    const types = {
      received: NotificationType.PAYMENT_RECEIVED,
      failed: NotificationType.PAYMENT_FAILED
    };

    await this.createNotification({
      title: `Payment ${action}`,
      message: messages[action],
      type: types[action],
      priority: action === 'failed' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      data: { paymentId, amount, customerId }
    });
  }

  /**
   * Create request-related notifications
   */
  async createRequestNotification(
    action: 'submitted' | 'approved' | 'rejected',
    requestId: string,
    customerId?: string
  ): Promise<void> {
    const messages = {
      submitted: 'New tattoo request submitted',
      approved: 'Tattoo request approved',
      rejected: 'Tattoo request rejected'
    };

    const types = {
      submitted: NotificationType.REQUEST_SUBMITTED,
      approved: NotificationType.REQUEST_APPROVED,
      rejected: NotificationType.REQUEST_REJECTED
    };

    await this.createNotification({
      title: `Request ${action}`,
      message: messages[action],
      type: types[action],
      priority: NotificationPriority.MEDIUM,
      data: { requestId, customerId }
    });
  }

  /**
   * Create system alert notifications
   */
  async createSystemAlert(
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: any
  ): Promise<void> {
    await this.createNotification({
      title,
      message,
      type: NotificationType.SYSTEM_ALERT,
      priority,
      data
    });
  }

  /**
   * Cleanup expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        action: 'notification_created',
        details: {
          path: ['expiresAt'],
          lt: new Date().toISOString()
        }
      }
    });

    return result.count;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId?: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const where: any = {
      action: 'notification_created'
    };

    if (userId) {
      where.userId = userId;
    }

    const notifications = await prisma.auditLog.findMany({
      where,
      select: { details: true }
    });

    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.details?.read).length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      const type = notification.details?.type || 'unknown';
      const priority = notification.details?.priority || 'medium';

      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    return stats;
  }
} 