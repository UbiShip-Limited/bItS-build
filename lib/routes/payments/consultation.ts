import { FastifyPluginAsync } from 'fastify';
import PaymentService, { PaymentType } from '../../services/paymentService';
import BookingService, { BookingType } from '../../services/bookingService';

// Type definitions for request bodies
interface ConsultationPaymentBody {
  sourceId: string;
  amount: number;
  customerId: string;
  note?: string;
  consultationDate?: string;
  duration?: number;
}

const consultationRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services
  const paymentService = new PaymentService();
  const bookingService = new BookingService();

  // POST /payments/consultation - Process a consultation payment
  fastify.post('/consultation', {
    schema: {
      body: {
        type: 'object',
        required: ['sourceId', 'amount', 'customerId'],
        properties: {
          sourceId: { type: 'string' },
          amount: { type: 'number' },
          customerId: { type: 'string' },
          note: { type: 'string' },
          consultationDate: { type: 'string' },
          duration: { type: 'number', default: 60 } // minutes
        }
      }
    }
  }, async (request, reply) => {
    const { sourceId, amount, customerId, note, consultationDate, duration } = request.body as ConsultationPaymentBody;
    
    try {
      // Create booking first if date is provided
      let bookingResult;
      if (consultationDate) {
        bookingResult = await bookingService.createBooking({
          startAt: new Date(consultationDate),
          duration: duration || 60,
          customerId,
          bookingType: BookingType.CONSULTATION,
          note,
          priceQuote: amount
        });
      }
      
      // Process payment
      const paymentResult = await paymentService.processPayment({
        sourceId,
        amount,
        customerId,
        paymentType: PaymentType.CONSULTATION,
        bookingId: bookingResult?.booking?.id,
        note
      });
      
      // If we have both a booking and payment, link them
      if (bookingResult && paymentResult) {
        await fastify.prisma.appointment.update({
          where: { id: bookingResult.booking.id },
          data: {id: paymentResult.payment.id }
        });
      }
      
      return {
        success: true,
        payment: paymentResult.payment,
        booking: bookingResult?.booking
      };
    } catch (error) {
      request.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process consultation payment', 
        error: errorMessage
      });
    }
  });
  
  // POST /payments/drawing-consultation - Process a drawing consultation payment
  fastify.post('/drawing-consultation', {
    schema: {
      body: {
        type: 'object',
        required: ['sourceId', 'amount', 'customerId'],
        properties: {
          sourceId: { type: 'string' },
          amount: { type: 'number' },
          customerId: { type: 'string' },
          note: { type: 'string' },
          consultationDate: { type: 'string' },
          duration: { type: 'number', default: 90 } // minutes
        }
      }
    }
  }, async (request, reply) => {
    const { sourceId, amount, customerId, note, consultationDate, duration } = request.body as ConsultationPaymentBody;
    
    try {
      // Create booking first if date is provided
      let bookingResult;
      if (consultationDate) {
        bookingResult = await bookingService.createBooking({
          startAt: new Date(consultationDate),
          duration: duration || 90,
          customerId,
          bookingType: BookingType.DRAWING_CONSULTATION,
          note,
          priceQuote: amount
        });
      }
      
      // Process payment
      const paymentResult = await paymentService.processPayment({
        sourceId,
        amount,
        customerId,
        paymentType: PaymentType.DRAWING_CONSULTATION,
        bookingId: bookingResult?.booking?.id,
        note
      });
      
      // If we have both a booking and payment, link them
      if (bookingResult && paymentResult) {
        await fastify.prisma.appointment.update({
          where: { id: bookingResult.booking.id },
          data: { id: paymentResult.payment.id }
        });
      }
      
      return {
        success: true,
        payment: paymentResult.payment,
        booking: bookingResult?.booking
      };
    } catch (error) {
      request.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process drawing consultation payment', 
        error: errorMessage
      });
    }
  });
};

export default consultationRoutes;