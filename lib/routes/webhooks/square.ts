import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../prisma/prisma.js';

const squareWebhookRoutes: FastifyPluginAsync = async (fastify, options) => {
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
  }, async (request, reply) => {
    try {
      // Verify webhook signature
      const signature = request.headers['x-square-hmacsha256-signature'] as string;
      const body = request.rawBody;
      const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
      
      if (!webhookSignatureKey) {
        fastify.log.error('Square webhook signature key not configured');
        return reply.status(500).send({ error: 'Webhook configuration error' });
      }
      
      // Calculate expected signature
      const hmac = crypto.createHmac('sha256', webhookSignatureKey);
      hmac.update(body);
      const expectedSignature = hmac.digest('base64');
      
      if (signature !== expectedSignature) {
        fastify.log.warn('Invalid Square webhook signature');
        return reply.status(401).send({ error: 'Invalid signature' });
      }
      
      const event = request.body as any;
      
      // Handle different event types
      switch (event.type) {
        case 'payment.created':
        case 'payment.updated':
          await handlePaymentEvent(event.data.object.payment);
          break;
          
        case 'invoice.payment_made':
          await handleInvoicePayment(event.data.object.invoice);
          break;
          
        case 'checkout.created':
        case 'checkout.updated':
          await handleCheckoutEvent(event.data.object.checkout);
          break;
          
        default:
          fastify.log.info(`Unhandled Square webhook event type: ${event.type}`);
      }
      
      // Always return 200 to acknowledge receipt
      return { received: true };
      
    } catch (error) {
      fastify.log.error('Error processing Square webhook:', error);
      // Still return 200 to prevent retries for processing errors
      return { received: true, error: 'Processing error' };
    }
  });
  
  // Helper functions
  async function handlePaymentEvent(payment: any) {
    try {
      // Check if payment has a reference ID (links to our system)
      if (payment.reference_id) {
        // Update payment status in our database
        const existingPayment = await prisma.payment.findFirst({
          where: { 
            OR: [
              { referenceId: payment.reference_id },
              { squareId: payment.id }
            ]
          }
        });
        
        if (existingPayment) {
          // Update existing payment
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: payment.status.toLowerCase(),
              paymentDetails: payment,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new payment record
          await prisma.payment.create({
            data: {
              amount: Number(payment.amount_money.amount) / 100,
              status: payment.status.toLowerCase(),
              paymentMethod: payment.source_type,
              squareId: payment.id,
              referenceId: payment.reference_id,
              paymentDetails: payment
            }
          });
        }
        
        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'payment_webhook_received',
            resource: 'payment',
            resourceId: payment.id,
            details: {
              status: payment.status,
              amount: Number(payment.amount_money.amount) / 100,
              referenceId: payment.reference_id
            }
          }
        });
      }
    } catch (error) {
      fastify.log.error('Error handling payment event:', error);
    }
  }
  
  async function handleInvoicePayment(invoice: any) {
    try {
      // Update invoice status in our database
      const existingInvoice = await prisma.invoice.findFirst({
        where: { 
          description: {
            contains: invoice.invoice_number
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
              invoiceNumber: invoice.invoice_number,
              paidAt: new Date()
            }
          }
        });
      }
    } catch (error) {
      fastify.log.error('Error handling invoice payment:', error);
    }
  }
  
  async function handleCheckoutEvent(checkout: any) {
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