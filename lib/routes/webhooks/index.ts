import { FastifyPluginAsync } from 'fastify';
import squareWebhookRoutes from './square';

const webhookRoutes: FastifyPluginAsync = async (fastify, options) => {
  // Register webhook routes
  await fastify.register(squareWebhookRoutes);
};

export default webhookRoutes; 