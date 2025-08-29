import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { AppointmentService } from '../services/appointmentService';
import { SquareIntegrationService } from '../services/squareIntegrationService';
import { BookingStatus, BookingType } from '../types/booking';
import { AppointmentError } from '../services/errors';
import { readRateLimit, writeRateLimit } from '../middleware/rateLimiting';

// Type definitions for request bodies and queries
interface AppointmentQueryParams {
  status?: BookingStatus;
  customerId?: string;
  artistId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface CreateAppointmentBody {
  customerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  artistId?: string;
  startAt: string;
  duration: number;
  bookingType?: BookingType;
  status?: BookingStatus;
  note?: string;
  priceQuote?: number;
  tattooRequestId?: string;
}

interface UpdateAppointmentBody {
  artistId?: string;
  startAt?: string;
  duration?: number;
  status?: BookingStatus;
  note?: string;
  priceQuote?: number;
}

interface CancelAppointmentBody {
  reason?: string;
}

interface AnonymousAppointmentBody {
  contactEmail: string;
  contactPhone?: string;
  startAt: string;
  duration: number;
  bookingType?: BookingType;
  note?: string;
}

const appointmentRoutes: FastifyPluginAsync = async (fastify) => {
  // Use services from the fastify instance (already initialized with dependencies)
  const appointmentService = fastify.services.appointmentService;
  const squareService = fastify.services.squareIntegrationService;

  // Error handler for consistent error responses
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppointmentError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code
      });
    }
    
    // Default error handling
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  });

  // GET /appointments - List all appointments
  fastify.get('/', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), readRateLimit()],
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
  }, async (request) => {
    const { status, customerId, artistId, from, to, page = 1, limit = 20 } = request.query as AppointmentQueryParams;
    
    const result = await appointmentService.list(
      {
        status,
        customerId,
        artistId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined
      },
      page,
      limit
    );
    
    return result;
  });
  
  // GET /appointments/:id - Get a specific appointment
  fastify.get('/:id', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), readRateLimit()],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    const appointment = await appointmentService.findById(id);
    return appointment;
  });
  
  // POST /appointments - Create a new appointment
  fastify.post('/', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), writeRateLimit()],
    schema: {
      body: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
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
        },
        // Either customerId OR contactEmail must be provided
        oneOf: [
          { required: ['customerId', 'startAt', 'duration'] },
          { required: ['contactEmail', 'startAt', 'duration'] }
        ]
      }
    }
  }, async (request) => {
    const { 
      customerId, 
      contactEmail,
      contactPhone,
      artistId, 
      startAt, 
      duration, 
      bookingType = BookingType.TATTOO_SESSION,
      status = BookingStatus.SCHEDULED, 
      note, 
      priceQuote,
      tattooRequestId
    } = request.body as CreateAppointmentBody;

    const appointment = await appointmentService.create({
      customerId,
      contactEmail,
      contactPhone,
      artistId: artistId || request.user?.id,
      startAt: new Date(startAt),
      duration,
      bookingType,
      status,
      note,
      priceQuote,
      tattooRequestId
    });
    
    // Try to sync with Square (but don't fail if it doesn't work)
    if (appointment.customerId) {
      const squareResult = await squareService.syncAppointmentToSquare(appointment);
      if (squareResult.error) {
        request.log.warn(`Square sync failed: ${squareResult.error}`);
      }
    }
    
    return {
      success: true,
      appointment,
      squareId: appointment.squareId
    };
  });
  
  // PUT /appointments/:id - Update an appointment
  fastify.put('/:id', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), writeRateLimit()],
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
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { 
      artistId, 
      startAt, 
      duration, 
      status, 
      note, 
      priceQuote 
    } = request.body as UpdateAppointmentBody;
    
    const appointment = await appointmentService.update(id, {
      artistId,
      startAt: startAt ? new Date(startAt) : undefined,
      duration,
      status,
      note,
      priceQuote
    });
    
    // Try to update in Square
    if (appointment.customerId) {
      const squareResult = await squareService.updateSquareBooking(appointment);
      if (squareResult.error) {
        request.log.warn(`Square update failed: ${squareResult.error}`);
      }
    }
    
    return {
      success: true,
      appointment,
      squareUpdated: !appointment.customerId ? false : !appointment.squareId ? false : true
    };
  });
  
  // POST /appointments/:id/cancel - Cancel an appointment
  fastify.post('/:id/cancel', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), writeRateLimit()],
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
  }, async (request) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as CancelAppointmentBody;
    
    const appointment = await appointmentService.cancel(
      id,
      reason,
      request.user?.id
    );
    
    // Try to cancel in Square
    let squareCancelled = false;
    if (appointment.squareId) {
      const squareResult = await squareService.cancelSquareBooking(appointment.squareId);
      squareCancelled = squareResult.success;
      if (squareResult.error) {
        request.log.warn(`Square cancellation failed: ${squareResult.error}`);
      }
    }
    
    return {
      success: true,
      appointment,
      squareCancelled
    };
  });
  
  // GET /appointments/:id/notifications - Get notification status for an appointment
  fastify.get('/:id/notifications', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), readRateLimit()],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params as { id: string };
    
    const notificationStatus = await appointmentService.getNotificationStatus(id);
    
    return {
      success: true,
      appointmentId: id,
      ...notificationStatus
    };
  });
  
  // POST /appointments/bulk-update - Bulk update appointments
  fastify.post('/bulk-update', {
    preHandler: [authenticate, authorize(['artist', 'admin'] as UserRole[]), writeRateLimit()],
    schema: {
      body: {
        type: 'object',
        required: ['appointmentIds', 'updates'],
        properties: {
          appointmentIds: { 
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          },
          updates: {
            type: 'object',
            properties: {
              status: { 
                type: 'string', 
                enum: Object.values(BookingStatus)
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { appointmentIds, updates } = request.body as { 
      appointmentIds: string[]; 
      updates: { status?: BookingStatus } 
    };
    
    try {
      const results = await appointmentService.bulkUpdateStatus(
        appointmentIds,
        updates.status!,
        request.user?.id
      );
      
      return {
        success: true,
        updated: results.updated,
        failed: results.failed,
        message: `Successfully updated ${results.updated} appointments`
      };
    } catch (error) {
      request.log.error('Bulk update failed:', error);
      throw error;
    }
  });

  // POST /appointments/anonymous - Create anonymous appointment (no auth required)
  fastify.post('/anonymous', {
    preHandler: writeRateLimit(),
    schema: {
      body: {
        type: 'object',
        required: ['contactEmail', 'startAt', 'duration'],
        properties: {
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 },
          bookingType: { 
            type: 'string', 
            enum: Object.values(BookingType),
            default: BookingType.CONSULTATION
          },
          note: { type: 'string' }
        }
      }
    }
  }, async (request) => {
    const { 
      contactEmail,
      contactPhone,
      startAt, 
      duration, 
      bookingType = BookingType.CONSULTATION,
      note
    } = request.body as AnonymousAppointmentBody;

    const appointment = await appointmentService.create({
      contactEmail,
      contactPhone,
      startAt: new Date(startAt),
      duration,
      bookingType,
      note
    });
    
    return {
      success: true,
      appointment,
      trackingId: appointment.id // Use appointment ID for tracking
    };
  });
};

export default appointmentRoutes;
