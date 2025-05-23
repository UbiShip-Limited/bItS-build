import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import BookingService, { BookingStatus, BookingType } from '../services/bookingService.js';

const appointmentRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Initialize BookingService
  const bookingService = new BookingService();
  
  // Decorate fastify instance so handlers can access it
  if (!fastify.hasDecorator('bookingService')) {
    fastify.decorate('bookingService', bookingService);
  }

  // GET /appointments - List all appointments
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: Object.values(BookingStatus)
          },
          customerId: { type: 'string' },
          artistId: { type: 'string' },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { status, customerId, artistId, from, to, page = 1, limit = 20 } = request.query as any;
    
    // Build where clause based on query parameters
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (artistId) where.artistId = artistId;
    
    // Date range filtering
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    
    const [appointments, total] = await Promise.all([
      fastify.prisma.appointment.findMany({
        where,
        include: {
          customer: true,
          artist: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.appointment.count({ where })
    ]);
    
    return {
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /appointments/:id - Get a specific appointment
  fastify.get('/:id', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
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
    const { id } = request.params as { id: string };
    
    const appointment = await fastify.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        artist: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }
    
    return appointment;
  });
  
  // POST /appointments - Create a new appointment (using BookingService)
  fastify.post('/', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'startAt', 'duration'],
        properties: {
          customerId: { type: 'string' },
          artistId: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 }, // Duration in minutes
          bookingType: { 
            type: 'string', 
            enum: Object.values(BookingType),
            default: BookingType.TATTOO_SESSION
          },
          status: { 
            type: 'string', 
            enum: Object.values(BookingStatus),
            default: BookingStatus.SCHEDULED
          },
          note: { type: 'string' },
          priceQuote: { type: 'number' },
          tattooRequestId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { 
      customerId, 
      artistId, 
      startAt, 
      duration, 
      bookingType = BookingType.TATTOO_SESSION,
      status = BookingStatus.SCHEDULED, 
      note, 
      priceQuote,
      tattooRequestId
    } = request.body as any;

    try {
      const result = await bookingService.createBooking({
        customerId,
        artistId: artistId || request.user?.id,
        startAt: new Date(startAt),
        duration,
        bookingType,
        status,
        note,
        priceQuote,
        tattooRequestId
      });
      
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // PUT /appointments/:id - Update an appointment (using BookingService)
  fastify.put('/:id', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
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
          artistId: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 },
          status: { 
            type: 'string', 
            enum: Object.values(BookingStatus)
          },
          note: { type: 'string' },
          priceQuote: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { 
      artistId, 
      startAt, 
      duration, 
      status, 
      note, 
      priceQuote 
    } = request.body as any;
    
    try {
      const result = await bookingService.updateBooking({
        bookingId: id,
        artistId,
        startAt: startAt ? new Date(startAt) : undefined,
        duration,
        status,
        note,
        priceQuote
      });
      
      return result;
    } catch (error) {
      request.log.error(error);
      if (error.message === 'Booking not found') {
        return reply.status(404).send({ error: 'Appointment not found' });
      }
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // POST /appointments/:id/cancel - Cancel an appointment (using BookingService)
  fastify.post('/:id/cancel', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
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
          reason: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as any;
    
    try {
      const result = await bookingService.cancelBooking({
        bookingId: id,
        reason,
        cancelledBy: request.user?.id
      });
      
      return result;
    } catch (error) {
      request.log.error(error);
      if (error.message === 'Booking not found') {
        return reply.status(404).send({ error: 'Appointment not found' });
      }
      return reply.status(400).send({ error: error.message });
    }
  });
};

export default appointmentRoutes;
