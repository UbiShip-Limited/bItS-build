import { RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify';
import { BookingStatus } from '../../services/bookingService';
import BookingService from '../../services/bookingService';
import { prisma } from '../../prisma/prisma';
import { UserWithRole } from '../../types/auth';

export const updateBookingSchema: RouteShorthandOptions['schema'] = {
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
};

interface UpdateBookingParams {
  id: string;
}

interface UpdateBookingBody {
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: BookingStatus;
  artistId?: string;
  notes?: string;
  priceQuote?: number;
}

export async function updateBookingHandler(this: any, request: FastifyRequest<{ Params: UpdateBookingParams, Body: UpdateBookingBody }>, reply: FastifyReply) {
  const { id } = request.params;
  const { startTime, endTime, duration, status, artistId, notes, priceQuote } = request.body;
  const bookingService: BookingService = this.bookingService;
  const user = request.user as UserWithRole;

  try {
    // Existing booking check is done by the service, but could be duplicated here for early exit
    // For now, rely on service to throw if not found.

    const result = await bookingService.updateBooking({
      bookingId: id,
      startAt: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration,
      status,
      artistId,
      note: notes,
      priceQuote
    });

    // Audit log (consider moving to service layer if it's a general concern for all updates)
    const existingBooking = await prisma.appointment.findUnique({ where: { id } }); // Re-fetch for previousStatus
    if (existingBooking) {
        await prisma.auditLog.create({
            data: {
              action: 'booking_updated',
              resource: 'appointment',
              resourceId: id,
              userId: user.id,
              details: {
                previousStatus: existingBooking.status,
                newStatus: status || existingBooking.status,
                changes: request.body // Simplified, might want to log specific changed fields
              } as any // Cast to any if Prisma complains about JSON structure
            }
        });
    }


    return {
      success: true,
      booking: result.booking,
      squareBookingUpdated: result.squareBookingUpdated
    };
  } catch (error: any) {
    request.log.error(error);
    if (error.message.includes('not found')) { // Specific error from service
        return reply.code(404).send({
            success: false,
            message: error.message
        });
    }
    return reply.code(500).send({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
} 