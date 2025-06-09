import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth';
import PaymentLinkService from '../../services/paymentLinkService';
import { PaymentType } from '../../services/paymentService';

// Type definitions for request bodies and queries
interface CreatePaymentLinkBody {
  amount: number;
  title: string;
  description?: string;
  customerId: string;
  appointmentId?: string;
  tattooRequestId?: string;
  paymentType: PaymentType;
  redirectUrl?: string;
  allowTipping?: boolean;
  customFields?: Array<{
    title: string;
  }>;
}

interface PaymentLinksQueryParams {
  cursor?: string;
  limit?: number;
}

interface CreateInvoiceBody {
  customerId: string;
  appointmentId?: string;
  tattooRequestId?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  paymentSchedule?: Array<{
    amount: number;
    dueDate: string;
    type: 'DEPOSIT' | 'BALANCE';
  }>;
  deliveryMethod?: 'EMAIL' | 'SMS' | 'SHARE_MANUALLY';
}

interface CreateCheckoutBody {
  customerId: string;
  appointmentId?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
  redirectUrl?: string;
}

// Helper function to check if Square is configured
function isSquareConfigured(): boolean {
  const { 
    SQUARE_ACCESS_TOKEN,
    SQUARE_APPLICATION_ID,
    SQUARE_LOCATION_ID
  } = process.env;
  
  return !!(SQUARE_ACCESS_TOKEN && SQUARE_APPLICATION_ID && SQUARE_LOCATION_ID);
}

const paymentLinkRoutes: FastifyPluginAsync = async (fastify) => {
  // Check Square configuration on startup and log status
  const squareConfigured = isSquareConfigured();
  if (squareConfigured) {
    fastify.log.info('✅ Payment link routes: Square integration is configured and ready');
  } else {
    fastify.log.warn('⚠️  Payment link routes: Square integration is not configured - payment link features will be disabled');
  }

  const paymentLinkService = new PaymentLinkService(fastify.prisma);

  // POST /payments/links - Create a payment link
  fastify.post('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      body: {
        type: 'object',
        required: ['amount', 'title', 'customerId', 'paymentType'],
        properties: {
          amount: { type: 'number', minimum: 0 },
          title: { type: 'string' },
          description: { type: 'string' },
          customerId: { type: 'string' },
          appointmentId: { type: 'string' },
          tattooRequestId: { type: 'string' },
          paymentType: { 
            type: 'string', 
            enum: Object.values(PaymentType) 
          },
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
          }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before creating payment links
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Payment link creation unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    try {
      const result = await paymentLinkService.createPaymentLink(request.body as CreatePaymentLinkBody);
      
      const body = request.body as CreatePaymentLinkBody;
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'CREATE_PAYMENT_LINK',
          resource: 'PaymentLink',
          resourceId: result.paymentLink.id,
          details: {
            amount: body.amount,
            paymentType: body.paymentType,
            customerId: body.customerId
          }
        }
      });
      
      return {
        success: true,
        data: {
          id: result.paymentLink.id,
          url: result.url,
          createdAt: result.paymentLink.createdAt,
          paymentLink: result.paymentLink
        },
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error creating payment link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to create payment link',
        message: errorMessage,
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // GET /payments/links - List payment links
  fastify.get('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          cursor: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before listing payment links
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Payment links unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    try {
      const { cursor, limit } = request.query as PaymentLinksQueryParams;
      const result = await paymentLinkService.listPaymentLinks({ cursor, limit });
      
      return {
        success: true,
        data: result.result.paymentLinks || [],
        cursor: result.result.cursor,
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error listing payment links:', error);
      return reply.status(500).send({ 
        error: 'Failed to list payment links',
        message: error instanceof Error ? error.message : 'Unknown error',
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // GET /payments/links/:id - Get payment link details
  fastify.get('/:id', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before getting payment link details
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Payment link details unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    try {
      const { id } = request.params as { id: string };
      const result = await paymentLinkService.getPaymentLink(id);
      
      return {
        success: true,
        data: result.result.paymentLink,
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error getting payment link:', error);
      return reply.status(404).send({ 
        error: 'Payment link not found',
        message: error instanceof Error ? error.message : 'Unknown error',
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // DELETE /payments/links/:id - Delete payment link
  fastify.delete('/:id', {
    preHandler: authorize(['admin']),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before deleting payment links
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Payment link deletion unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    try {
      const { id } = request.params as { id: string };
      await paymentLinkService.deletePaymentLink(id);
      
      return {
        success: true,
        message: 'Payment link deleted successfully',
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error deleting payment link:', error);
      return reply.status(500).send({ 
        error: 'Failed to delete payment link',
        message: error instanceof Error ? error.message : 'Unknown error',
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // POST /payments/links/invoices - Create an invoice
  fastify.post('/invoices', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'items'],
        properties: {
          customerId: { type: 'string' },
          appointmentId: { type: 'string' },
          tattooRequestId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['description', 'amount'],
              properties: {
                description: { type: 'string' },
                amount: { type: 'number', minimum: 0 }
              }
            }
          },
          paymentSchedule: {
            type: 'array',
            items: {
              type: 'object',
              required: ['amount', 'dueDate', 'type'],
              properties: {
                amount: { type: 'number', minimum: 0 },
                dueDate: { type: 'string', format: 'date' },
                type: { type: 'string', enum: ['DEPOSIT', 'BALANCE'] }
              }
            }
          },
          deliveryMethod: { 
            type: 'string', 
            enum: ['EMAIL', 'SMS', 'SHARE_MANUALLY'],
            default: 'EMAIL'
          }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before creating invoices
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Invoice creation unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    try {
      const result = await paymentLinkService.createInvoice(request.body as CreateInvoiceBody);
      
      const body = request.body as CreateInvoiceBody;
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'CREATE_INVOICE',
          resource: 'Invoice',
          resourceId: result.invoice.id || '',
          details: {
            customerId: body.customerId,
            itemCount: body.items.length
          }
        }
      });
      
      return {
        success: true,
        data: {
          id: result.invoice.id,
          invoiceNumber: result.invoice.invoiceNumber,
          publicUrl: result.publicUrl,
          status: result.invoice.status,
          invoice: result.invoice
        },
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to create invoice',
        message: errorMessage,
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // POST /payments/links/checkout - Create a checkout session
  fastify.post('/checkout', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'items'],
        properties: {
          customerId: { type: 'string' },
          appointmentId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'quantity', 'price'],
              properties: {
                name: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
                price: { type: 'number', minimum: 0 },
                note: { type: 'string' }
              }
            }
          },
          redirectUrl: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    // Check if Square is configured before creating checkout sessions
    if (!isSquareConfigured()) {
      return reply.status(503).send({
        error: 'Checkout session creation unavailable',
        message: 'Square payment integration is not configured. Please contact administrator.',
        squareConfigured: false
      });
    }

    try {
      const result = await paymentLinkService.createCheckoutSession(request.body as CreateCheckoutBody);
      
      const body = request.body as CreateCheckoutBody;
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'CREATE_CHECKOUT_SESSION',
          resource: 'CheckoutSession',
          resourceId: result.checkoutId,
          details: {
            customerId: body.customerId,
            itemCount: body.items.length
          }
        }
      });
      
      return {
        success: true,
        data: {
          checkoutUrl: result.checkoutUrl,
          checkoutId: result.checkoutId
        },
        squareConfigured: true
      };
    } catch (error) {
      fastify.log.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to create checkout session',
        message: errorMessage,
        squareConfigured: isSquareConfigured()
      });
    }
  });

  // GET /payments/links/square/status - Check Square integration status
  fastify.get('/square/status', {
    preHandler: authorize(['admin', 'artist'])
  }, async () => {
    const configured = isSquareConfigured();
    const { 
      SQUARE_ACCESS_TOKEN,
      SQUARE_APPLICATION_ID,
      SQUARE_LOCATION_ID,
      SQUARE_ENVIRONMENT
    } = process.env;
    
    return {
      squareConfigured: configured,
      environment: SQUARE_ENVIRONMENT || 'not set',
      hasAccessToken: !!SQUARE_ACCESS_TOKEN,
      hasApplicationId: !!SQUARE_APPLICATION_ID,
      hasLocationId: !!SQUARE_LOCATION_ID,
      missingVariables: [
        ...(!SQUARE_ACCESS_TOKEN ? ['SQUARE_ACCESS_TOKEN'] : []),
        ...(!SQUARE_APPLICATION_ID ? ['SQUARE_APPLICATION_ID'] : []),
        ...(!SQUARE_LOCATION_ID ? ['SQUARE_LOCATION_ID'] : [])
      ]
    };
  });
};

export default paymentLinkRoutes; 