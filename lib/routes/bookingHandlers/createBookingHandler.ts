import { RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify';
import { BookingType, BookingStatus } from '../../services/bookingService'; // Adjust path as needed
import BookingService from '../../services/bookingService'; // Adjust path as needed
import { UserWithRole } from '../../types/auth'; // Corrected User type import

export const createBookingSchema: RouteShorthandOptions['schema'] = {
  body: {
    type: 'object',
    required: ['startAt', 'duration', 'bookingType'],
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
    },
    oneOf: [
      { required: ['customerId'] },
      { required: ['customerEmail'] }
    ]
  }
};

interface CreateBookingBody {
  startAt: string;
  duration: number;
  customerId?: string;
  bookingType: BookingType;
  artistId?: string;
  customerEmail?: string;
  customerPhone?: string;
  note?: string;
  priceQuote?: number;
  status?: BookingStatus;
  tattooRequestId?: string;
}

// Add proper typing for fastify instance with bookingService
interface FastifyInstanceWithBookingService {
  bookingService: BookingService;
}

export async function createBookingHandler(this: FastifyInstanceWithBookingService, request: FastifyRequest<{ Body: CreateBookingBody }>, reply: FastifyReply) {
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
  } = request.body;

  // bookingService needs to be available, typically via `this.bookingService` or passed in
  const bookingService: BookingService = this.bookingService; 
  const user = request.user as UserWithRole; // Corrected User type

  try {
    if (artistId) {
      const isAdmin = user.role === 'admin';
      const isArtistBookingThemselves = artistId === user.id && user.role === 'artist';

      if (!isAdmin && !isArtistBookingThemselves) {
        return reply.code(403).send({
          success: false,
          message: 'You do not have permission to book this artist'
        });
      }
    }

    const result = await bookingService.createBooking({
      startAt: new Date(startAt),
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
    });

    return {
      success: true,
      message: 'Booking created successfully',
      booking: result.booking,
      squareBooking: result.squareBooking
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
    if (errorMessage === 'Tattoo request does not belong to this customer') {
      return reply.code(400).send({
        success: false,
        message: errorMessage
      });
    }
    return reply.code(500).send({
      success: false,
      message: 'Error creating booking',
      error: errorMessage
    });
  }
} 