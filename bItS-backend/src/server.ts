import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify({
  logger: process.env.NODE_ENV !== 'production' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : true, // Enable default JSON logger for production
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
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001; // Default to 3001 for backend
    const host = process.env.HOST || '0.0.0.0'; // Listen on all available interfaces

    await server.listen({ port, host });
    server.log.info(`Server listening on http://${host}:${port}`);
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
