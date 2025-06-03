import { FastifyPluginAsync } from 'fastify';
//import { authenticate, authorize } from '../middleware/auth';

// Type definitions for request bodies and queries
interface CustomerQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateCustomerBody {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface UpdateCustomerBody {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

const customerRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all routes
  // TODO: Re-enable auth after testing
  // fastify.addHook('preHandler', authenticate);
  
  // GET /customers - List all customers (admin/artist only)
  fastify.get('/', {
    // TODO: Re-enable auth after testing
    // preHandler: authorize(['artist', 'admin']),
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
  }, async (request) => {
    const { search, page = 1, limit = 20 } = request.query as CustomerQueryParams;
    
    // Build where clause
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
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
    // TODO: Re-enable auth after testing
    // preHandler: authorize(['artist', 'admin']),
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
          orderBy: { startTime: 'desc' },
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
    const customerData = request.body as CreateCustomerBody;
    
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
    // TODO: Re-enable auth after testing
    // preHandler: authorize(['artist', 'admin']),
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
    const updateData = request.body as UpdateCustomerBody;
    
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
  
  // DELETE /customers/:id - Delete a customer (admin only)
  fastify.delete('/:id', {
    // TODO: Re-enable auth after testing
    // preHandler: authorize(['admin']),
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
    
    // Check if customer exists
    const customer = await fastify.prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: { take: 1 },
        tattooRequests: { take: 1 },
        payments: { take: 1 }
      }
    });
    
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }
    
    // Check if customer has related records
    const hasRelatedRecords = 
      customer.appointments.length > 0 || 
      customer.tattooRequests.length > 0 || 
      customer.payments.length > 0;
    
    if (hasRelatedRecords) {
      return reply.status(400).send({ 
        error: 'Cannot delete customer with existing appointments, tattoo requests, or payments' 
      });
    }
    
    // Delete the customer
    await fastify.prisma.customer.delete({
      where: { id }
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'DELETE',
        resource: 'Customer',
        resourceId: id,
        details: { customer }
      }
    });
    
    return { success: true, message: 'Customer deleted successfully' };
  });
};

export default customerRoutes;
