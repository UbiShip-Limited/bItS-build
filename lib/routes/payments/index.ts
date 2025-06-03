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

  // Register sub-routes
  fastify.register(adminRoutes, { prefix: '/' });
  fastify.register(coreRoutes, { prefix: '/' });
  fastify.register(consultationRoutes, { prefix: '/' });
  fastify.register(tattooRoutes, { prefix: '/' });
  fastify.register(refundRoutes, { prefix: '/' });
  fastify.register(paymentLinkRoutes, { prefix: '/' });
};

export default paymentRoutes;