import { FastifyPluginAsync } from 'fastify';
import PaymentService, { PaymentType } from '../../services/paymentService';
import BookingService, { BookingType } from '../../services/bookingService';

// Type definitions for request bodies
interface TattooDepositPaymentBody {
  sourceId: string;
  amount: number;
  customerId: string;
  tattooRequestId: string;
  sessionDate?: string;
  duration?: number;
  note?: string;
  staffId?: string;
}

interface TattooFinalPaymentBody {
  sourceId: string;
  amount: number;
  customerId: string;
  tattooRequestId: string;
  note?: string;
  staffId?: string;
}

// Interface for Prisma tattoo request update data
interface TattooRequestDepositUpdate {
  deposit_paid: boolean;
  deposit_amount: number;
  payment_id: string;
  status: string;
}

interface TattooRequestFinalUpdate {
  final_paid: boolean;
  final_amount: number;
  final_payment_id: string;
  status: string;
}

const tattooRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services
  const paymentService = new PaymentService(fastify.prisma);
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
    } = request.body as TattooDepositPaymentBody;
    
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
      const updateData: TattooRequestDepositUpdate = {
        deposit_paid: true,
        deposit_amount: amount,
        payment_id: paymentResult.payment.id,
        status: 'deposit_paid'
      };
      
      await fastify.prisma.tattooRequest.update({
        where: { id: tattooRequestId },
        data: updateData
      });
      
      // If we have a booking, link it to the tattoo request
      if (bookingResult) {
        await fastify.prisma.appointment.update({
          where: { id: bookingResult.booking.id },
          data: { paymentId: paymentResult.payment.id }
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
        message: 'Failed to process tattoo deposit payment', 
        error: errorMessage
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
      tattooRequestId
    } = request.body as TattooFinalPaymentBody;
    
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
      const updateData: TattooRequestFinalUpdate = {
        final_paid: true,
        final_amount: amount,
        final_payment_id: paymentResult.payment.id,
        status: 'completed'
      };
      
      await fastify.prisma.tattooRequest.update({
        where: { id: tattooRequestId },
        data: updateData
      });
      
      return {
        success: true,
        payment: paymentResult.payment
      };
    } catch (error) {
      request.log.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process final tattoo payment', 
        error: errorMessage
      });
    }
  });
};

export default tattooRoutes;