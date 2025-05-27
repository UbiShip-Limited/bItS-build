import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth.js';
import PaymentLinkService from '../../services/paymentLinkService.js';
import { PaymentType } from '../../services/paymentService.js';

const paymentLinkRoutes: FastifyPluginAsync = async (fastify, options) => {
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
      const result = await paymentLinkService.createPaymentLink(request.body as any);
      
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
      return reply.status(500).send({ 
        error: 'Failed to create payment link',
        message: error.message 
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
      const { cursor, limit } = request.query as any;
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
      const result = await paymentLinkService.createInvoice(request.body as any);
      
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
      return reply.status(500).send({ 
        error: 'Failed to create invoice',
        message: error.message 
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
      const result = await paymentLinkService.createCheckoutSession(request.body as any);
      
      return {
        success: true,
        data: {
          checkoutUrl: result.checkoutUrl,
          checkoutId: result.checkoutId
        }
      };
    } catch (error) {
      fastify.log.error('Error creating checkout session:', error);
      return reply.status(500).send({ 
        error: 'Failed to create checkout session',
        message: error.message 
      });
    }
  });
};

export default paymentLinkRoutes; 