import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';

const tattooRequestsRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);
  
  // GET /tattoo-requests - List tattoo requests (admin only)
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['new', 'reviewed', 'approved', 'rejected'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { status, page = 1, limit = 20 } = request.query as any;
    
    const where = status ? { status } : {};
    
    const [tattooRequests, total] = await Promise.all([
      fastify.prisma.tattooRequest.findMany({
        where,
        include: { customer: true, images: true },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.tattooRequest.count({ where })
    ]);
    
    return {
      data: tattooRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /tattoo-requests/:id - Get details of a specific tattoo request
  fastify.get('/:id', {
    preHandler: authorize(['artist', 'admin']),
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
    
    const tattooRequest = await fastify.prisma.tattooRequest.findUnique({
      where: { id },
      include: { customer: true, images: true }
    });
    
    if (!tattooRequest) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    return tattooRequest;
  });
  
  // POST /tattoo-requests - Submit a new tattoo request
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'description'],
        properties: {
          customerId: { type: 'string' },
          description: { type: 'string' },
          placement: { type: 'string' },
          size: { type: 'string' },
          colorPreference: { type: 'string' },
          style: { type: 'string' },
          referenceImages: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                publicId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { customerId, description, placement, size, colorPreference, style, referenceImages } = request.body as any;
    
    // Create the tattoo request
    const tattooRequest = await fastify.prisma.tattooRequest.create({
      data: {
        customerId,
        description,
        placement,
        size,
        colorPreference,
        style,
        referenceImages: referenceImages || []
      }
    });
    
    // Log the audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'TattooRequest',
        resourceId: tattooRequest.id,
        details: { tattooRequest }
      }
    });
    
    return tattooRequest;
  });
  
  // PUT /tattoo-requests/:id - Update a tattoo request
  fastify.put('/:id', {
    preHandler: authorize(['artist', 'admin']),
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
          status: { type: 'string', enum: ['new', 'reviewed', 'approved', 'rejected'] },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    
    // Get original for audit log
    const original = await fastify.prisma.tattooRequest.findUnique({ where: { id } });
    
    if (!original) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    const updated = await fastify.prisma.tattooRequest.update({
      where: { id },
      data: updateData
    });
    
    // Log the audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'TattooRequest',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    return updated;
  });
};

export default tattooRequestsRoutes;
