import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import config from './config'; // Import the configuration

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify({
  logger: config.NODE_ENV !== 'production' ? {
    level: config.LOG_LEVEL, // Use LOG_LEVEL from config
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

const start = async () => {
  try {
    // Use PORT and HOST from the imported config
    await server.listen({ port: config.PORT, host: config.HOST });
    // Corrected to access the address after server is listening, especially if port is 0 (dynamic)
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    server.log.info(`Server listening on http://${config.HOST}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, shutting down gracefully...`);
    await server.close();
    process.exit(0);
  });
});

export default server; // Export for testing or programmatic use
export { start }; // Export start function for potential use in app.ts
