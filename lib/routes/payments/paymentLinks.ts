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

const paymentLinkRoutes: FastifyPluginAsync = async (fastify) => {
  const paymentLinkService = new PaymentLinkService();

  // POST /payments/links - Create a payment link
  fastify.post('/links', {
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
    try {
      const result = await paymentLinkService.createPaymentLink(request.body as CreatePaymentLinkBody);
      
      return {
        success: true,
        data: {
          id: result.paymentLink.id,
          url: result.url,
          createdAt: result.paymentLink.createdAt,
          paymentLink: result.paymentLink
        }
      };
    } catch (error) {
      fastify.log.error('Error creating payment link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to create payment link',
        message: errorMessage
      });
    }
  });

  // GET /payments/links - List payment links
  fastify.get('/links', {
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
    try {
      const { cursor, limit } = request.query as PaymentLinksQueryParams;
      const result = await paymentLinkService.listPaymentLinks({ cursor, limit });
      
      return {
        success: true,
        data: result.result.paymentLinks || [],
        cursor: result.result.cursor
      };
    } catch (error) {
      fastify.log.error('Error listing payment links:', error);
      return reply.status(500).send({ 
        error: 'Failed to list payment links' 
      });
    }
  });

  // GET /payments/links/:id - Get payment link details
  fastify.get('/links/:id', {
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
    try {
      const { id } = request.params as { id: string };
      const result = await paymentLinkService.getPaymentLink(id);
      
      return {
        success: true,
        data: result.result.paymentLink
      };
    } catch (error) {
      fastify.log.error('Error getting payment link:', error);
      return reply.status(404).send({ 
        error: 'Payment link not found' 
      });
    }
  });

  // DELETE /payments/links/:id - Delete payment link
  fastify.delete('/links/:id', {
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
    try {
      const { id } = request.params as { id: string };
      await paymentLinkService.deletePaymentLink(id);
      
      return {
        success: true,
        message: 'Payment link deleted successfully'
      };
    } catch (error) {
      fastify.log.error('Error deleting payment link:', error);
      return reply.status(500).send({ 
        error: 'Failed to delete payment link' 
      });
    }
  });

  // POST /payments/invoices - Create an invoice
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
    try {
      const result = await paymentLinkService.createInvoice(request.body as CreateInvoiceBody);
      
      return {
        success: true,
        data: {
          id: result.invoice.id,
          invoiceNumber: result.invoice.invoiceNumber,
          publicUrl: result.publicUrl,
          status: result.invoice.status,
          invoice: result.invoice
        }
      };
    } catch (error) {
      fastify.log.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to create invoice',
        message: errorMessage
      });
    }
  });

  // POST /payments/checkout - Create a checkout session
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
    try {
      const result = await paymentLinkService.createCheckoutSession(request.body as CreateCheckoutBody);
      
      return {
        success: true,
        data: {
          checkoutUrl: result.checkoutUrl,
          checkoutId: result.checkoutId
        }
      };
    } catch (error) {
      fastify.log.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to create checkout session',
        message: errorMessage
      });
    }
  });
};

export default paymentLinkRoutes; 