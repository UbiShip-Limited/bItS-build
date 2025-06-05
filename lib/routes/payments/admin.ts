import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth';
import SquareClient from '../../square/index';

// Type definitions for request queries
interface PaymentQueryParams {
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  page?: number;
  limit?: number;
  beginTime?: string;
  endTime?: string;
  includeSquare?: boolean;
}

interface SyncQueryParams {
  beginTime?: string;
  endTime?: string;
  limit?: number;
}

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize Square client
  const squareClient = SquareClient.fromEnv();

  // GET /payments - List all payments (admin only)
  fastify.get('/', {
    preHandler: authorize(['admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          beginTime: { type: 'string' },
          endTime: { type: 'string' },
          includeSquare: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    const { status, page = 1, limit = 20, beginTime, endTime, includeSquare = false } = request.query as PaymentQueryParams;
    
    // If Square integration requested, fetch from Square API
    if (includeSquare) {
      try {
        const squareResponse = await squareClient.getPayments(
          beginTime,
          endTime,
          undefined,
          limit
        );
        
        // Return the Square payments data with proper null safety
        return {
          data: squareResponse.result?.payments || [],
          pagination: {
            cursor: squareResponse.cursor || ''
          }
        };
      } catch (error) {
        fastify.log.error('Error fetching Square payments', error);
        return reply.status(500).send({ error: 'Failed to fetch payments from Square' });
      }
    }
    
    // Otherwise use internal database
    const where = status ? { status } : {};
    
    const [payments, total] = await Promise.all([
      fastify.prisma.payment.findMany({
        where,
        include: { invoices: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.payment.count({ where })
    ]);
    
    return {
      data: payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });

  // GET /payments/:id - Get details of a specific payment
  fastify.get('/:id', {
    preHandler: authorize(['admin']),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['internal', 'square'], default: 'internal' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { source = 'internal' } = request.query as { source?: string };
    
    if (source === 'square') {
      try {
        const squareResponse = await squareClient.getPaymentById(id);
        return squareResponse.result?.payment || {};
      } catch (error) {
        fastify.log.error('Error fetching Square payment', error);
        return reply.status(404).send({ error: 'Payment not found in Square' });
      }
    }
    
    const payment = await fastify.prisma.payment.findUnique({
      where: { id },
      include: { invoices: true }
    });
    
    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    return payment;
  });

  // GET /payments/square/sync - Sync payments from Square to internal database
  fastify.get('/square/sync', {
    preHandler: authorize(['admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          beginTime: { type: 'string' },
          endTime: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { beginTime, endTime, limit = 20 } = request.query as SyncQueryParams;
    
    try {
      // Get payments from Square
      const squareResponse = await squareClient.getPayments(
        beginTime,
        endTime,
        undefined,
        limit
      );
      
      if (!squareResponse.result?.payments || squareResponse.result.payments.length === 0) {
        return { synced: 0, message: 'No payments found in Square' };
      }
      
      // Track how many were synced
      let syncedCount = 0;
      const squarePayments = squareResponse.result.payments;
      
      // Process each Square payment
      for (const squarePayment of squarePayments) {
        // Skip if payment is not completed
        if (squarePayment.status !== 'COMPLETED') continue;
        
        // Check if payment already exists
        const existingPayment = await fastify.prisma.payment.findUnique({
          where: { squareId: squarePayment.id }
        });
        
        if (!existingPayment) {
          // Create new payment record
          await fastify.prisma.payment.create({
            data: {
              amount: Number(squarePayment.amountMoney?.amount || 0) / 100, // Convert from cents
              status: 'completed',
              paymentMethod: squarePayment.sourceType,
              paymentDetails: squarePayment as any, // Properly cast to JSON-compatible type
              squareId: squarePayment.id
            }
          });
          
          syncedCount++;
        }
      }
      
              const totalPayments = squarePayments.length;
      return { 
        synced: syncedCount,
        total: totalPayments,
        message: `Synced ${syncedCount} new payments from Square`
      };
    } catch (error) {
      fastify.log.error('Error syncing Square payments', error);
      return reply.status(500).send({ error: 'Failed to sync payments from Square' });
    }
  });
};

export default adminRoutes;