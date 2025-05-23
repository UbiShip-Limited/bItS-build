import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth.js';
import { UserRole } from '../types/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import BookingService, { BookingType, BookingStatus } from '../services/bookingService.js';

const tattooRequestsRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Initialize BookingService
  const bookingService = new BookingService();
  
  // Decorate fastify instance
  if (!fastify.hasDecorator('bookingService')) {
    fastify.decorate('bookingService', bookingService);
  }

  // GET /tattoo-requests - List tattoo requests (admin only)
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'reviewed', 'approved', 'rejected'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { status, page = 1, limit = 20 } = request.query as any;
    
    const where = status ? { status } : {};
    
    const [tattooRequests, total] = await Promise.all([
      fastify.prisma.tattooRequest.findMany({
        where,
        include: { customer: true, images: true },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.tattooRequest.count({ where })
    ]);
    
    reply.type('application/json');
    return {
      data: tattooRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /tattoo-requests/:id - Get details of a specific tattoo request
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
    
    const tattooRequest = await fastify.prisma.tattooRequest.findUnique({
      where: { id },
      include: { customer: true, images: true }
    });
    
    if (!tattooRequest) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    reply.type('application/json');
    return tattooRequest;
  });
  
  // POST /tattoo-requests - Submit a new tattoo request
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['description'],
        properties: {
          customerId: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
          description: { type: 'string' },
          placement: { type: 'string' },
          size: { type: 'string' },
          colorPreference: { type: 'string' },
          style: { type: 'string' },
          referenceImages: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                publicId: { type: 'string' }
              }
            }
          }
        },
        // Either customerId OR contactEmail must be provided
        oneOf: [
          { required: ['customerId'] },
          { required: ['contactEmail'] }
        ]
      }
    }
  }, async (request, reply) => {
    const { 
      customerId, 
      contactEmail,
      contactPhone,
      description, 
      placement, 
      size, 
      colorPreference, 
      style, 
      referenceImages 
    } = request.body as any;
    
    // Generate tracking token for anonymous requests
    const trackingToken = !customerId ? uuidv4() : null;
    
    // Create the tattoo request with the right structure
    const tattooRequestData: any = {
      description,
      placement,
      size,
      colorPreference,
      style,
      referenceImages: referenceImages || []
    };
    
    // Add either customer ID or anonymous fields
    if (customerId) {
      tattooRequestData.customerId = customerId;
    } else {
      // Add anonymous request fields
      if (contactEmail) tattooRequestData.contactEmail = contactEmail;
      if (contactPhone) tattooRequestData.contactPhone = contactPhone;
      if (trackingToken) tattooRequestData.trackingToken = trackingToken;
    }
    
    // Create the tattoo request
    const tattooRequest = await fastify.prisma.tattooRequest.create({
      data: tattooRequestData
    });
    
    // Log the audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'TattooRequest',
        resourceId: tattooRequest.id,
        details: { 
          tattooRequest,
          isAnonymous: !customerId
        }
      }
    });
    
    reply.type('application/json');
    return tattooRequest;
  });
  
  // PUT /tattoo-requests/:id - Update a tattoo request
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
          status: { type: 'string', enum: ['new', 'reviewed', 'approved', 'rejected'] },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    
    // Get original for audit log
    const original = await fastify.prisma.tattooRequest.findUnique({ where: { id } });
    
    if (!original) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    const updated = await fastify.prisma.tattooRequest.update({
      where: { id },
      data: updateData
    });
    
    // Log the audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'TattooRequest',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    reply.type('application/json');
    return updated;
  });

  // POST /tattoo-requests/:id/convert-to-appointment - Convert an approved tattoo request to an appointment
  fastify.post('/:id/convert-to-appointment', {
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
        required: ['startAt', 'duration'],
        properties: {
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 }, // Duration in minutes
          artistId: { type: 'string' },
          bookingType: { 
            type: 'string', 
            enum: Object.values(BookingType),
            default: BookingType.TATTOO_SESSION
          },
          priceQuote: { type: 'number' },
          note: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { 
      startAt, 
      duration, 
      artistId = request.user?.id, 
      bookingType = BookingType.TATTOO_SESSION,
      priceQuote,
      note
    } = request.body as any;
    
    // Get the tattoo request
    const tattooRequest = await fastify.prisma.tattooRequest.findUnique({
      where: { id }
    });
    
    if (!tattooRequest) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    // Check if tattoo request is in a valid state to convert
    if (tattooRequest.status !== 'approved' && tattooRequest.status !== 'deposit_paid') {
      return reply.status(400).send({ 
        error: 'Tattoo request must be approved or have deposit paid to convert to appointment' 
      });
    }
    
    try {
      // Create the appointment using BookingService
      const result = await bookingService.createBooking({
        startAt: new Date(startAt),
        duration,
        customerId: tattooRequest.customerId || undefined,
        bookingType,
        artistId,
        note,
        priceQuote,
        tattooRequestId: id,
        contactEmail: tattooRequest.contactEmail || undefined,
        contactPhone: tattooRequest.contactPhone || undefined,
        isAnonymous: !tattooRequest.customerId,
      });
      
      // Update the tattoo request status if needed
      if (tattooRequest.status === 'approved') {
        await fastify.prisma.tattooRequest.update({
          where: { id },
          data: { status: 'in_progress' }
        });
      }
      
      // Log the conversion
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'tattoo_request_converted',
          resource: 'TattooRequest',
          resourceId: id,
          resourceType: 'tattoo_request',
          details: { 
            appointmentId: result.booking.id,
            bookingType,
            squareBookingId: result.squareBooking?.id
          }
        }
      });
      
      return {
        success: true,
        message: 'Tattoo request converted to appointment',
        appointment: result.booking,
        squareBooking: result.squareBooking
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: error.message });
    }
  });
};

export default tattooRequestsRoutes;
