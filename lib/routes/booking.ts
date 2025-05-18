import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth.js';
import BookingService, { BookingType, BookingStatus } from '../services/bookingService.js';
import { prisma } from '../prisma/prisma.js';

const bookingRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);
  
  // Initialize booking service
  const bookingService = new BookingService();
  
  // POST /bookings - Create a new booking
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['startAt', 'duration', 'customerId', 'bookingType'],
        properties: {
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 15 },
          customerId: { type: 'string' },
          bookingType: { 
            type: 'string', 
            enum: [
              BookingType.CONSULTATION, 
              BookingType.DRAWING_CONSULTATION, 
              BookingType.TATTOO_SESSION
            ] 
          },
          artistId: { type: 'string' },
          customerEmail: { type: 'string', format: 'email' },
          customerPhone: { type: 'string' },
          note: { type: 'string' },
          priceQuote: { type: 'number' },
          status: { 
            type: 'string', 
            enum: Object.values(BookingStatus),
            default: BookingStatus.SCHEDULED 
          },
          tattooRequestId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      startAt,
      duration,
      customerId,
      bookingType,
      artistId,
      customerEmail,
      customerPhone,
      note,
      priceQuote,
      status,
      tattooRequestId
    } = request.body as any;
    
    try {
      // Only check permissions here, not data validity
      if (artistId) {
        const isAdmin = request.user.role === 'admin';
        const isArtistBookingThemselves = artistId === request.user.id && request.user.role === 'artist';
        
        if (!isAdmin && !isArtistBookingThemselves) {
          return reply.code(403).send({
            success: false,
            message: 'You do not have permission to book this artist'
          });
        }
      }
      
      // Let the service handle all data validation
      const result = await bookingService.createBooking({
        startAt: new Date(startAt),
        duration,
        customerId,
        bookingType: bookingType as BookingType,
        artistId,
        customerEmail,
        customerPhone,
        note,
        priceQuote,
        status: status as BookingStatus,
        tattooRequestId
      });
      
      return {
        success: true,
        message: 'Booking created successfully',
        booking: result.booking,
        squareBooking: result.squareBooking
      };
    } catch (error) {
      request.log.error(error);
      
      // Map common errors to appropriate status codes
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          message: error.message
        });
      }
      
      return reply.code(500).send({
        success: false,
        message: 'Error creating booking',
        error: error.message
      });
    }
  });
  
  // GET /bookings - List all bookings (admin only)
  fastify.get('/', {
    preHandler: authorize(['admin', 'artist']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          status: { type: 'string' },
          type: { type: 'string' },
          customerId: { type: 'string' },
          staffId: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      startDate, 
      endDate, 
      status, 
      type, 
      customerId, 
      staffId,
      page = 1, 
      limit = 20 
    } = request.query as any;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const where = {} as any;
    
    if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.endTime = { lte: new Date(endDate) };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (staffId) {
      where.staffId = staffId;
    }
    
    try {
      // Get bookings
      const [bookings, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { 'start_time': 'asc' } as any,
          include: {
            customer: true,
            artist: true,
            invoices: true
          }
        }),
        prisma.appointment.count({ where })
      ]);
      
      // Return paginated results
      return {
        data: bookings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error fetching bookings', 
        error: error.message 
      });
    }
  });
  
  // GET /bookings/:id - Get booking by ID
  fastify.get('/:id', {
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
    const { id } = request.params as any;
    
    try {
      // Get booking
      const booking = await prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          artist: true,
          invoices: true
        }
      });
      
      if (!booking) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
      
      // Check access permission - only admin, the artist, or the customer can view
      const user = request.user;
      
      if (user.role !== 'admin' && 
          booking.artist?.id !== user.id && 
          booking.customerId !== user.id) {
        return reply.code(403).send({ 
          success: false, 
          message: 'You do not have permission to view this booking' 
        });
      }
      
      return {
        success: true,
        booking
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error fetching booking', 
        error: error.message 
      });
    }
  });
  
  // PUT /bookings/:id - Update booking
  fastify.put('/:id', {
    preHandler: authorize(['admin', 'artist']),
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
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          duration: { type: 'integer', minimum: 15 },
          status: { 
            type: 'string', 
            enum: Object.values(BookingStatus)
          },
          artistId: { type: 'string' },
          notes: { type: 'string' },
          priceQuote: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { startTime, endTime, duration, status, artistId, notes, priceQuote } = request.body as any;
    
    try {
      // Get existing booking
      const existingBooking = await prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          artist: true
        }
      });
      
      if (!existingBooking) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
      
      // Use our booking service for the update - this will handle both database and Square
      const result = await bookingService.updateBooking({
        bookingId: id,
        startAt: startTime ? new Date(startTime) : undefined,
        duration,
        status: status as BookingStatus,
        artistId,
        note: notes,
        priceQuote
      });
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'booking_updated',
          resource: 'appointment',
          resourceId: id,
          userId: request.user.id,
          details: { 
            previousStatus: existingBooking.status,
            newStatus: status || existingBooking.status,
            changes: JSON.parse(JSON.stringify(request.body))
          }
        }
      });
      
      return {
        success: true,
        booking: result.booking,
        squareBookingUpdated: result.squareBookingUpdated
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error updating booking', 
        error: error.message 
      });
    }
  });
  
  // POST /bookings/:id/cancel - Cancel a booking
  fastify.post('/:id/cancel', {
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
          reason: { type: 'string' },
          notifyCustomer: { type: 'boolean', default: true }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { reason, notifyCustomer = true } = request.body as any;
    
    try {
      // Get existing booking
      const existingBooking = await prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          artist: true
        }
      });
      
      if (!existingBooking) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
      
      // Check permissions - only admin, the artist, or the customer can cancel
      const user = request.user;
      if (user.role !== 'admin' && 
          existingBooking.artist?.id !== user.id && 
          existingBooking.customerId !== user.id) {
        return reply.code(403).send({ 
          success: false, 
          message: 'You do not have permission to cancel this booking' 
        });
      }
      
      // Use booking service to handle cancellation
      const result = await bookingService.cancelBooking({
        bookingId: id,
        reason,
        cancelledBy: user.id
      });
      
      // TODO: Implement customer notification via email or SMS if notifyCustomer is true
      
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Error cancelling booking', 
        error: error.message 
      });
    }
  });
};

export default bookingRoutes; 