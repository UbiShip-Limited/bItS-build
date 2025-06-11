import { FastifyPluginAsync } from 'fastify';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Staff access code verification endpoint
  fastify.post('/verify-staff-access', async (request, reply) => {
    try {
      const { accessCode } = request.body as { accessCode: string };
      
      fastify.log.info('🔍 Staff access verification attempt');
      
      // Validate input
      if (!accessCode || typeof accessCode !== 'string') {
        fastify.log.warn('❌ Invalid or missing access code in request');
        return reply.status(400).send({
          success: false,
          error: 'Access code is required'
        });
      }
      
      // Get staff access code from environment
      const correctAccessCode = process.env.STAFF_ACCESS_CODE;
      
      if (!correctAccessCode) {
        fastify.log.error('❌ STAFF_ACCESS_CODE not configured in environment');
        return reply.status(503).send({
          success: false,
          error: 'Staff access system not configured'
        });
      }
      
      // Verify access code
      const isValid = accessCode === correctAccessCode;
      
      if (isValid) {
        fastify.log.info('✅ Staff access code verified successfully');
        return reply.send({
          success: true,
          message: 'Access granted'
        });
      } else {
        fastify.log.warn('❌ Invalid staff access code provided');
        
        // Small delay to prevent brute force attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return reply.status(401).send({
          success: false,
          error: 'Invalid access code'
        });
      }
      
    } catch (error) {
      fastify.log.error(error, 'Staff access verification error');
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
};

export default authRoutes; 