import { RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify';
import { BookingType } from '../../services/bookingService';
import BookingService from '../../services/bookingService';
import { prisma } from '../../prisma/prisma'; // Assuming prisma client is exported this way

export const createAnonymousBookingSchema: RouteShorthandOptions['schema'] = {
  body: {
    type: 'object',
    required: ['startAt', 'duration', 'bookingType', 'contactEmail'],
    properties: {
      startAt: { type: 'string', format: 'date-time' },
      duration: { type: 'integer', minimum: 15 },
      bookingType: {
        type: 'string',
        enum: [
          BookingType.CONSULTATION,
          BookingType.DRAWING_CONSULTATION
        ]
      },
      contactEmail: { type: 'string', format: 'email' },
      contactPhone: { type: 'string' },
      note: { type: 'string' },
      tattooRequestId: { type: 'string' }
    }
  }
};

interface CreateAnonymousBookingBody {
  startAt: string;
  duration: number;
  bookingType: BookingType;
  contactEmail: string;
  contactPhone?: string;
  note?: string;
  tattooRequestId?: string;
}

// Add proper typing for fastify instance with bookingService
interface FastifyInstanceWithBookingService {
  bookingService: BookingService;
}

export async function createAnonymousBookingHandler(this: FastifyInstanceWithBookingService, request: FastifyRequest<{ Body: CreateAnonymousBookingBody }>, reply: FastifyReply) {
  const {
    startAt,
    duration,
    bookingType,
    contactEmail,
    contactPhone,
    note,
    tattooRequestId
  } = request.body;

  const bookingService: BookingService = this.bookingService;

  try {
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

      if (tattooRequest.customerId) {
        return reply.code(400).send({
          success: false,
          message: 'This tattoo request belongs to a registered customer and requires authentication'
        });
      }

      // Check if tattoo request has contactEmail for anonymous requests
      if (tattooRequest.contactEmail && tattooRequest.contactEmail !== contactEmail) {
        return reply.code(400).send({
          success: false,
          message: 'Email does not match the tattoo request contact email'
        });
      }
    }

    const result = await bookingService.createBooking({
      startAt: new Date(startAt),
      duration,
      bookingType,
      contactEmail,
      contactPhone,
      note,
      tattooRequestId,
      isAnonymous: true
    });

    return {
      success: true,
      message: 'Anonymous booking created successfully',
      booking: result.booking,
      trackingCode: result.booking.id // Use booking ID as tracking code
    };
  } catch (error: unknown) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('not found')) {
      return reply.code(404).send({
        success: false,
        message: errorMessage
      });
    }
    return reply.code(500).send({
      success: false,
      message: 'Error creating anonymous booking',
      error: errorMessage
    });
  }
} 