import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth.js';
import SquareClient from '../square/index.js';
import PaymentService, { PaymentType } from '../services/paymentService.js';
import BookingService, { BookingType } from '../services/bookingService.js';

const paymentRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);

  // Initialize Square client
  const squareClient = SquareClient.fromEnv();
  
  // Initialize services
  const paymentService = new PaymentService();
  const bookingService = new BookingService();

  // GET /payments - List all payments (admin only)
  fastify.get('/', {
    preHandler: authorize(['admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          beginTime: { type: 'string' },
          endTime: { type: 'string' },
          includeSquare: { type: 'boolean', default: false }
        }
      }
    }
  }, async (request, reply) => {
    const { status, page = 1, limit = 20, beginTime, endTime, includeSquare = false } = request.query as any;
    
    // If Square integration requested, fetch from Square API
    if (includeSquare) {
      try {
        const squareResponse = await squareClient.getPayments(
          beginTime,
          endTime,
          undefined,
          limit
        );
        
        // Return the Square payments data
        return {
          data: squareResponse.result.payments || [],
          pagination: {
            cursor: squareResponse.result.cursor
          }
        };
      } catch (error) {
        fastify.log.error('Error fetching Square payments', error);
        return reply.status(500).send({ error: 'Failed to fetch payments from Square' });
      }
    }
    
    // Otherwise use internal database
    const where = status ? { status } : {};
    
    const [payments, total] = await Promise.all([
      fastify.prisma.payment.findMany({
        where,
        include: { invoices: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.payment.count({ where })
    ]);
    
    return {
      data: payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });

  // GET /payments/:id - Get details of a specific payment
  fastify.get('/:id', {
    preHandler: authorize(['admin']),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          source: { type: 'string', enum: ['internal', 'square'], default: 'internal' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { source = 'internal' } = request.query as { source?: string };
    
    if (source === 'square') {
      try {
        const squareResponse = await squareClient.getPaymentById(id);
        return squareResponse.result.payment || {};
      } catch (error) {
        fastify.log.error('Error fetching Square payment', error);
        return reply.status(404).send({ error: 'Payment not found in Square' });
      }
    }
    
    const payment = await fastify.prisma.payment.findUnique({
      where: { id },
      include: { invoices: true }
    });
    
    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    return payment;
  });

  // POST /payments - Create a new payment
  fastify.post('/', {
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
  }, async (request, reply) => {
    const paymentData = request.body as any;
    
    const payment = await fastify.prisma.payment.create({
      data: paymentData
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
    const updateData = request.body as any;
    
    // Get original for audit
    const original = await fastify.prisma.payment.findUnique({
      where: { id }
    });
    
    if (!original) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    const updated = await fastify.prisma.payment.update({
      where: { id },
      data: updateData
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

  // GET /payments/square/sync - Sync payments from Square to internal database
  fastify.get('/square/sync', {
    preHandler: authorize(['admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          beginTime: { type: 'string' },
          endTime: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { beginTime, endTime, limit = 20 } = request.query as any;
    
    try {
      // Get payments from Square
      const squareResponse = await squareClient.getPayments(
        beginTime,
        endTime,
        undefined,
        limit
      );
      
      if (!squareResponse.result.payments || squareResponse.result.payments.length === 0) {
        return { synced: 0, message: 'No payments found in Square' };
      }
      
      // Track how many were synced
      let syncedCount = 0;
      
      // Process each Square payment
      for (const squarePayment of squareResponse.result.payments) {
        // Skip if payment is not completed
        if (squarePayment.status !== 'COMPLETED') continue;
        
        // Check if payment already exists
        const existingPayment = await fastify.prisma.payment.findUnique({
          where: { squareId: squarePayment.id }
        });
        
        if (!existingPayment) {
          // Create new payment record
          await fastify.prisma.payment.create({
            data: {
              amount: Number(squarePayment.amountMoney?.amount || 0) / 100, // Convert from cents
              status: 'completed',
              paymentMethod: squarePayment.sourceType,
              paymentDetails: squarePayment,
              squareId: squarePayment.id
            }
          });
          
          syncedCount++;
        }
      }
      
      return { 
        synced: syncedCount,
        total: squareResponse.result.payments.length,
        message: `Synced ${syncedCount} new payments from Square`
      };
    } catch (error) {
      fastify.log.error('Error syncing Square payments', error);
      return reply.status(500).send({ error: 'Failed to sync payments from Square' });
    }
  });
  
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
    const { sourceId, amount, customerId, note, consultationDate, duration } = request.body as any;
    
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
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process consultation payment', 
        error: error.message 
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
    const { sourceId, amount, customerId, note, consultationDate, duration } = request.body as any;
    
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
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process drawing consultation payment', 
        error: error.message 
      });
    }
  });
  
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
};

export default paymentRoutes;
