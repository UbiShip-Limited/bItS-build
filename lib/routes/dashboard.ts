import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { readRateLimit } from '../middleware/rateLimiting';
import { prisma } from '../prisma/prisma';
import { startOfDay, endOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { PaymentsService } from '../square/payments';

interface DashboardMetrics {
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

interface DashboardActivity {
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

interface DashboardPriorityAction {
  id: string;
  type: 'overdue_request' | 'unconfirmed_appointment' | 'follow_up';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  link: string;
  createdAt: Date;
}

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /dashboard/metrics - Unified comprehensive dashboard metrics
  fastify.get('/metrics', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), readRateLimit()],
    schema: {
      description: 'Get unified dashboard metrics including appointments, requests, revenue, and analytics',
      querystring: {
        type: 'object',
        properties: {
          timeframe: { 
            type: 'string', 
            enum: ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth'] 
          },
          includeAnalytics: { type: 'boolean', default: true }
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
                metrics: { type: 'object' },
                priorityActions: { type: 'array' },
                recentActivity: { type: 'array' },
                analytics: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { timeframe = 'today', includeAnalytics = true } = request.query as { 
        timeframe?: string; 
        includeAnalytics?: boolean; 
      };

      // Set request timeout to 20 seconds (less than Prisma timeout)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard request timeout')), 20000);
      });

      const metricsPromise = (async () => {
        const today = new Date();
        const todayStart = startOfDay(today);
        const todayEnd = endOfDay(today);
        const weekStart = startOfWeek(today);
        const monthStart = startOfMonth(today);
        const sevenDaysAgo = subDays(today, 7);
        
        request.log.info('Fetching dashboard metrics for date range:');

        // Combine all database queries into fewer calls
        const [appointments, requests, payments] = await Promise.all([
          // Get all relevant appointments in one query
          prisma.appointment.findMany({
            where: {
              OR: [
                { startTime: { gte: todayStart, lte: todayEnd } },
                { status: { in: ['PENDING', 'pending'] }, startTime: { gte: today } }
              ]
            },
            select: {
              startTime: true,
              status: true,
              id: true
            }
          }),
          // Get all relevant requests in one query
          prisma.tattooRequest.findMany({
            where: {
              OR: [
                { status: 'new' },
                { createdAt: { gte: todayStart, lte: todayEnd } }
              ]
            },
            select: {
              status: true,
              timeframe: true,
              createdAt: true,
              id: true
            }
          }),
          // Get payments with timeout handling - remove Square call for now
          Promise.resolve(0)
        ]);

        // Calculate metrics from combined queries
        const todayAppointments = appointments.filter(a => 
          a.startTime && a.startTime >= todayStart && a.startTime <= todayEnd
        );
        const todayCompleted = todayAppointments.filter(a => 
          a.status === 'COMPLETED' || a.status === 'completed'
        ).length;
        const unconfirmedAppointments = appointments.filter(a => 
          (a.status === 'PENDING' || a.status === 'pending') && 
          a.startTime && a.startTime >= today
        ).length;

        const newRequests = requests.filter(r => r.status === 'new').length;
        const urgentRequests = requests.filter(r => 
          r.status === 'new' && 
          r.timeframe && ['urgent', 'this_week'].includes(r.timeframe)
        ).length;
        const todayRequests = requests.filter(r => 
          r.createdAt >= todayStart && r.createdAt <= todayEnd
        ).length;
        const overdueRequests = requests.filter(r => 
          r.status === 'new' && r.createdAt < sevenDaysAgo
        ).length;

        // Get combined payment data to reduce queries
        const allPayments = await prisma.payment.findMany({
          where: {
            status: { in: ['COMPLETED', 'completed'] },
            createdAt: { gte: monthStart }
          },
          select: {
            amount: true,
            createdAt: true
          }
        });

        // Calculate revenue from single query
        const todayRevenue = allPayments.filter(p => 
          p.createdAt >= todayStart && p.createdAt <= todayEnd
        ).reduce((sum, p) => sum + p.amount, 0);
        
        const weekRevenue = allPayments.filter(p => 
          p.createdAt >= weekStart
        ).reduce((sum, p) => sum + p.amount, 0);
        
        const monthRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

        // Temporarily disable analytics to fix connection pool issues
        let analytics: any = null;
        if (includeAnalytics) {
          request.log.info('Analytics temporarily disabled due to connection pool issues');
          analytics = { 
            error: 'Analytics temporarily unavailable - being optimized for better performance',
            message: 'Dashboard metrics are working, analytics will be re-enabled after optimization'
          };
        }

        return {
          todayAppointments: todayAppointments.length,
          todayCompleted,
          unconfirmedAppointments,
          newRequests,
          urgentRequests,
          todayRequests,
          overdueRequests,
          todayRevenue,
          weekRevenue,
          monthRevenue,
          analytics,
          timeframe
        };
      })();

      // Race the metrics promise with timeout  
      const metricsData = await Promise.race([metricsPromise, timeoutPromise]) as {
        todayAppointments: number;
        todayCompleted: number;
        unconfirmedAppointments: number;
        newRequests: number;
        urgentRequests: number;
        todayRequests: number;
        overdueRequests: number;
        todayRevenue: number;
        weekRevenue: number;
        monthRevenue: number;
        analytics: any;
        timeframe: string;
      };

      // Skip Square API integration for now to avoid complexity
      const squareRevenue = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      };

      // Get date ranges needed for recent activity
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Fetch recent activity (last 10 items)
      const recentActivities: DashboardActivity[] = [];

      // Get recent tattoo requests
      const recentTattooRequests = await prisma.tattooRequest.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        include: {
          customer: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      recentTattooRequests.forEach(request => {
        recentActivities.push({
          id: `request-${request.id}`,
          type: 'request_submitted',
          title: 'New tattoo request',
          description: request.customer?.name || request.contactEmail || 'Anonymous',
          timestamp: request.createdAt,
          metadata: {
            customerName: request.customer?.name || request.contactEmail || undefined,
            requestId: request.id
          }
        });
      });

      // Get recent appointments
      const recentAppointments = await prisma.appointment.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        include: {
          customer: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      recentAppointments.forEach(appointment => {
        recentActivities.push({
          id: `appointment-${appointment.id}`,
          type: appointment.status === 'COMPLETED' ? 'appointment_completed' : 'appointment_booked',
          title: appointment.status === 'COMPLETED' ? 'Appointment completed' : 'Appointment booked',
          description: appointment.customer?.name || 'Anonymous',
          timestamp: appointment.createdAt,
          metadata: {
            customerName: appointment.customer?.name,
            appointmentTime: appointment.startTime ?? undefined
          }
        });
      });

      // Get recent payments
      const recentPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          status: 'COMPLETED'
        },
        include: {
          customer: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      recentPayments.forEach(payment => {
        recentActivities.push({
          id: `payment-${payment.id}`,
          type: 'payment_received',
          title: 'Payment received',
          description: payment.customer?.name || 'Customer',
          timestamp: payment.createdAt,
          metadata: {
            amount: payment.amount,
            customerName: payment.customer?.name
          }
        });
      });

      // Sort all activities by timestamp
      recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Build priority actions
      const priorityActions: DashboardPriorityAction[] = [];

      if (metricsData.overdueRequests > 0) {
        priorityActions.push({
          id: 'overdue-requests',
          type: 'overdue_request',
          title: `${metricsData.overdueRequests} overdue tattoo request${metricsData.overdueRequests > 1 ? 's' : ''}`,
          description: 'Review requests older than 7 days',
          priority: 'high',
          link: '/dashboard/tattoo-request?status=new',
          createdAt: new Date()
        });
      }

      if (metricsData.unconfirmedAppointments > 0) {
        priorityActions.push({
          id: 'unconfirmed-appointments',
          type: 'unconfirmed_appointment',
          title: `${metricsData.unconfirmedAppointments} unconfirmed appointment${metricsData.unconfirmedAppointments > 1 ? 's' : ''}`,
          description: 'Confirm pending appointments',
          priority: 'medium',
          link: '/dashboard/appointments?status=pending',
          createdAt: new Date()
        });
      }

      // Build final metrics object
      const finalMetrics: DashboardMetrics = {
        todayAppointments: {
          total: metricsData.todayAppointments,
          completed: metricsData.todayCompleted,
          remaining: metricsData.todayAppointments - metricsData.todayCompleted
        },
        actionItems: {
          overdueRequests: metricsData.overdueRequests,
          unconfirmedAppointments: metricsData.unconfirmedAppointments,
          followUpsNeeded: 0 // TODO: Implement follow-up logic
        },
        requests: {
          newCount: metricsData.newRequests,
          urgentCount: metricsData.urgentRequests,
          todayCount: metricsData.todayRequests
        },
        revenue: {
          // Use Square revenue if available, otherwise fall back to database
          today: squareRevenue.today || metricsData.todayRevenue || 0,
          thisWeek: squareRevenue.thisWeek || metricsData.weekRevenue || 0,
          thisMonth: squareRevenue.thisMonth || metricsData.monthRevenue || 0
        }
      };

      request.log.info(`Dashboard metrics calculated: ${JSON.stringify({
        todayAppointments: finalMetrics.todayAppointments,
        requests: finalMetrics.requests,
        revenue: finalMetrics.revenue,
        priorityActionsCount: priorityActions.length,
        recentActivityCount: recentActivities.length
      })}`);

      return {
        success: true,
        data: {
          metrics: finalMetrics,
          priorityActions,
          recentActivity: recentActivities.slice(0, 10), // Return top 10 activities
          analytics: metricsData.analytics,
          timeframe: metricsData.timeframe
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch dashboard metrics' });
    }
  });
};

export default dashboardRoutes;