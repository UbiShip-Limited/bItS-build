import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth.js';
import { UserRole } from '../types/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

const tattooRequestsRoutes: FastifyPluginAsync = async (fastify, options) => {
  // GET /tattoo-requests - List tattoo requests (admin only)
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin'] as UserRole[]),
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
    
    reply.type('application/json');
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
    
    const tattooRequest = await fastify.prisma.tattooRequest.findUnique({
      where: { id },
      include: { customer: true, images: true }
    });
    
    if (!tattooRequest) {
      return reply.status(404).send({ error: 'Tattoo request not found' });
    }
    
    reply.type('application/json');
    return tattooRequest;
  });
  
  // POST /tattoo-requests - Submit a new tattoo request
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['description'],
        properties: {
          customerId: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          contactPhone: { type: 'string' },
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
        },
        // Either customerId OR contactEmail must be provided
        oneOf: [
          { required: ['customerId'] },
          { required: ['contactEmail'] }
        ]
      }
    }
  }, async (request, reply) => {
    const { 
      customerId, 
      contactEmail,
      contactPhone,
      description, 
      placement, 
      size, 
      colorPreference, 
      style, 
      referenceImages 
    } = request.body as any;
    
    // Generate tracking token for anonymous requests
    const trackingToken = !customerId ? uuidv4() : null;
    
    // Create the tattoo request with the right structure
    const tattooRequestData: any = {
      description,
      placement,
      size,
      colorPreference,
      style,
      referenceImages: referenceImages || []
    };
    
    // Add either customer ID or anonymous fields
    if (customerId) {
      tattooRequestData.customerId = customerId;
    } else {
      // Add anonymous request fields
      if (contactEmail) tattooRequestData.contactEmail = contactEmail;
      if (contactPhone) tattooRequestData.contactPhone = contactPhone;
      if (trackingToken) tattooRequestData.trackingToken = trackingToken;
    }
    
    // Create the tattoo request
    const tattooRequest = await fastify.prisma.tattooRequest.create({
      data: tattooRequestData
    });
    
    // Log the audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'TattooRequest',
        resourceId: tattooRequest.id,
        details: { 
          tattooRequest,
          isAnonymous: !customerId
        }
      }
    });
    
    reply.type('application/json');
    return tattooRequest;
  });
  
  // PUT /tattoo-requests/:id - Update a tattoo request
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
    
    reply.type('application/json');
    return updated;
  });
};

export default tattooRequestsRoutes;
