import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../prisma/prisma';
import { SquareWebhookPayload } from '../../types/api';
import { Square } from 'square';
import { webhookRateLimit } from '../../middleware/rateLimiting';
import { RealtimeService } from '../../services/realtimeService';
import { CommunicationService } from '../../services/communicationService';

const realtimeService = new RealtimeService();
const communicationService = new CommunicationService(realtimeService);

interface SquareWebhookRequest extends FastifyRequest {
  rawBody?: string;
}

const squareWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /webhooks/square - Handle Square webhook events
  fastify.post('/square', {
    preHandler: webhookRateLimit(),
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
          
        case 'booking.created':
          await handleBookingCreated(event.data as { object: { booking: Square.Booking } });
          break;
          
        case 'booking.updated':
          await handleBookingUpdated(event.data as { object: { booking: Square.Booking } });
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
              paymentDetails: JSON.parse(JSON.stringify(payment)),
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
              paymentDetails: JSON.parse(JSON.stringify(payment))
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
        
        // Send real-time notification if payment is completed
        if (payment.status === 'COMPLETED') {
          const amount = payment.amountMoney ? Number(payment.amountMoney.amount) / 100 : 0;
          
          // Get payment link details to find customer
          const paymentLink = await prisma.paymentLink.findFirst({
            where: {
              OR: [
                { squareOrderId: payment.orderId },
                { id: payment.referenceId }
              ]
            },
            include: {
              customer: true
            }
          });
          
          if (paymentLink) {
            // Send real-time notification to dashboard
            await realtimeService.addEvent({
              type: 'payment_completed',
              data: {
                paymentId: payment.id,
                customerId: paymentLink.customerId,
                customerName: paymentLink.customer?.name || 'Unknown',
                amount,
                paymentType: typeof paymentLink.metadata === 'object' && paymentLink.metadata && 'paymentType' in paymentLink.metadata 
                  ? String(paymentLink.metadata.paymentType) 
                  : 'payment',
                timestamp: new Date().toISOString()
              }
            });
            
            // Send email notification to owner
            try {
              await communicationService.sendOwnerPaymentNotification({
                id: payment.id || 'unknown',
                amount: amount,
                customerName: paymentLink.customer?.name || 'Unknown',
                paymentMethod: 'Square',
                appointmentId: paymentLink.appointmentId || undefined,
                transactionId: payment.id || 'unknown'
              });
            } catch (emailError) {
              fastify.log.error('Failed to send owner notification:', emailError);
            }
          }
        }
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
  
  async function handleBookingCreated(data: { object: { booking: Square.Booking } }) {
    const booking = data.object.booking;
    try {
      // Find the appointment by Square ID
      let appointment = await prisma.appointment.findUnique({
        where: { squareId: booking.id },
        include: { customer: true }
      });
      
      if (!appointment) {
        // This is a new booking created directly in Square - sync it to our system
        fastify.log.info(`New Square booking detected: ${booking.id}, syncing to local database`);
        
        // Find customer by Square ID
        let customerId: string | null = null;
        if (booking.customerId) {
          const customer = await prisma.customer.findFirst({
            where: { squareId: booking.customerId }
          });
          
          if (customer) {
            customerId = customer.id;
          } else {
            fastify.log.warn(`Square customer ${booking.customerId} not found locally`);
          }
        }
        
        // Extract appointment details
        const startTime = booking.startAt ? new Date(booking.startAt) : new Date();
        const duration = booking.appointmentSegments?.[0]?.durationMinutes || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);
        
        // Extract notes and type from seller note
        const sellerNote = booking.sellerNote || '';
        const typeMatch = sellerNote.match(/^(consultation|drawing_consultation|tattoo_session)/);
        const type = typeMatch ? typeMatch[1] : 'tattoo_session';
        const notes = sellerNote.replace(/^(consultation|drawing_consultation|tattoo_session)\s*-?\s*/, '').trim() || undefined;
        
        // Create the appointment
        appointment = await prisma.appointment.create({
          data: {
            squareId: booking.id,
            customerId,
            startTime,
            endTime,
            duration,
            status: 'scheduled',
            type,
            notes
          },
          include: { customer: true }
        });
        
        fastify.log.info(`Created local appointment ${appointment.id} from Square booking ${booking.id}`);
      } else {
        // Update existing appointment
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'scheduled', // Update status to scheduled
            updatedAt: new Date()
          }
        });
      }
      
      // Create audit log for booking creation
      await prisma.auditLog.create({
        data: {
          action: 'booking_created_webhook',
          resource: 'appointment',
          resourceId: appointment.id,
          resourceType: 'appointment',
          details: {
            squareBookingId: booking.id,
            customerName: appointment.customer?.name,
            startAt: booking.startAt,
            status: booking.status,
            createdFromSquare: !appointment.id,
            // Square automatically sends notifications at this point
            notificationsSent: true,
            notificationType: 'square_automatic'
          }
        }
      });
      
      fastify.log.info(`Square booking created and notifications sent for appointment ${appointment.id}`);
    } catch (error) {
      fastify.log.error('Error handling booking created event:', error);
    }
  }
  
  async function handleBookingUpdated(data: { object: { booking: Square.Booking } }) {
    const booking = data.object.booking;
    try {
      // Find the appointment by Square ID
      let appointment = await prisma.appointment.findUnique({
        where: { squareId: booking.id },
        include: { customer: true }
      });
      
      if (!appointment) {
        // This booking doesn't exist locally - create it
        fastify.log.info(`Square booking ${booking.id} not found locally, creating from webhook`);
        
        // Find customer by Square ID
        let customerId: string | null = null;
        if (booking.customerId) {
          const customer = await prisma.customer.findFirst({
            where: { squareId: booking.customerId }
          });
          
          if (customer) {
            customerId = customer.id;
          }
        }
        
        // Extract appointment details
        const startTime = booking.startAt ? new Date(booking.startAt) : new Date();
        const duration = booking.appointmentSegments?.[0]?.durationMinutes || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);
        
        // Map Square booking status to our appointment status
        let appointmentStatus = 'scheduled';
        if ((booking.status as string) === 'CANCELLED') {
          appointmentStatus = 'cancelled';
        } else if ((booking.status as string) === 'ACCEPTED') {
          appointmentStatus = 'confirmed';
        } else if ((booking.status as string) === 'NO_SHOW') {
          appointmentStatus = 'no_show';
        }
        
        // Extract notes and type from seller note
        const sellerNote = booking.sellerNote || '';
        const typeMatch = sellerNote.match(/^(consultation|drawing_consultation|tattoo_session)/);
        const type = typeMatch ? typeMatch[1] : 'tattoo_session';
        const notes = sellerNote.replace(/^(consultation|drawing_consultation|tattoo_session)\s*-?\s*/, '').trim() || undefined;
        
        // Create the appointment
        appointment = await prisma.appointment.create({
          data: {
            squareId: booking.id,
            customerId,
            startTime,
            endTime,
            duration,
            status: appointmentStatus,
            type,
            notes
          },
          include: { customer: true }
        });
        
        fastify.log.info(`Created local appointment ${appointment.id} from Square booking update ${booking.id}`);
      } else {
        // Map Square booking status to our appointment status
        let appointmentStatus = appointment.status;
        if ((booking.status as string) === 'CANCELLED') {
          appointmentStatus = 'cancelled';
        } else if ((booking.status as string) === 'ACCEPTED') {
          appointmentStatus = 'confirmed';
        } else if ((booking.status as string) === 'NO_SHOW') {
          appointmentStatus = 'no_show';
        }
        
        // Update appointment with new status and time if changed
        const updateData: any = {
          status: appointmentStatus,
          updatedAt: new Date()
        };
        
        // Update start time if it changed
        if (booking.startAt && new Date(booking.startAt).getTime() !== appointment.startTime?.getTime()) {
          updateData.startTime = new Date(booking.startAt);
          // Calculate new end time based on duration
          if (appointment.duration) {
            updateData.endTime = new Date(new Date(booking.startAt).getTime() + appointment.duration * 60000);
          }
        }
        
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: updateData
        });
        
        // Create audit log for booking update
        await prisma.auditLog.create({
          data: {
            action: 'booking_updated_webhook',
            resource: 'appointment',
            resourceId: appointment.id,
            resourceType: 'appointment',
            details: {
              squareBookingId: booking.id,
              customerName: appointment.customer?.name,
              newStatus: booking.status,
              startAt: booking.startAt,
              previousStartTime: appointment.startTime,
              // Square automatically sends update notifications
              updateNotificationSent: true,
              notificationType: 'square_automatic'
            }
          }
        });
        
        fastify.log.info(`Square booking updated for appointment ${appointment.id}, status: ${booking.status}`);
      }
    } catch (error) {
      fastify.log.error('Error handling booking updated event:', error);
    }
  }
};

export default squareWebhookRoutes; 