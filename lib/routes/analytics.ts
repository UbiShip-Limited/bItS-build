import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { readRateLimit } from '../middleware/rateLimiting';
import { UserRole } from '../types/auth';
import { z } from 'zod';

// Zod schema for date range query parameters (for runtime validation)
const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timeframe: z.enum(['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'custom']).optional(),
});

// JSON Schema for Fastify route validation
const dateRangeJsonSchema = {
  type: 'object',
  properties: {
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    timeframe: { 
      type: 'string', 
      enum: ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'custom'] 
    }
  }
};

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const { analyticsService } = fastify.services;

  // GET /analytics/dashboard - Get comprehensive dashboard metrics
  fastify.get('/dashboard', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: dateRangeJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                overview: { type: 'object' },
                revenue: { type: 'object' },
                appointments: { type: 'object' },
                customers: { type: 'object' },
                requests: { type: 'object' },
                trends: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    let timeframe: string | undefined;
    try {
      const queryParams = request.query as z.infer<typeof dateRangeSchema>;
      timeframe = queryParams.timeframe;
      const { startDate, endDate } = queryParams;
      
      // Calculate date range based on timeframe or custom dates
      const dateRange = { startDate: new Date(), endDate: new Date() };
      
      if (timeframe) {
        const now = new Date();
        switch (timeframe) {
          case 'today':
            dateRange.startDate = new Date(now.setHours(0, 0, 0, 0));
            dateRange.endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            dateRange.startDate = new Date(yesterday.setHours(0, 0, 0, 0));
            dateRange.endDate = new Date(yesterday.setHours(23, 59, 59, 999));
            break;
          case 'last7days':
            dateRange.startDate = new Date(now.setDate(now.getDate() - 7));
            dateRange.endDate = new Date();
            break;
          case 'last30days':
            dateRange.startDate = new Date(now.setDate(now.getDate() - 30));
            dateRange.endDate = new Date();
            break;
          case 'thisMonth':
            dateRange.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'lastMonth':
            dateRange.startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            dateRange.endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          case 'thisYear':
            dateRange.startDate = new Date(now.getFullYear(), 0, 1);
            dateRange.endDate = new Date(now.getFullYear(), 11, 31);
            break;
        }
      } else if (startDate && endDate) {
        dateRange.startDate = new Date(startDate);
        dateRange.endDate = new Date(endDate);
      }

      // Pass the timeframe string to the service, not the dateRange object
      const metrics = await analyticsService.getDashboardMetrics(timeframe || 'today');
      
      return reply.send({
        success: true,
        data: metrics
      });
    } catch (error) {
      // Enhanced error logging with context
      fastify.log.error({
        msg: 'Error fetching dashboard metrics',
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        context: {
          timeframe: timeframe || 'today',
          userId: (request as any).user?.id,
          timestamp: new Date().toISOString(),
          endpoint: '/analytics/dashboard'
        }
      });
      
      // More detailed error for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = process.env.NODE_ENV === 'development' ? {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timeframe: timeframe || 'today',
        timestamp: new Date().toISOString()
      } : undefined;
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard metrics',
        details: errorDetails
      });
    }
  });

  // GET /analytics/revenue - Get detailed revenue analytics
  fastify.get('/revenue', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: dateRangeJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                breakdown: { type: 'object' },
                trends: { type: 'array' },
                topPaymentTypes: { type: 'array' },
                averageTransactionValue: { type: 'number' },
                projections: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    let timeframe: string | undefined;
    try {
      const queryParams = request.query as z.infer<typeof dateRangeSchema>;
      timeframe = queryParams.timeframe;
      const { startDate, endDate } = queryParams;
      
      const dateRange = { startDate: new Date(), endDate: new Date() };
      
      // Use same date range calculation logic as dashboard
      if (timeframe) {
        // ... (same switch logic as above)
        const now = new Date();
        switch (timeframe) {
          case 'today':
            dateRange.startDate = new Date(now.setHours(0, 0, 0, 0));
            dateRange.endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'last7days':
            dateRange.startDate = new Date(now.setDate(now.getDate() - 7));
            dateRange.endDate = new Date();
            break;
          case 'last30days':
            dateRange.startDate = new Date(now.setDate(now.getDate() - 30));
            dateRange.endDate = new Date();
            break;
          case 'thisMonth':
            dateRange.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          default:
            // Handle other cases as needed
            break;
        }
      } else if (startDate && endDate) {
        dateRange.startDate = new Date(startDate);
        dateRange.endDate = new Date(endDate);
      }

      // Convert timeframe to period for getRevenueBreakdown
      let period = 'month'; // default
      if (timeframe === 'last7days') period = 'week';
      else if (timeframe === 'today' || timeframe === 'yesterday') period = 'day';
      else if (timeframe === 'thisMonth' || timeframe === 'lastMonth') period = 'month';
      
      const revenueData = await analyticsService.getRevenueBreakdown({
        startDate: new Date(period),
        endDate: new Date()
      });
      
      return reply.send({
        success: true,
        data: revenueData
      });
    } catch (error) {
      // Enhanced error logging with context
      fastify.log.error({
        msg: 'Error fetching revenue analytics',
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        context: {
          timeframe: timeframe || undefined,
          userId: request.user?.id,
          timestamp: new Date().toISOString(),
          endpoint: '/analytics/revenue'
        }
      });
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch revenue analytics',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        } : undefined
      });
    }
  });

  // GET /analytics/customers - Get customer insights and segmentation
  fastify.get('/customers', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: dateRangeJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalCustomers: { type: 'number' },
                newCustomers: { type: 'number' },
                segments: { type: 'object' },
                topCustomers: { type: 'array' },
                retentionRate: { type: 'number' },
                averageLifetimeValue: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const segments = await fastify.services.analyticsService.getCustomerSegments();
      const insights = await fastify.services.analyticsService.getCustomerInsights();
      
      return reply.send({
        success: true,
        data: {
          ...segments,
          ...insights
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching customer analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch customer analytics'
      });
    }
  });

  // GET /analytics/appointments - Get appointment efficiency metrics
  fastify.get('/appointments', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: dateRangeJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalAppointments: { type: 'number' },
                completionRate: { type: 'number' },
                noShowRate: { type: 'number' },
                averageDuration: { type: 'number' },
                utilizationRate: { type: 'number' },
                popularTimeSlots: { type: 'array' },
                appointmentsByType: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { startDate, endDate, timeframe } = request.query as z.infer<typeof dateRangeSchema>;
      
      const dateRange = { startDate: new Date(), endDate: new Date() };
      
      if (timeframe) {
        const now = new Date();
        switch (timeframe) {
          case 'today':
            dateRange.startDate = new Date(now.setHours(0, 0, 0, 0));
            dateRange.endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'last30days':
            dateRange.startDate = new Date(now.setDate(now.getDate() - 30));
            dateRange.endDate = new Date();
            break;
          default:
            // Use last 30 days as default
            dateRange.startDate = new Date(now.setDate(now.getDate() - 30));
            dateRange.endDate = new Date();
            break;
        }
      } else if (startDate && endDate) {
        dateRange.startDate = new Date(startDate);
        dateRange.endDate = new Date(endDate);
      }

      const appointmentMetrics = await fastify.services.analyticsService.getAppointmentMetrics(dateRange);
      
      return reply.send({
        success: true,
        data: appointmentMetrics
      });
    } catch (error) {
      fastify.log.error('Error fetching appointment analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch appointment analytics'
      });
    }
  });

  // GET /analytics/requests - Get tattoo request conversion metrics
  fastify.get('/requests', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: dateRangeJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                conversionRate: { type: 'number' },
                averageResponseTime: { type: 'number' },
                requestsByStatus: { type: 'object' },
                popularStyles: { type: 'array' },
                rejectionReasons: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const requestMetrics = await fastify.services.analyticsService.getTattooRequestMetrics();
      
      return reply.send({
        success: true,
        data: requestMetrics
      });
    } catch (error) {
      fastify.log.error('Error fetching request analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch request analytics'
      });
    }
  });

  // GET /analytics/trends - Get business trends and predictions
  fastify.get('/trends', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
          metric: { type: 'string', enum: ['revenue', 'appointments', 'customers'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                historical: { type: 'array' },
                forecast: { type: 'array' },
                growthRate: { type: 'number' },
                seasonalPatterns: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const trends = await analyticsService.getBusinessTrends();
      
      return reply.send({
        success: true,
        data: trends
      });
    } catch (error) {
      fastify.log.error('Error fetching business trends:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch business trends'
      });
    }
  });

  // GET /analytics/export - Export analytics data as CSV
  fastify.get('/export', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['revenue', 'appointments', 'customers', 'full'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          format: { type: 'string', enum: ['csv', 'json'], default: 'csv' }
        },
        required: ['type']
      }
    }
  }, async (request, reply) => {
    try {
      const { type, startDate, endDate, format = 'csv' } = request.query as {
        type: string;
        startDate?: string;
        endDate?: string;
        format?: string;
      };

      const dateRange = {
        startDate: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate: endDate ? new Date(endDate) : new Date()
      };

      let data: unknown;
      let filename: string;

      switch (type) {
        case 'revenue':
          data = await fastify.services.analyticsService.getRevenueBreakdown(dateRange);
          filename = `revenue-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'appointments':
          data = await fastify.services.analyticsService.getAppointmentMetrics(dateRange);
          filename = `appointments-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'customers':
          data = await analyticsService.getCustomerSegments();
          filename = `customers-report-${new Date().toISOString().split('T')[0]}`;
          break;
        case 'full':
          data = await analyticsService.getDashboardMetrics('today');
          filename = `analytics-report-${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          return reply.status(400).send({
            success: false,
            error: 'Invalid export type'
          });
      }

      if (format === 'csv') {
        // Convert data to CSV format
        const csv = convertToCSV(data);
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return reply.send(csv);
      } else {
        // Return as JSON
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
        return reply.send(data);
      }
    } catch (error) {
      fastify.log.error('Error exporting analytics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to export analytics data'
      });
    }
  });

  // GET /analytics/notifications - Get notification metrics (Square integration)
  fastify.get('/notifications', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), readRateLimit()],
    schema: {
      querystring: dateRangeJsonSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalNotificationsSent: { type: 'number' },
                confirmationsSent: { type: 'number' },
                remindersSent: { type: 'number' },
                responseRate: { type: 'number' },
                notificationsByType: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Query audit logs for Square notification events
      const notificationLogs = await fastify.prisma.auditLog.findMany({
        where: {
          action: {
            in: ['booking_created_webhook', 'booking_updated_webhook']
          },
          details: {
            path: ['notificationsSent'],
            equals: true
          }
        }
      });

      const totalNotifications = notificationLogs.length;
      const confirmations = notificationLogs.filter(log => log.action === 'booking_created_webhook').length;
      const reminders = notificationLogs.filter(log => log.action === 'booking_updated_webhook').length;

      return reply.send({
        success: true,
        data: {
          totalNotificationsSent: totalNotifications,
          confirmationsSent: confirmations,
          remindersSent: reminders,
          responseRate: 0.85, // Placeholder - would need to track customer responses
          notificationsByType: {
            email: Math.floor(totalNotifications * 0.6),
            sms: Math.floor(totalNotifications * 0.4)
          }
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching notification metrics:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch notification metrics'
      });
    }
  });
};

// Helper function to convert data to CSV
function convertToCSV(data: unknown): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify((row as Record<string, unknown>)[header] || '')).join(','))
    ];
    return csv.join('\n');
  } else if (typeof data === 'object' && data !== null) {
    // Flatten nested objects for CSV export
    const flattened = flattenObject(data as Record<string, unknown>);
    const headers = Object.keys(flattened);
    const values = headers.map(h => JSON.stringify(flattened[h]));
    return headers.join(',') + '\n' + values.join(',');
  }
  return '';
}

// Helper function to flatten nested objects
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  return Object.keys(obj).reduce((acc: Record<string, unknown>, key: string) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      return { ...acc, ...flattenObject(obj[key] as Record<string, unknown>, prefixedKey) };
    } else {
      return { ...acc, [prefixedKey]: obj[key] };
    }
  }, {});
}

export default analyticsRoutes;