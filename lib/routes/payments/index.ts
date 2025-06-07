import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import adminRoutes from './admin';
import coreRoutes from './core';
import consultationRoutes from './consultation';
import tattooRoutes from './tattoo';
import refundRoutes from './refunds';
import paymentLinkRoutes from './paymentLinks';

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);
  
  fastify.log.info('🔄 Starting payment routes registration...');

  // Register sub-routes with unique prefixes to avoid conflicts
  try {
    fastify.register(coreRoutes, { prefix: '/' });              // Core payment operations at /payments/
    fastify.register(adminRoutes, { prefix: '/admin' });        // Admin operations at /payments/admin/
    fastify.register(consultationRoutes, { prefix: '/consultation' }); // Consultation payments at /payments/consultation/
    fastify.register(tattooRoutes, { prefix: '/tattoo' });      // Tattoo payments at /payments/tattoo/
    fastify.register(refundRoutes, { prefix: '/refunds' });     // Refund operations at /payments/refunds/
    fastify.register(paymentLinkRoutes, { prefix: '/links' });  // Payment links at /payments/links/
    
    fastify.log.info('✅ Payment routes registered successfully');
  } catch (error) {
    fastify.log.error('❌ Error registering payment routes:', error);
    throw error;
  }
};

export default paymentRoutes;