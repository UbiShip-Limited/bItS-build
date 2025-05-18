import { FastifyPluginAsync } from 'fastify';
import PaymentService, { PaymentType } from '../../services/paymentService.js';
import BookingService, { BookingType } from '../../services/bookingService.js';

const tattooRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Initialize services
  const paymentService = new PaymentService();
  const bookingService = new BookingService();

  // POST /payments/tattoo-deposit - Process a tattoo deposit payment
  fastify.post('/tattoo-deposit', {
    schema: {
      body: {
        type: 'object',
        required: ['sourceId', 'amount', 'customerId', 'tattooRequestId'],
        properties: {
          sourceId: { type: 'string' },
          amount: { type: 'number' },
          customerId: { type: 'string' },
          tattooRequestId: { type: 'string' },
          sessionDate: { type: 'string' },
          duration: { type: 'number', default: 180 }, // minutes
          note: { type: 'string' },
          staffId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      sourceId, 
      amount, 
      customerId, 
      tattooRequestId, 
      sessionDate, 
      duration, 
      note,
      staffId 
    } = request.body as any;
    
    try {
      // Create booking if session date is provided
      let bookingResult;
      if (sessionDate) {
        bookingResult = await bookingService.createBooking({
          startAt: new Date(sessionDate),
          duration: duration || 180,
          customerId,
          bookingType: BookingType.TATTOO_SESSION,
          artistId: staffId,
          note,
          priceQuote: amount
        });
      }
      
      // Process payment
      const paymentResult = await paymentService.processPayment({
        sourceId,
        amount,
        customerId,
        paymentType: PaymentType.TATTOO_DEPOSIT,
        bookingId: bookingResult?.booking?.id,
        note: `Deposit for tattoo request ${tattooRequestId}`
      });
      
      // Update tattoo request with deposit info
      await fastify.prisma.tattooRequest.update({
        where: { id: tattooRequestId },
        data: { 
          deposit_paid: true,
          deposit_amount: amount,
          payment_id: paymentResult.payment.id,
          status: 'deposit_paid'
        } as any
      });
      
      // If we have a booking, link it to the tattoo request
      if (bookingResult) {
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
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process tattoo deposit payment', 
        error: error.message 
      });
    }
  });
  
  // POST /payments/tattoo-final - Process a final tattoo payment
  fastify.post('/tattoo-final', {
    schema: {
      body: {
        type: 'object',
        required: ['sourceId', 'amount', 'customerId', 'tattooRequestId'],
        properties: {
          sourceId: { type: 'string' },
          amount: { type: 'number' },
          customerId: { type: 'string' },
          tattooRequestId: { type: 'string' },
          note: { type: 'string' },
          staffId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      sourceId, 
      amount, 
      customerId, 
      tattooRequestId, 
      note,
      staffId 
    } = request.body as any;
    
    try {
      // Process payment
      const paymentResult = await paymentService.processPayment({
        sourceId,
        amount,
        customerId,
        paymentType: PaymentType.TATTOO_FINAL,
        note: `Final payment for tattoo request ${tattooRequestId}`
      });
      
      // Update tattoo request with final payment info
      await fastify.prisma.tattooRequest.update({
        where: { id: tattooRequestId },
        data: { 
          final_paid: true,
          final_amount: amount,
          final_payment_id: paymentResult.payment.id,
          status: 'completed'
        } as any
      });
      
      return {
        success: true,
        payment: paymentResult.payment
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process final tattoo payment', 
        error: error.message 
      });
    }
  });
};

export default tattooRoutes;