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
  // GET /dashboard/metrics - Get comprehensive dashboard metrics
  fastify.get('/metrics', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), readRateLimit()],
    schema: {
      description: 'Get dashboard metrics including appointments, requests, and revenue',
      response: {
        200: {
          type: 'object',
          properties: {
            metrics: { type: 'object' },
            priorityActions: { type: 'array' },
            recentActivity: { type: 'array' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const weekStart = startOfWeek(today);
      const monthStart = startOfMonth(today);
      const sevenDaysAgo = subDays(today, 7);
      
      request.log.info('Fetching dashboard metrics for date range:', {
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString(),
        weekStart: weekStart.toISOString(),
        monthStart: monthStart.toISOString()
      });

      // Fetch today's appointments
      const [todayAppointments, todayCompletedAppointments] = await Promise.all([
        prisma.appointment.count({
          where: {
            startTime: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        }),
        prisma.appointment.count({
          where: {
            startTime: {
              gte: todayStart,
              lte: todayEnd
            },
            status: { in: ['COMPLETED', 'completed'] }
          }
        })
      ]);

      // Fetch tattoo request metrics
      const [newRequests, urgentRequests, todayRequests] = await Promise.all([
        prisma.tattooRequest.count({
          where: { status: 'new' }
        }),
        prisma.tattooRequest.count({
          where: {
            status: 'new',
            timeframe: {
              in: ['urgent', 'this_week']
            }
          }
        }),
        prisma.tattooRequest.count({
          where: {
            createdAt: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        })
      ]);

      // Fetch action items
      const [overdueRequests, unconfirmedAppointments] = await Promise.all([
        prisma.tattooRequest.count({
          where: {
            status: 'new',
            createdAt: {
              lt: sevenDaysAgo
            }
          }
        }),
        prisma.appointment.count({
          where: {
            status: { in: ['PENDING', 'pending'] },
            startTime: {
              gte: today
            }
          }
        })
      ]);

      // Fetch revenue data from database first
      const [todayPayments, weekPayments, monthPayments] = await Promise.all([
        prisma.payment.aggregate({
          _sum: {
            amount: true
          },
          where: {
            createdAt: {
              gte: todayStart,
              lte: todayEnd
            },
            status: { in: ['COMPLETED', 'completed'] }
          }
        }),
        prisma.payment.aggregate({
          _sum: {
            amount: true
          },
          where: {
            createdAt: {
              gte: weekStart
            },
            status: { in: ['COMPLETED', 'completed'] }
          }
        }),
        prisma.payment.aggregate({
          _sum: {
            amount: true
          },
          where: {
            createdAt: {
              gte: monthStart
            },
            status: { in: ['COMPLETED', 'completed'] }
          }
        })
      ]);

      // Also fetch revenue directly from Square API if configured
      let squareRevenue = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      };

      try {
        if (process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID) {
          const paymentsService = new PaymentsService({
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            locationId: process.env.SQUARE_LOCATION_ID,
            environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
            applicationId: process.env.SQUARE_APPLICATION_ID || ''
          });
          
          // Fetch today's Square payments
          const todaySquarePayments = await paymentsService.getPayments(
            todayStart.toISOString(),
            todayEnd.toISOString(),
            undefined,
            100
          );

          // Fetch this week's Square payments
          const weekSquarePayments = await paymentsService.getPayments(
            weekStart.toISOString(),
            todayEnd.toISOString(),
            undefined,
            100
          );

          // Fetch this month's Square payments
          const monthSquarePayments = await paymentsService.getPayments(
            monthStart.toISOString(),
            todayEnd.toISOString(),
            undefined,
            100
          );

          // Calculate revenue from Square payments (amount is in cents)
          if (todaySquarePayments.result?.payments) {
            squareRevenue.today = todaySquarePayments.result.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, p) => sum + (Number(p.amountMoney?.amount || 0) / 100), 0);
          }

          if (weekSquarePayments.result?.payments) {
            squareRevenue.thisWeek = weekSquarePayments.result.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, p) => sum + (Number(p.amountMoney?.amount || 0) / 100), 0);
          }

          if (monthSquarePayments.result?.payments) {
            squareRevenue.thisMonth = monthSquarePayments.result.payments
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, p) => sum + (Number(p.amountMoney?.amount || 0) / 100), 0);
          }

          request.log.info('Square revenue fetched:', squareRevenue);
        } else {
          request.log.info('Square API not configured - missing credentials');
        }
      } catch (squareError: any) {
        // Log more detailed error information
        const errorMessage = squareError?.message || 'Unknown error';
        const errorDetails = {
          message: errorMessage,
          statusCode: squareError?.statusCode,
          errors: squareError?.errors || [],
          body: squareError?.body
        };
        
        request.log.error('Failed to fetch Square revenue:', errorDetails);
        
        // Check for specific error types
        if (errorMessage.includes('UNAUTHORIZED') || errorMessage.includes('401')) {
          request.log.error('Square API authentication failed - check SQUARE_ACCESS_TOKEN permissions');
          request.log.error('Required OAuth scopes: PAYMENTS_READ, ORDERS_READ');
        } else if (errorMessage.includes('FORBIDDEN') || errorMessage.includes('403')) {
          request.log.error('Square API access forbidden - token may lack required permissions');
        } else if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
          request.log.error('Square location not found - check SQUARE_LOCATION_ID');
        }
      }

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

      if (overdueRequests > 0) {
        priorityActions.push({
          id: 'overdue-requests',
          type: 'overdue_request',
          title: `${overdueRequests} overdue tattoo request${overdueRequests > 1 ? 's' : ''}`,
          description: 'Review requests older than 7 days',
          priority: 'high',
          link: '/dashboard/tattoo-request?status=new',
          createdAt: new Date()
        });
      }

      if (unconfirmedAppointments > 0) {
        priorityActions.push({
          id: 'unconfirmed-appointments',
          type: 'unconfirmed_appointment',
          title: `${unconfirmedAppointments} unconfirmed appointment${unconfirmedAppointments > 1 ? 's' : ''}`,
          description: 'Confirm pending appointments',
          priority: 'medium',
          link: '/dashboard/appointments?status=pending',
          createdAt: new Date()
        });
      }

      // Build metrics object
      const metrics: DashboardMetrics = {
        todayAppointments: {
          total: todayAppointments,
          completed: todayCompletedAppointments,
          remaining: todayAppointments - todayCompletedAppointments
        },
        actionItems: {
          overdueRequests,
          unconfirmedAppointments,
          followUpsNeeded: 0 // TODO: Implement follow-up logic
        },
        requests: {
          newCount: newRequests,
          urgentCount: urgentRequests,
          todayCount: todayRequests
        },
        revenue: {
          // Use Square revenue if available, otherwise fall back to database
          today: squareRevenue.today || todayPayments._sum.amount || 0,
          thisWeek: squareRevenue.thisWeek || weekPayments._sum.amount || 0,
          thisMonth: squareRevenue.thisMonth || monthPayments._sum.amount || 0
        }
      };

      request.log.info('Dashboard metrics calculated:', {
        todayAppointments: metrics.todayAppointments,
        requests: metrics.requests,
        revenue: metrics.revenue,
        priorityActionsCount: priorityActions.length,
        recentActivityCount: recentActivities.length
      });

      return {
        metrics,
        priorityActions,
        recentActivity: recentActivities.slice(0, 10) // Return top 10 activities
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch dashboard metrics' });
    }
  });
};

export default dashboardRoutes;