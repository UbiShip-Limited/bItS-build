import { RouteShorthandOptions, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../prisma/prisma';

export const listBookingsSchema: RouteShorthandOptions['schema'] = {
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string' },
      endDate: { type: 'string' },
      status: { type: 'string' },
      type: { type: 'string' },
      customerId: { type: 'string' },
      artistId: { type: 'string' },
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
    }
  }
};

interface ListBookingsQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  customerId?: string;
  artistId?: string;
  page?: number;
  limit?: number;
}

export async function listBookingsHandler(request: FastifyRequest<{ Querystring: ListBookingsQuery }>, reply: FastifyReply) {
  const {
    startDate,
    endDate,
    status,
    type,
    customerId,
    artistId,
    page = 1,
    limit = 20
  } = request.query;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (startDate) where.startTime = { gte: new Date(startDate) };
  if (endDate) where.endTime = { lte: new Date(endDate) }; // Note: Original code used endTime, but filter was on startTime. This might be a bug or intentional. Keeping as endTime for now.
  if (status) where.status = status;
  if (type) where.type = type;
  if (customerId) where.customerId = customerId;
  if (artistId) where.artistId = artistId;

  try {
    const [bookings, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          customer: true,
          artist: true,
          invoices: true
        }
      }),
      prisma.appointment.count({ where })
    ]);

    return {
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
} 