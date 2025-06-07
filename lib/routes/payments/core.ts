import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth';
import PaymentService from '../../services/paymentService';
import PaymentLinkService from '../../services/paymentLinkService';
import { PaymentType } from '../../services/paymentService';

// Type definitions for request bodies
interface CreatePaymentBody {
  amount: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
  squareId?: string;
}

interface UpdatePaymentBody {
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
  squareId?: string;
}

interface ProcessPaymentBody {
  type: 'payment_link' | 'invoice' | 'direct_payment';
  amount: number;
  customerId: string;
  paymentType: PaymentType;
  title?: string;
  description?: string;
  appointmentId?: string;
  tattooRequestId?: string;
  redirectUrl?: string;
  allowTipping?: boolean;
  customFields?: Array<{ title: string }>;
  sourceId?: string;
  bookingId?: string;
  note?: string;
  items?: Array<any>;
  paymentSchedule?: any;
  deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
}

interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  customerId?: string;
  paymentType?: PaymentType;
  startDate?: string;
  endDate?: string;
}

const coreRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services
  const paymentService = new PaymentService();
  const paymentLinkService = new PaymentLinkService();
  
  fastify.log.info('🔄 Registering core payment routes...');

  // GET /payments - List payments (accessible by admin and artist)
  fastify.get('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          customerId: { type: 'string' },
          paymentType: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    fastify.log.info(`💰 Processing payment list request with query: ${JSON.stringify(request.query)}`);
    const { 
      page = 1, 
      limit = 20, 
      status, 
      customerId, 
      paymentType, 
      startDate, 
      endDate 
    } = request.query as PaymentQueryParams;

    const params = {
      page,
      limit,
      status,
      customerId,
      paymentType: paymentType as PaymentType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const result = await paymentService.getPayments(params);
    return result;
  });

  // POST /payments - Process different types of payments
  fastify.post('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      body: {
        type: 'object',
        required: ['type', 'amount', 'customerId', 'paymentType'],
        properties: {
          type: { type: 'string', enum: ['payment_link', 'invoice', 'direct_payment'] },
          amount: { type: 'number', minimum: 0 },
          customerId: { type: 'string' },
          paymentType: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          appointmentId: { type: 'string' },
          tattooRequestId: { type: 'string' },
          redirectUrl: { type: 'string' },
          allowTipping: { type: 'boolean' },
          customFields: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' }
              }
            }
          },
          sourceId: { type: 'string' },
          bookingId: { type: 'string' },
          note: { type: 'string' },
          items: { type: 'array' },
          paymentSchedule: { type: 'object' },
          deliveryMethod: { type: 'string', enum: ['EMAIL', 'SMS', 'SHARE_MANUALLY'] }
        }
      }
    }
  }, async (request, reply) => {
    const { type, ...paymentData } = request.body as ProcessPaymentBody;

    try {
      switch (type) {
        case 'payment_link':
          const paymentLinkResult = await paymentLinkService.createPaymentLink({
            amount: paymentData.amount,
            title: paymentData.title || '',
            description: paymentData.description,
            customerId: paymentData.customerId,
            appointmentId: paymentData.appointmentId,
            tattooRequestId: paymentData.tattooRequestId,
            paymentType: paymentData.paymentType,
            redirectUrl: paymentData.redirectUrl,
            allowTipping: paymentData.allowTipping || true,
            customFields: paymentData.customFields
          });

          return {
            success: true,
            data: paymentLinkResult,
            type: 'payment_link'
          };

        case 'invoice':
          const invoiceResult = await paymentLinkService.createInvoice({
            customerId: paymentData.customerId,
            appointmentId: paymentData.appointmentId,
            tattooRequestId: paymentData.tattooRequestId,
            items: paymentData.items || [],
            paymentSchedule: paymentData.paymentSchedule,
            deliveryMethod: paymentData.deliveryMethod || 'EMAIL'
          });

          return {
            success: true,
            data: invoiceResult,
            type: 'invoice'
          };

        case 'direct_payment':
          if (!paymentData.sourceId) {
            return reply.status(400).send({
              error: 'sourceId is required for direct payments'
            });
          }

          const paymentResult = await paymentService.processPayment({
            sourceId: paymentData.sourceId,
            amount: paymentData.amount,
            customerId: paymentData.customerId,
            paymentType: paymentData.paymentType,
            bookingId: paymentData.bookingId,
            note: paymentData.note
          });

          return {
            success: true,
            data: paymentResult,
            type: 'direct_payment'
          };

        default:
          return reply.status(400).send({
            error: 'Invalid payment type specified'
          });
      }
    } catch (error) {
      fastify.log.error('Error processing payment:', error);
      return reply.status(500).send({
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /payments (legacy) - Create a simple payment record
  fastify.post('/legacy', {
    preHandler: authorize(['admin']),
    schema: {
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
          paymentMethod: { type: 'string' },
          paymentDetails: { type: 'object' },
          squareId: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const paymentData = request.body as CreatePaymentBody;
    
    const payment = await fastify.prisma.payment.create({
      data: {
        ...paymentData,
        paymentDetails: paymentData.paymentDetails ? JSON.parse(JSON.stringify(paymentData.paymentDetails)) : null
      }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        details: { payment }
      }
    });
    
    return payment;
  });

  // PUT /payments/:id - Update payment information
  fastify.put('/:id', {
    preHandler: authorize(['admin']),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          paymentMethod: { type: 'string' },
          paymentDetails: { type: 'object' },
          squareId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as UpdatePaymentBody;
    
    // Get original for audit
    const original = await fastify.prisma.payment.findUnique({
      where: { id }
    });
    
    if (!original) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    const updated = await fastify.prisma.payment.update({
      where: { id },
      data: {
        ...updateData,
        paymentDetails: updateData.paymentDetails ? JSON.parse(JSON.stringify(updateData.paymentDetails)) : undefined
      }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'Payment',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    return updated;
  });
  
  fastify.log.info('✅ Core payment routes registered successfully');
};

export default coreRoutes;