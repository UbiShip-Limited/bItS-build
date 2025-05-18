import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth.js';
import PaymentService from '../../services/paymentService.js';

const coreRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Initialize services
  const paymentService = new PaymentService();

  // POST /payments - Create a new payment
  fastify.post('/', {
    preHandler: authorize(['admin']),
    schema: {
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
          paymentMethod: { type: 'string' },
          paymentDetails: { type: 'object' },
          squareId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const paymentData = request.body as any;
    
    const payment = await fastify.prisma.payment.create({
      data: paymentData
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        details: { payment }
      }
    });
    
    return payment;
  });

  // PUT /payments/:id - Update payment information
  fastify.put('/:id', {
    preHandler: authorize(['admin']),
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
          status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
          paymentMethod: { type: 'string' },
          paymentDetails: { type: 'object' },
          squareId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    
    // Get original for audit
    const original = await fastify.prisma.payment.findUnique({
      where: { id }
    });
    
    if (!original) {
      return reply.status(404).send({ error: 'Payment not found' });
    }
    
    const updated = await fastify.prisma.payment.update({
      where: { id },
      data: updateData
    });
    
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.id,
        action: 'UPDATE',
        resource: 'Payment',
        resourceId: id,
        details: { before: original, after: updated }
      }
    });
    
    return updated;
  });
};

export default coreRoutes;