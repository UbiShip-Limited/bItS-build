import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import adminRoutes from './admin.js';
import coreRoutes from './core.js';
import consultationRoutes from './consultation.js';
import tattooRoutes from './tattoo.js';
import refundRoutes from './refunds.js';
import paymentLinkRoutes from './paymentLinks.js';

const paymentRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);

  // Register sub-routes
  fastify.register(adminRoutes, { prefix: '/' });
  fastify.register(coreRoutes, { prefix: '/' });
  fastify.register(consultationRoutes, { prefix: '/' });
  fastify.register(tattooRoutes, { prefix: '/' });
  fastify.register(refundRoutes, { prefix: '/' });
  fastify.register(paymentLinkRoutes, { prefix: '/' });
};

export default paymentRoutes;