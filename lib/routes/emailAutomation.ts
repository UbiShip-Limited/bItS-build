import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { ValidationError } from '../services/errors';
import { readRateLimit, writeRateLimit } from '../middleware/rateLimiting';
import type { EmailAutomationTypeKey, EmailAutomationService } from '../services/emailAutomationService';

interface UpdateSettingsBody {
  enabled?: boolean;
  timingHours?: number;
  timingMinutes?: number;
  businessHoursOnly?: boolean;
}

interface TriggerAutomationBody {
  emailType: EmailAutomationTypeKey;
  targetId: string;
}

interface GetLogsQuery {
  emailType?: string;
  status?: string;
  customerId?: string;
  appointmentId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

const emailAutomationRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper function to get the email automation service
  const getEmailAutomationService = (): EmailAutomationService => {
    const service = fastify.emailAutomationService || fastify.services?.emailAutomationService;
    if (!service) {
      throw new Error('Email automation service not available');
    }
    return service;
  };
  // GET /email-automation/settings - Get all automation settings
  fastify.get('/settings', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      tags: ['Email Automation'],
      summary: 'Get email automation settings',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              emailType: { type: 'string' },
              enabled: { type: 'boolean' },
              timingHours: { type: 'number', nullable: true },
              timingMinutes: { type: 'number', nullable: true },
              businessHoursOnly: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const settings = await getEmailAutomationService().getSettings();
      return settings;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get automation settings' });
    }
  });
  
  // PUT /email-automation/settings/:emailType - Update automation settings
  fastify.put<{
    Params: { emailType: string };
    Body: UpdateSettingsBody;
  }>('/settings/:emailType', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      tags: ['Email Automation'],
      summary: 'Update email automation settings',
      params: {
        type: 'object',
        required: ['emailType'],
        properties: {
          emailType: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          timingHours: { type: 'number', minimum: 0 },
          timingMinutes: { type: 'number', minimum: 0, maximum: 59 },
          businessHoursOnly: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { emailType } = request.params;
      const updates = request.body;
      
      const validTypes: EmailAutomationTypeKey[] = [
        'appointment_reminder_24h',
        'appointment_reminder_2h',
        'aftercare_instructions',
        'review_request',
        're_engagement',
        'abandoned_request_recovery'
      ];
      
      if (!validTypes.includes(emailType as EmailAutomationTypeKey)) {
        return reply.status(400).send({ error: 'Invalid email type' });
      }
      
      const updatedSettings = await getEmailAutomationService().updateSettings(
        emailType as EmailAutomationTypeKey,
        updates
      );
      
      return updatedSettings;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to update automation settings' });
    }
  });
  
  // GET /email-automation/logs - Get automation logs
  fastify.get<{ Querystring: GetLogsQuery }>('/logs', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      tags: ['Email Automation'],
      summary: 'Get email automation logs',
      querystring: {
        type: 'object',
        properties: {
          emailType: { type: 'string' },
          status: { type: 'string', enum: ['sent', 'failed', 'bounced'] },
          customerId: { type: 'string' },
          appointmentId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'number', minimum: 1, maximum: 1000 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const filters = {
        ...request.query,
        startDate: request.query.startDate ? new Date(request.query.startDate) : undefined,
        endDate: request.query.endDate ? new Date(request.query.endDate) : undefined,
        limit: request.query.limit || 100
      };
      
      const logs = await getEmailAutomationService().getLogs(filters);
      
      return logs;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get automation logs' });
    }
  });
  
  // POST /email-automation/trigger - Manually trigger an automation
  fastify.post<{ Body: TriggerAutomationBody }>('/trigger', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), writeRateLimit()],
    schema: {
      tags: ['Email Automation'],
      summary: 'Manually trigger email automation',
      body: {
        type: 'object',
        required: ['emailType', 'targetId'],
        properties: {
          emailType: {
            type: 'string',
            enum: [
              'appointment_reminder_24h',
              'appointment_reminder_2h',
              'aftercare_instructions',
              'review_request',
              're_engagement',
              'abandoned_request_recovery'
            ]
          },
          targetId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { emailType, targetId } = request.body;
      
      const result = await getEmailAutomationService().triggerAutomation(emailType, targetId);
      
      if (!result.success) {
        return reply.status(400).send({ error: result.error });
      }
      
      return { success: true, message: `${emailType} email triggered successfully` };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to trigger automation' });
    }
  });
  
  // GET /email-automation/statistics - Get automation statistics
  fastify.get('/statistics', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      tags: ['Email Automation'],
      summary: 'Get email automation statistics'
    }
  }, async (request, reply) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const logs = await getEmailAutomationService().getLogs({
        startDate: thirtyDaysAgo,
        limit: 1000
      });
      
      // Calculate statistics
      const stats = {
        totalSent: logs.filter(log => log.status === 'sent').length,
        totalFailed: logs.filter(log => log.status === 'failed').length,
        totalBounced: logs.filter(log => log.status === 'bounced').length,
        byType: {} as Record<string, { sent: number; failed: number; bounced: number }>,
        last30Days: {
          sent: logs.filter(log => log.status === 'sent').length,
          failed: logs.filter(log => log.status === 'failed').length,
          bounced: logs.filter(log => log.status === 'bounced').length
        }
      };
      
      // Group by email type
      logs.forEach(log => {
        if (!stats.byType[log.emailType]) {
          stats.byType[log.emailType] = { sent: 0, failed: 0, bounced: 0 };
        }
        
        if (log.status === 'sent') stats.byType[log.emailType].sent++;
        else if (log.status === 'failed') stats.byType[log.emailType].failed++;
        else if (log.status === 'bounced') stats.byType[log.emailType].bounced++;
      });
      
      return stats;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get automation statistics' });
    }
  });
  
  // GET /email-automation/upcoming - Get upcoming scheduled emails
  fastify.get('/upcoming', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      tags: ['Email Automation'],
      summary: 'Get upcoming scheduled emails'
    }
  }, async (request, reply) => {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // This is a simplified version - in production you might want to
      // actually calculate which emails would be sent based on current data
      const upcoming = {
        appointmentReminders24h: [],
        appointmentReminders2h: [],
        message: 'Email automation runs every 15 minutes to check for emails to send'
      };
      
      return upcoming;
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to get upcoming emails' });
    }
  });
};

export default emailAutomationRoutes;