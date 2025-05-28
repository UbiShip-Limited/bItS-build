import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import BookingService from '../services/bookingService';
// Import handlers with updated schemas
import { createBookingSchema, createBookingHandler } from './bookingHandlers/createBookingHandler';
import { createAnonymousBookingSchema, createAnonymousBookingHandler } from './bookingHandlers/createAnonymousBookingHandler';
import { listBookingsSchema, listBookingsHandler } from './bookingHandlers/listBookingsHandler';
import { getBookingByIdSchema, getBookingByIdHandler } from './bookingHandlers/getBookingByIdHandler';
import { updateBookingSchema, updateBookingHandler } from './bookingHandlers/updateBookingHandler';
import { cancelBookingSchema, cancelBookingHandler } from './bookingHandlers/cancelBookingHandler';

// NOTE: This route is being maintained for backward compatibility
// In the future, we should consolidate all booking/appointment operations through the appointment routes
const bookingRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize booking service
  const bookingService = new BookingService();
  // Decorate fastify instance so handlers can access it via this.bookingService
  if (!fastify.hasDecorator('bookingService')) {
    fastify.decorate('bookingService', bookingService);
  }

  // POST /bookings - Create a new booking (authenticated)
  fastify.post('/', {
    preHandler: authenticate, // Apply authentication
    schema: createBookingSchema,
    handler: createBookingHandler
  });

  // POST /bookings/anonymous - Create a new booking without authentication
  fastify.post('/anonymous', {
    // preHandler is not set here for anonymous access
    schema: createAnonymousBookingSchema,
    handler: createAnonymousBookingHandler
  });

  // GET /bookings - List all bookings
  fastify.get('/', {
    preHandler: [authenticate, authorize(['admin', 'artist'])], // Apply auth and specific roles
    schema: listBookingsSchema,
    handler: listBookingsHandler
  });

  // GET /bookings/:id - Get booking by ID
  fastify.get('/:id', {
    preHandler: authenticate, // Apply authentication
    schema: getBookingByIdSchema,
    handler: getBookingByIdHandler
  });

  // PUT /bookings/:id - Update booking
  fastify.put('/:id', {
    preHandler: [authenticate, authorize(['admin', 'artist'])], // Apply auth and specific roles
    schema: updateBookingSchema,
    handler: updateBookingHandler
  });

  // POST /bookings/:id/cancel - Cancel a booking
  fastify.post('/:id/cancel', {
    preHandler: authenticate, // Apply authentication
    schema: cancelBookingSchema,
    handler: cancelBookingHandler
  });
  
  // Add deprecation notice middleware for this route
  fastify.addHook('onRequest', (request, reply, done) => {
    if (process.env.NODE_ENV === 'development') {
      // Only show deprecation warning in development
      fastify.log.warn('The /bookings routes are being deprecated in favor of /appointments. Please update your code.');
    }
    done();
  });
};

export default bookingRoutes; 