import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { readRateLimit, writeRateLimit } from '../middleware/rateLimiting';
import { UserRole } from '../types/auth';
import { z } from 'zod';

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const { prisma } = fastify;

  // GET /notifications/settings - Get Square notification settings info
  fastify.get('/settings', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            settings: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                automaticReminders: { type: 'boolean' },
                reminderTiming: { type: 'string' },
                confirmationTiming: { type: 'string' },
                smsEnabled: { type: 'boolean' },
                emailEnabled: { type: 'boolean' },
                squareDashboardUrl: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // These settings reflect what's configured in Square Dashboard
      // In a real implementation, you might fetch these via Square API if available
      const settings = {
        provider: 'Square Appointments',
        automaticReminders: true,
        reminderTiming: '24 hours before appointment',
        confirmationTiming: 'Immediately upon booking',
        smsEnabled: true,
        emailEnabled: true,
        squareDashboardUrl: process.env.SQUARE_ENVIRONMENT === 'production' 
          ? 'https://squareup.com/dashboard/appointments/settings/notifications'
          : 'https://squareupsandbox.com/dashboard/appointments/settings/notifications'
      };

      return reply.send({
        success: true,
        settings
      });
    } catch (error) {
      fastify.log.error('Error fetching notification settings:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch notification settings'
      });
    }
  });

  // GET /notifications/history/:appointmentId - Get notification history for an appointment
  fastify.get('/history/:appointmentId', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      params: {
        type: 'object',
        required: ['appointmentId'],
        properties: {
          appointmentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            appointmentId: { type: 'string' },
            notifications: { type: 'array' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { appointmentId } = request.params as { appointmentId: string };

      // Check if appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          customer: true
        }
      });

      if (!appointment) {
        return reply.status(404).send({
          success: false,
          error: 'Appointment not found'
        });
      }

      // Get notification history from audit logs
      const notificationLogs = await prisma.auditLog.findMany({
        where: {
          resourceId: appointmentId,
          action: {
            in: ['booking_created_webhook', 'booking_updated_webhook', 'manual_reminder_sent', 'appointment_confirmed']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform logs into notification history
      const notifications = notificationLogs.map(log => ({
        id: log.id,
        type: log.action,
        sentAt: log.createdAt,
        details: log.details,
        automatic: log.action.includes('webhook')
      }));

      return reply.send({
        success: true,
        appointmentId,
        notifications
      });
    } catch (error) {
      fastify.log.error('Error fetching notification history:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch notification history'
      });
    }
  });

  // POST /notifications/send-manual - Send a manual reminder (future enhancement)
  fastify.post('/send-manual', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), writeRateLimit()],
    schema: {
      body: {
        type: 'object',
        required: ['appointmentId', 'type'],
        properties: {
          appointmentId: { type: 'string' },
          type: { type: 'string', enum: ['reminder', 'confirmation', 'follow_up'] },
          message: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { appointmentId, type, message } = request.body as {
        appointmentId: string;
        type: string;
        message?: string;
      };

      // Check if appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          customer: true
        }
      });

      if (!appointment) {
        return reply.status(404).send({
          success: false,
          error: 'Appointment not found'
        });
      }

      // For now, just log the manual reminder request
      // In the future, this would integrate with a communication service
      await prisma.auditLog.create({
        data: {
          action: 'manual_reminder_sent',
          resource: 'appointment',
          resourceId: appointmentId,
          resourceType: 'appointment',
          userId: request.user?.id,
          details: {
            type,
            message,
            customerName: appointment.customer?.name,
            customerEmail: appointment.customer?.email || appointment.contactEmail,
            customerPhone: appointment.customer?.phone || appointment.contactPhone,
            sentVia: 'manual',
            status: 'pending_implementation'
          }
        }
      });

      return reply.send({
        success: true,
        message: 'Manual reminder feature is coming soon. Square automatic reminders are currently active.'
      });
    } catch (error) {
      fastify.log.error('Error sending manual reminder:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to send manual reminder'
      });
    }
  });

  // GET /notifications/stats - Get notification statistics
  fastify.get('/stats', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            stats: {
              type: 'object',
              properties: {
                totalNotifications: { type: 'number' },
                confirmationsSent: { type: 'number' },
                remindersSent: { type: 'number' },
                manualNotifications: { type: 'number' },
                notificationsByDay: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

      const dateFilter = {
        gte: startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30)),
        lte: endDate ? new Date(endDate) : new Date()
      };

      // Get notification stats from audit logs
      const notificationLogs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: ['booking_created_webhook', 'booking_updated_webhook', 'manual_reminder_sent']
          },
          createdAt: dateFilter
        }
      });

      // Calculate statistics
      const stats = {
        totalNotifications: notificationLogs.length,
        confirmationsSent: notificationLogs.filter(log => log.action === 'booking_created_webhook').length,
        remindersSent: notificationLogs.filter(log => log.action === 'booking_updated_webhook').length,
        manualNotifications: notificationLogs.filter(log => log.action === 'manual_reminder_sent').length,
        notificationsByDay: [] as { date: string; count: number }[]
      };

      // Group by day
      const dayGroups = notificationLogs.reduce((acc, log) => {
        const day = log.createdAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      stats.notificationsByDay = Object.entries(dayGroups)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return reply.send({
        success: true,
        stats
      });
    } catch (error) {
      fastify.log.error('Error fetching notification stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch notification statistics'
      });
    }
  });
};

export default notificationRoutes;