import { RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../prisma/prisma';
import { UserWithRole } from '../../types/auth'; // Ensure this path and type are correct

export const getBookingByIdSchema: RouteShorthandOptions['schema'] = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
};

interface GetBookingByIdParams {
  id: string;
}

export async function getBookingByIdHandler(request: FastifyRequest<{ Params: GetBookingByIdParams }>, reply: FastifyReply) {
  const { id } = request.params;
  const user = request.user as UserWithRole; // Make sure UserWithRole is correctly imported

  try {
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
  } catch (error: unknown) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(500).send({
      success: false,
      message: 'Error fetching booking',
      error: errorMessage
    });
  }
} 