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
      // Validate that the customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer) {
        return reply.code(404).send({
          success: false,
          message: 'Customer not found'
        });
      }
      
      // Validate artist if provided
      if (artistId) {
        const artist = await prisma.user.findUnique({
          where: { id: artistId }
        });
        
        if (!artist) {
          return reply.code(404).send({
            success: false,
            message: 'Artist not found'
          });
        }
      }
      
      // Validate tattoo request if provided
      if (tattooRequestId) {
        const tattooRequest = await prisma.tattooRequest.findUnique({
          where: { id: tattooRequestId }
        });
        
        if (!tattooRequest) {
          return reply.code(404).send({
            success: false,
            message: 'Tattoo request not found'
          });
        }
        
        // Ensure the tattoo request belongs to the same customer
        if (tattooRequest.customerId !== customerId) {
          return reply.code(400).send({
            success: false,
            message: 'Tattoo request does not belong to this customer'
          });
        }
      }
      
      // Create booking
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
          status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] },
          staffId: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { startTime, endTime, status, staffId, notes } = request.body as any;
    
    try {
      // Get existing booking
      const existingBooking = await prisma.appointment.findUnique({
        where: { id }
      });
      
      if (!existingBooking) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
      
      // Update data object
      const updateData = {} as any;
      
      if (startTime) {
        updateData.startTime = new Date(startTime);
      }
      
      if (endTime) {
        updateData.endTime = new Date(endTime);
      }
      
      if (status) {
        updateData.status = status;
      }
      
      if (staffId) {
        updateData.staffId = staffId;
      }
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      // Update booking
      const updatedBooking = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          artist: true,
          invoices: true
        }
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
            changes: updateData
          }
        }
      });
      
      return {
        success: true,
        booking: updatedBooking
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
};

export default bookingRoutes; 