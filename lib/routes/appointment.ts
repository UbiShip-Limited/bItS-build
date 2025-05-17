import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';

const appointmentRoutes: FastifyPluginAsync = async (fastify, options) => {
  // GET /appointments - List all appointments
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'canceled'] },
          customerId: { type: 'string' },
          artistId: { type: 'string' },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { status, customerId, artistId, from, to, page = 1, limit = 20 } = request.query as any;
    
    // Build where clause based on query parameters
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (artistId) where.artistId = artistId;
    
    // Date range filtering
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    
    const [appointments, total] = await Promise.all([
      fastify.prisma.appointment.findMany({
        where,
        include: {
          customer: true,
          artist: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.appointment.count({ where })
    ]);
    
    return {
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /appointments/:id - Get a specific appointment
  fastify.get('/:id', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const appointment = await fastify.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        artist: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }
    
    return appointment;
  });
  
  // POST /appointments - Create a new appointment
  fastify.post('/', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'date', 'duration'],
        properties: {
          customerId: { type: 'string' },
          artistId: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 }, // Duration in minutes
          status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'canceled'] },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { customerId, artistId, date, duration, status = 'pending', notes } = request.body as any;
    
    const appointment = await fastify.prisma.appointment.create({
      data: {
        customerId,
        artistId: artistId || request.user?.id,
        date: new Date(date),
        duration: duration,
        status,
        notes
      },
      include: { customer: true }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'Appointment',
        resourceId: appointment.id,
        details: { appointment }
      }
    });
    
    return appointment;
  });
  
  // PUT /appointments/:id - Update an appointment
  fastify.put('/:id', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
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
          date: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 30 },
          status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'canceled'] },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData: any = request.body;
    
    // Get original for audit log
    const original = await fastify.prisma.appointment.findUnique({
      where: { id }
    });
    
    if (!original) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }
    
    // Convert duration to interval if provided
    if (updateData.duration) {
      updateData.duration = `${updateData.duration} minutes`;
    }
    
    // Convert date to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    const updated = await fastify.prisma.appointment.update({
      where: { id },
      data: updateData
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'Appointment',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    return updated;
  });
  
  // DELETE (soft delete) /appointments/:id - Cancel an appointment
  fastify.delete('/:id', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const appointment = await fastify.prisma.appointment.findUnique({
      where: { id }
    });
    
    if (!appointment) {
      return reply.status(404).send({ error: 'Appointment not found' });
    }
    
    // Instead of hard delete, we update status to 'canceled'
    const canceled = await fastify.prisma.appointment.update({
      where: { id },
      data: { status: 'canceled' }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CANCEL',
        resource: 'Appointment',
        resourceId: id,
        details: { before: appointment, after: canceled }
      }
    });
    
    return { success: true, message: 'Appointment canceled successfully' };
  });
};

export default appointmentRoutes;
