import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth';
import adminRoutes from './admin';
import coreRoutes from './core';
import consultationRoutes from './consultation';
import tattooRoutes from './tattoo';
import refundRoutes from './refunds';
import paymentLinkRoutes from './paymentLinks';
import paymentStatsRoutes from './stats';

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication middleware to all routes EXCEPT health check
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for health check and test endpoints
    // Check both the URL and the route path to handle prefixes correctly
    const path = request.routerPath || request.url;
    const url = request.url;
    if (path === '/payments/health' || 
        path === '/payments/test' ||
        path === '/payments/debug' ||
        path === '/payments/simple' ||
        url === '/health' || 
        url === '/test' ||
        url === '/debug' ||
        url === '/simple' ||
        url.startsWith('/health?') ||
        url.startsWith('/test?') ||
        url.startsWith('/debug?') ||
        url.startsWith('/simple?')) {
      fastify.log.info('Skipping auth for health/test/debug/simple endpoint');
      return;
    }
    // Apply auth for all other routes
    return authenticate(request, reply);
  });
  
  fastify.log.info('🔄 Starting payment routes registration...');

  // Register sub-routes with unique prefixes to avoid conflicts
  try {
    fastify.register(coreRoutes);              // Core payment operations at /payments/ (no prefix needed)
    fastify.register(adminRoutes, { prefix: '/admin' });        // Admin operations at /payments/admin/
    fastify.register(consultationRoutes, { prefix: '/consultation' }); // Consultation payments at /payments/consultation/
    fastify.register(tattooRoutes, { prefix: '/tattoo' });      // Tattoo payments at /payments/tattoo/
    fastify.register(refundRoutes, { prefix: '/refunds' });     // Refund operations at /payments/refunds/
    fastify.register(paymentLinkRoutes, { prefix: '/links' });  // Payment links at /payments/links/
    fastify.register(paymentStatsRoutes);      // Stats and export at /payments/stats, /payments/export
    
    fastify.log.info('✅ Payment routes registered successfully');
  } catch (error) {
    fastify.log.error('❌ Error registering payment routes:', error);
    throw error;
  }
};

export default paymentRoutes;