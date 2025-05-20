import { RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify';
import BookingService from '../../services/bookingService';
import { prisma } from '../../prisma/prisma';
import { UserWithRole } from '../../types/auth';

export const cancelBookingSchema: RouteShorthandOptions['schema'] = {
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
};

interface CancelBookingParams {
  id: string;
}

interface CancelBookingBody {
  reason?: string;
  notifyCustomer?: boolean;
}

export async function cancelBookingHandler(this: any, request: FastifyRequest<{ Params: CancelBookingParams, Body: CancelBookingBody }>, reply: FastifyReply) {
  const { id } = request.params;
  const { reason, notifyCustomer = true } = request.body; // Default for notifyCustomer here
  const bookingService: BookingService = this.bookingService;
  const user = request.user as UserWithRole;

  try {
    const existingBooking = await prisma.appointment.findUnique({
      where: { id },
      include: {
        // customer: true, // Not strictly needed for permission check if only IDs are used
        artist: true // artist.id is needed
      }
    });

    if (!existingBooking) {
      return reply.code(404).send({
        success: false,
        message: 'Booking not found'
      });
    }

    if (user.role !== 'admin' &&
        existingBooking.artist?.id !== user.id &&
        existingBooking.customerId !== user.id) {
      return reply.code(403).send({
        success: false,
        message: 'You do not have permission to cancel this booking'
      });
    }

    const result = await bookingService.cancelBooking({
      bookingId: id,
      reason,
      cancelledBy: user.id
      // notifyCustomer logic would be handled by the service or here
    });
    
    // TODO: Implement customer notification via email or SMS if notifyCustomer is true and result was successful

    return result; // The service already returns a { success, booking, squareCancelled } like object
  } catch (error: any) {
    request.log.error(error);
    // The service might throw specific errors, handle them if needed
    return reply.code(500).send({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
} 