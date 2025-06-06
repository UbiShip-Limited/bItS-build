import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../prisma/prisma';
import { SquareWebhookPayload } from '../../types/api';
import { Square } from 'square';

interface SquareWebhookRequest extends FastifyRequest {
  rawBody?: string;
}

const squareWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /webhooks/square - Handle Square webhook events
  fastify.post('/square', {
    config: {
      rawBody: true // Need raw body for signature verification
    },
    schema: {
      body: {
        type: 'object',
        properties: {
          merchant_id: { type: 'string' },
          type: { type: 'string' },
          event_id: { type: 'string' },
          created_at: { type: 'string' },
          data: { type: 'object' }
        }
      }
    }
  }, async (request: SquareWebhookRequest, reply) => {
    try {
      // Verify webhook signature
      const signature = request.headers['x-square-hmacsha256-signature'] as string;
      const body = request.rawBody;
      const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
      
      if (!webhookSignatureKey) {
        fastify.log.error('Square webhook signature key not configured');
        return reply.status(500).send({ error: 'Internal configuration error' });
      }
      
      if (!body) {
        fastify.log.error('No raw body available for webhook verification');
        return reply.status(400).send({ error: 'Invalid request' });
      }
      
      // Calculate expected signature
      const hmac = crypto.createHmac('sha256', webhookSignatureKey);
      hmac.update(body);
      const expectedSignature = hmac.digest('base64');
      
      if (signature !== expectedSignature) {
        fastify.log.warn('Invalid Square webhook signature');
        return reply.status(401).send({ error: 'Invalid signature' });
      }
      
      const event = request.body as SquareWebhookPayload;
      
      // Handle different event types
      switch (event.type) {
        case 'payment.created':
        case 'payment.updated':
          await handlePaymentEvent(event.data as { object: { payment: Square.Payment } });
          break;
          
        case 'invoice.payment_made':
          await handleInvoicePayment(event.data as { object: { invoice: Square.Invoice } });
          break;
          
        case 'checkout.created':
        case 'checkout.updated':
          await handleCheckoutEvent(event.data as { object: { checkout: { id: string; status: string; order?: { reference_id?: string } } } });
          break;
          
        default:
          fastify.log.info(`Unhandled Square webhook event type: ${event.type}`);
      }
      
      // Always return 200 to acknowledge receipt
      return { received: true };
      
    } catch (error) {
      fastify.log.error('Error processing Square webhook:', error);
      
      // For configuration or critical errors, return 500 to trigger retries
      if (error instanceof Error && (
        error.message.includes('configuration') || 
        error.message.includes('database') ||
        error.message.includes('connection')
      )) {
        return reply.status(500).send({ error: 'Temporary processing error' });
      }
      
      // For other errors, return 200 to prevent unnecessary retries
      return { received: true, error: 'Processing completed with warnings' };
    }
  });
  
  // Helper functions
  async function handlePaymentEvent(data: { object: { payment: Square.Payment } }) {
    const payment = data.object.payment;
    try {
      // Check if payment has a reference ID (links to our system)
      if (payment.referenceId) {
        // Update payment status in our database
        const existingPayment = await prisma.payment.findFirst({
          where: { 
            OR: [
              { referenceId: payment.referenceId },
              { squareId: payment.id }
            ]
          }
        });
        
        if (existingPayment) {
          // Update existing payment
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: payment.status?.toLowerCase() || 'unknown',
              paymentDetails: payment as unknown as Record<string, unknown>,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new payment record
          await prisma.payment.create({
            data: {
              amount: payment.amountMoney ? Number(payment.amountMoney.amount) / 100 : 0,
              status: payment.status?.toLowerCase() || 'unknown',
              paymentMethod: payment.sourceType || 'unknown',
              squareId: payment.id || '',
              referenceId: payment.referenceId,
              paymentDetails: payment as unknown as Record<string, unknown>
            }
          });
        }
        
        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'payment_webhook_received',
            resource: 'payment',
            resourceId: payment.id || '',
            details: {
              status: payment.status,
              amount: payment.amountMoney ? Number(payment.amountMoney.amount) / 100 : 0,
              referenceId: payment.referenceId
            }
          }
        });
      }
    } catch (error) {
      fastify.log.error('Error handling payment event:', error);
    }
  }
  
  async function handleInvoicePayment(data: { object: { invoice: Square.Invoice } }) {
    const invoice = data.object.invoice;
    try {
      // Update invoice status in our database
      const existingInvoice = await prisma.invoice.findFirst({
        where: { 
          description: {
            contains: invoice.invoiceNumber || ''
          }
        }
      });
      
      if (existingInvoice) {
        await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            status: 'paid',
            updatedAt: new Date()
          }
        });
        
        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'invoice_paid',
            resource: 'invoice',
            resourceId: existingInvoice.id,
            details: {
              squareInvoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              paidAt: new Date()
            }
          }
        });
      }
    } catch (error) {
      fastify.log.error('Error handling invoice payment:', error);
    }
  }
  
  async function handleCheckoutEvent(data: { object: { checkout: { id: string; status: string; order?: { reference_id?: string } } } }) {
    const checkout = data.object.checkout;
    try {
      // Log checkout events for tracking
      await prisma.auditLog.create({
        data: {
          action: 'checkout_webhook_received',
          resource: 'checkout',
          resourceId: checkout.id,
          details: {
            status: checkout.status,
            orderReferenceId: checkout.order?.reference_id
          }
        }
      });
    } catch (error) {
      fastify.log.error('Error handling checkout event:', error);
    }
  }
};

export default squareWebhookRoutes; 