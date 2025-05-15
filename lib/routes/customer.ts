import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';

const customerRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticate);
  
  // GET /customers - List all customers (admin/artist only)
  fastify.get('/', {
    preHandler: authorize(['artist', 'admin']),
    schema: {
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { search, page = 1, limit = 20 } = request.query as any;
    
    // Build where clause
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    } : {};
    
    const [customers, total] = await Promise.all([
      fastify.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      fastify.prisma.customer.count({ where })
    ]);
    
    return {
      data: customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /customers/:id - Get a specific customer
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
    
    const customer = await fastify.prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          take: 5
        },
        tattooRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }
    
    return customer;
  });
  
  // POST /customers - Create a new customer
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const customerData = request.body as any;
    
    // Check if customer with email already exists
    if (customerData.email) {
      const existing = await fastify.prisma.customer.findUnique({
        where: { email: customerData.email }
      });
      
      if (existing) {
        return reply.status(409).send({ 
          error: 'Customer with this email already exists',
          customerId: existing.id
        });
      }
    }
    
    const customer = await fastify.prisma.customer.create({
      data: customerData
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'Customer',
        resourceId: customer.id,
        details: { customer }
      }
    });
    
    return customer;
  });
  
  // PUT /customers/:id - Update customer information
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
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    
    // Get original for audit
    const original = await fastify.prisma.customer.findUnique({
      where: { id }
    });
    
    if (!original) {
      return reply.status(404).send({ error: 'Customer not found' });
    }
    
    // Check email uniqueness if being updated
    if (updateData.email && updateData.email !== original.email) {
      const existing = await fastify.prisma.customer.findUnique({
        where: { email: updateData.email }
      });
      
      if (existing && existing.id !== id) {
        return reply.status(409).send({ error: 'Email already in use by another customer' });
      }
    }
    
    const updated = await fastify.prisma.customer.update({
      where: { id },
      data: updateData
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'Customer',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    return updated;
  });
};

export default customerRoutes;
