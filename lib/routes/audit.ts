import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';

const auditRoutes: FastifyPluginAsync = async (fastify, options) => {
  // GET /audit-logs - List all audit logs with filtering
  fastify.get('/', {
    preHandler: authorize(['admin'] as UserRole[]), // Restrict to admin only
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'CANCEL'] },
          resource: { type: 'string' },
          resourceId: { type: 'string' },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { userId, action, resource, resourceId, from, to, page = 1, limit = 20 } = request.query as any;
    
    // Build where clause based on query parameters
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    
    // Date range filtering
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    
    const [auditLogs, total] = await Promise.all([
      fastify.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.auditLog.count({ where })
    ]);
    
    return {
      data: auditLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /audit-logs/:id - Get a specific audit log
  fastify.get('/:id', {
    preHandler: authorize(['admin'] as UserRole[]),
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
    
    const auditLog = await fastify.prisma.auditLog.findUnique({
      where: { id }
    });
    
    if (!auditLog) {
      return reply.status(404).send({ error: 'Audit log not found' });
    }
    
    return auditLog;
  });
  
  // GET /audit-logs/resources/:resource - Get audit logs for a specific resource type
  fastify.get('/resources/:resource', {
    preHandler: authorize(['admin'] as UserRole[]),
    schema: {
      params: {
        type: 'object',
        required: ['resource'],
        properties: {
          resource: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { resource } = request.params as { resource: string };
    const { page = 1, limit = 20 } = request.query as any;
    
    const [auditLogs, total] = await Promise.all([
      fastify.prisma.auditLog.findMany({
        where: { resource },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.auditLog.count({ where: { resource } })
    ]);
    
    return {
      data: auditLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
  
  // GET /audit-logs/resource/:resource/:resourceId - Get audit logs for a specific resource
  fastify.get('/resource/:resource/:resourceId', {
    preHandler: authorize(['admin', 'artist'] as UserRole[]), // Allow artists to see audit logs for resources they work with
    schema: {
      params: {
        type: 'object',
        required: ['resource', 'resourceId'],
        properties: {
          resource: { type: 'string' },
          resourceId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    const { resource, resourceId } = request.params as { resource: string, resourceId: string };
    const { page = 1, limit = 20 } = request.query as any;
    
    const [auditLogs, total] = await Promise.all([
      fastify.prisma.auditLog.findMany({
        where: { 
          resource,
          resourceId
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      fastify.prisma.auditLog.count({ 
        where: { 
          resource,
          resourceId
        } 
      })
    ]);
    
    return {
      data: auditLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  });
};

export default auditRoutes;
