import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import config from './config'; // Ensure config is loaded

// Import application modules like routes, plugins, services as needed later
// Example:
// import authPlugin from './auth/authPlugin';
// import customerRoutes from './routes/customerRoutes';

// Create Fastify instance
const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify({
  logger: config.NODE_ENV !== 'production' ? {
    level: config.LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : { level: config.LOG_LEVEL }, // Use LOG_LEVEL for production, default JSON logger
});

// Health check route
const healthCheckOpts: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string' },
        },
      },
    },
  },
};

server.get('/health', healthCheckOpts, async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Graceful shutdown logic
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, shutting down gracefully...`);
    await server.close();
    process.exit(0);
  });
});

const main = async () => {
  try {
    // Register application-specific plugins, routes, hooks, etc. here
    // Example:
    // await server.register(authPlugin);
    // await server.register(customerRoutes, { prefix: '/api/v1/customers' });

    server.log.info('Starting server...');
    // Use PORT and HOST from the imported config
    await server.listen({ port: config.PORT, host: config.HOST });

    // Log the actual listening address
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    // Ensure host is included, falling back to config.HOST if needed
    const host = typeof address === 'string' ? 'unknown' : (address?.address || config.HOST);
    server.log.info(`Server listening on http://${host}:${port}`);

  } catch (err) {
    server.log.error('Error starting server:', err);
    process.exit(1);
  }
};

// Start the application
main();

// Export server for testing or specific use cases if needed
// export default server; // Usually not needed if app.ts is just the entry point
