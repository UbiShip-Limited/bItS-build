import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth';
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns';

// Helper function to check if Square is configured
function isSquareConfigured(): boolean {
  const {
    SQUARE_ACCESS_TOKEN,
    SQUARE_APPLICATION_ID,
    SQUARE_LOCATION_ID
  } = process.env;

  return !!(SQUARE_ACCESS_TOKEN && SQUARE_APPLICATION_ID && SQUARE_LOCATION_ID);
}

const paymentStatsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /payments/stats - Get comprehensive payment statistics
  // This endpoint serves both the RevenueWidget and the payments page
  fastify.get('/stats', {
    preHandler: authorize(['admin', 'artist'])
  }, async (request, reply) => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const monthStart = startOfMonth(now);

      // Execute all queries in parallel for better performance
      const [
        todayPayments,
        weekPayments,
        monthPayments,
        pendingPayments,
        todayRefunds,
        totalPayments,
        totalCustomersWithPayments,
        paymentsByStatus,
        recentPayments
      ] = await Promise.all([
        // Revenue data for RevenueWidget
        fastify.prisma.payment.aggregate({
          where: {
            status: 'completed',
            createdAt: {
              gte: todayStart,
              lte: todayEnd
            }
          },
          _sum: { amount: true },
          _count: true
        }),

        fastify.prisma.payment.aggregate({
          where: {
            status: 'completed',
            createdAt: {
              gte: weekStart,
              lte: todayEnd
            }
          },
          _sum: { amount: true }
        }),

        fastify.prisma.payment.aggregate({
          where: {
            status: 'completed',
            createdAt: {
              gte: monthStart,
              lte: todayEnd
            }
          },
          _sum: { amount: true }
        }),

        fastify.prisma.payment.aggregate({
          where: { status: 'pending' },
          _sum: { amount: true },
          _count: true
        }),

        fastify.prisma.payment.aggregate({
          where: {
            status: 'refunded',
            updatedAt: {
              gte: todayStart,
              lte: todayEnd
            }
          },
          _sum: { amount: true }
        }),

        // Overview data for payments page
        fastify.prisma.payment.count(),

        fastify.prisma.payment.groupBy({
          by: ['customerId'],
          where: { customerId: { not: null } },
          _count: { customerId: true }
        }).then(result => result.length),

        fastify.prisma.payment.groupBy({
          by: ['status'],
          _count: { status: true },
          orderBy: { _count: { status: 'desc' } }
        }),

        fastify.prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { id: true, name: true }
            }
          }
        })
      ]);

      // Build comprehensive response that works for both components
      const stats = {
        // Revenue data for RevenueWidget
        today: todayPayments._sum.amount || 0,
        week: weekPayments._sum.amount || 0,
        month: monthPayments._sum.amount || 0,
        pendingCount: pendingPayments._count || 0,
        pendingAmount: pendingPayments._sum.amount || 0,
        completedToday: todayPayments._count || 0,
        refundedToday: todayRefunds._sum.amount || 0,

        // Overview data for payments page
        overview: {
          totalPayments,
          totalCustomersWithPayments,
          isEmpty: totalPayments === 0,
          hasData: totalPayments > 0
        },
        statusBreakdown: paymentsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        recentPayments: recentPayments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          paymentType: payment.paymentType,
          customer: payment.customer?.name || 'Unknown',
          createdAt: payment.createdAt
        })),
        squareConfigured: isSquareConfigured()
      };

      // Return data in format expected by payments page (with data wrapper)
      return {
        success: true,
        data: stats,
        message: totalPayments === 0
          ? 'No payment data found. This appears to be a fresh system or placeholder data is being used.'
          : `Payment system contains ${totalPayments} payment${totalPayments !== 1 ? 's' : ''} from ${totalCustomersWithPayments} customer${totalCustomersWithPayments !== 1 ? 's' : ''}.`
      };
    } catch (error) {
      fastify.log.error('Error fetching payment stats:', error);
      return reply.status(500).send({
        error: 'Failed to fetch payment statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // GET /payments/export - Export payments to CSV
  fastify.get('/export', {
    preHandler: authorize(['admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { startDate, endDate, status } = request.query as any;

      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      if (status) where.status = status;

      const payments = await fastify.prisma.payment.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Convert to CSV
      const csv = [
        'Date,Customer,Email,Amount,Type,Method,Status,Square ID,Reference',
        ...payments.map(p => [
          new Date(p.createdAt).toISOString().split('T')[0],
          p.customer?.name || 'N/A',
          p.customer?.email || 'N/A',
          p.amount.toFixed(2),
          p.paymentType || 'N/A',
          p.paymentMethod || 'card',
          p.status,
          p.squareId || 'N/A',
          p.referenceId || 'N/A'
        ].join(','))
      ].join('\n');

      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="payments-${new Date().toISOString().split('T')[0]}.csv"`)
        .send(csv);
    } catch (error) {
      fastify.log.error('Error exporting payments:', error);
      return reply.status(500).send({
        error: 'Failed to export payments',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};

export default paymentStatsRoutes;