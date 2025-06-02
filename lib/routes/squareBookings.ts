import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import BookingService from '../services/bookingService';
import { AvailabilityService } from '../services/availabilityService';
import { UserRole } from '../types/auth';

/**
 * Square-aligned booking routes
 * Implements endpoints that mirror Square's Bookings API structure
 */
const squareBookingRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services
  const bookingService = new BookingService();
  const availabilityService = new AvailabilityService();
  
  // Decorate fastify instance
  if (!fastify.hasDecorator('bookingService')) {
    fastify.decorate('bookingService', bookingService);
  }
  if (!fastify.hasDecorator('availabilityService')) {
    fastify.decorate('availabilityService', availabilityService);
  }

  /**
   * POST /square-bookings/availability/search
   * Aligns with Square's POST /v2/bookings/availability/search
   */
  fastify.post('/availability/search', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'object',
            required: ['filter'],
            properties: {
              filter: {
                type: 'object',
                required: ['startAtRange'],
                properties: {
                  startAtRange: {
                    type: 'object',
                    required: ['startAt', 'endAt'],
                    properties: {
                      startAt: { type: 'string', format: 'date-time' },
                      endAt: { type: 'string', format: 'date-time' }
                    }
                  },
                  locationId: { type: 'string' },
                  segmentFilters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        serviceVariationId: { type: 'string' },
                        teamMemberIdFilter: {
                          type: 'object',
                          properties: {
                            any: {
                              type: 'array',
                              items: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { query } = request.body as any;
      const { filter } = query;
      const { startAtRange, locationId, segmentFilters } = filter;
      
      // Extract team member IDs from segment filters
      const teamMemberIds = segmentFilters?.[0]?.teamMemberIdFilter?.any;
      const serviceVariationId = segmentFilters?.[0]?.serviceVariationId;
      
      const result = await bookingService.searchBookingAvailability({
        startAtMin: new Date(startAtRange.startAt),
        startAtMax: new Date(startAtRange.endAt),
        locationId,
        teamMemberIds,
        serviceVariationId,
        duration: 60, // Default duration, could be made configurable
        maxResults: 50
      });
      
      return {
        availabilities: result.availabilities.map(slot => ({
          startAt: slot.startAt.toISOString(),
          locationId: slot.locationId,
          appointmentSegments: [{
            durationMinutes: slot.durationMinutes,
            teamMemberId: slot.availableTeamMembers[0] || 'any'
          }]
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * GET /square-bookings/business-booking-profile
   * Aligns with Square's GET /v2/bookings/business-booking-profile
   */
  fastify.get('/business-booking-profile', {
    preHandler: [authenticate, authorize(['admin'] as UserRole[])]
  }, async (request, reply) => {
    try {
      const profile = await bookingService.getBusinessBookingProfile();
      return { businessBookingProfile: profile };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * GET /square-bookings/location-booking-profiles
   * Aligns with Square's GET /v2/bookings/location-booking-profiles
   */
  fastify.get('/location-booking-profiles', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          cursor: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const profiles = await bookingService.getLocationBookingProfiles();
      return { 
        locationBookingProfiles: profiles,
        cursor: null // No pagination for now
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * GET /square-bookings/location-booking-profiles/:locationId
   * Aligns with Square's GET /v2/bookings/location-booking-profiles/{location_id}
   */
  fastify.get('/location-booking-profiles/:locationId', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      params: {
        type: 'object',
        required: ['locationId'],
        properties: {
          locationId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { locationId } = request.params as { locationId: string };
      const profiles = await bookingService.getLocationBookingProfiles();
      const profile = profiles.find(p => p.locationId === locationId);
      
      if (!profile) {
        return reply.code(404).send({
          errors: [{
            category: 'INVALID_REQUEST_ERROR',
            code: 'NOT_FOUND',
            detail: 'Location booking profile not found'
          }]
        });
      }
      
      return { locationBookingProfile: profile };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * GET /square-bookings/team-member-booking-profiles
   * Aligns with Square's GET /v2/bookings/team-member-booking-profiles
   */
  fastify.get('/team-member-booking-profiles', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          bookableOnly: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          cursor: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const profiles = await bookingService.getTeamMemberBookingProfiles();
      return { 
        teamMemberBookingProfiles: profiles,
        cursor: null // No pagination for now
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * POST /square-bookings/team-member-booking-profiles/bulk-retrieve
   * Aligns with Square's POST /v2/bookings/team-member-booking-profiles/bulk-retrieve
   */
  fastify.post('/team-member-booking-profiles/bulk-retrieve', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      body: {
        type: 'object',
        required: ['teamMemberIds'],
        properties: {
          teamMemberIds: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 100
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { teamMemberIds } = request.body as { teamMemberIds: string[] };
      const profiles = await bookingService.getTeamMemberBookingProfiles(teamMemberIds);
      return { teamMemberBookingProfiles: profiles };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * GET /square-bookings/team-member-booking-profiles/:teamMemberId
   * Aligns with Square's GET /v2/bookings/team-member-booking-profiles/{team_member_id}
   */
  fastify.get('/team-member-booking-profiles/:teamMemberId', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      params: {
        type: 'object',
        required: ['teamMemberId'],
        properties: {
          teamMemberId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { teamMemberId } = request.params as { teamMemberId: string };
      const profiles = await bookingService.getTeamMemberBookingProfiles([teamMemberId]);
      const profile = profiles[0];
      
      if (!profile) {
        return reply.code(404).send({
          errors: [{
            category: 'INVALID_REQUEST_ERROR',
            code: 'NOT_FOUND',
            detail: 'Team member booking profile not found'
          }]
        });
      }
      
      return { teamMemberBookingProfile: profile };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * POST /square-bookings/bulk-retrieve
   * Aligns with Square's POST /v2/bookings/bulk-retrieve
   */
  fastify.post('/bulk-retrieve', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      body: {
        type: 'object',
        required: ['bookingIds'],
        properties: {
          bookingIds: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 100
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { bookingIds } = request.body as { bookingIds: string[] };
      const result = await bookingService.bulkRetrieveBookings(bookingIds);
      
      return {
        bookings: result.bookings,
        errors: result.errors.map(error => ({
          category: 'INVALID_REQUEST_ERROR',
          code: 'NOT_FOUND',
          detail: error.error,
          field: 'booking_id'
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * POST /square-bookings/validate
   * Custom endpoint for validating booking rules before creation
   */
  fastify.post('/validate', {
    schema: {
      body: {
        type: 'object',
        required: ['startAt', 'duration'],
        properties: {
          startAt: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 15 },
          customerId: { type: 'string' },
          artistId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { startAt, duration, customerId, artistId } = request.body as any;
      
      const validation = await bookingService.validateBookingRules({
        startAt: new Date(startAt),
        duration,
        customerId,
        artistId
      });
      
      return {
        valid: validation.valid,
        errors: validation.errors.map(error => ({
          category: 'INVALID_REQUEST_ERROR',
          code: 'INVALID_VALUE',
          detail: error
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });

  /**
   * GET /square-bookings/business-hours
   * Custom endpoint for getting business hours
   */
  fastify.get('/business-hours', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { date } = request.query as { date?: string };
      
      if (date) {
        const queryDate = new Date(date);
        const dayOfWeek = queryDate.getDay();
        const businessHours = availabilityService.getBusinessHoursForDay(dayOfWeek);
        
        return {
          date,
          businessHours: businessHours ? [businessHours] : []
        };
      }
      
      // Return all business hours if no specific date
      const profiles = await bookingService.getLocationBookingProfiles();
      return {
        businessHours: profiles[0]?.businessHours || []
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        errors: [{
          category: 'API_ERROR',
          code: 'INTERNAL_SERVER_ERROR',
          detail: error.message
        }]
      });
    }
  });
};

export default squareBookingRoutes; 