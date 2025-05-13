import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import authRoutes from './auth';

/**
 * Main router that registers all API routes
 */
export default async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  // Register auth routes
  fastify.register(authRoutes, { prefix: '/auth' });
  
  // Add other routes here as they're implemented
  // Example:
  // fastify.register(customerRoutes, { prefix: '/customers' });
  // fastify.register(tattooRequestRoutes, { prefix: '/tattoo-requests' });
  // fastify.register(appointmentRoutes, { prefix: '/appointments' });
}; 