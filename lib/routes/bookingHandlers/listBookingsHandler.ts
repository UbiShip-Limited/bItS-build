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

interface WhereClause {
  status?: string;
  type?: string;
  customerId?: string;
  artistId?: string;
  startTime?: { gte?: Date; lte?: Date };
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
  const where: WhereClause = {};

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }
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
  } catch (error: unknown) {
    request.log.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(500).send({
      success: false,
      message: 'Error fetching bookings',
      error: errorMessage
    });
  }
} 