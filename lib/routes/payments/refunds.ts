import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/auth.js';
import PaymentService from '../../services/paymentService.js';

const refundRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Initialize services
  const paymentService = new PaymentService();

  // POST /payments/:id/refund - Process a payment refund
  fastify.post('/:id/refund', {
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
          amount: { type: 'number', description: 'Amount to refund. If not provided, the full amount will be refunded' },
          reason: { type: 'string', description: 'Reason for the refund' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { amount, reason } = request.body as { amount?: number; reason?: string };
    
    try {
      const refundResult = await paymentService.refundPayment(id, amount, reason);
      
      // Log audit
      await fastify.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'REFUND',
          resource: 'Payment',
          resourceId: id,
          details: { amount, reason }
        }
      });
      
      return {
        success: true,
        payment: refundResult.payment,
        refund: refundResult.refund
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        success: false, 
        message: 'Failed to process refund', 
        error: error.message 
      });
    }
  });
};

export default refundRoutes;