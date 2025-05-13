import Fastify, { FastifyInstance } from 'fastify';
import prismaPlugin from './plugins/prisma'; // Path to your prisma plugin
// import { User } from '@prisma/client'; // Example: Import Prisma types if needed
import { pathToFileURL } from 'url'; // <--- Add this import

// Initialize Fastify
const build = (opts = {}): FastifyInstance => {
  const fastify = Fastify(opts);

  // Register Prisma plugin
  fastify.register(prismaPlugin);

  // Example route using Prisma (you can remove this later)
  fastify.get('/users', async (request, reply) => {
    try {
      // Access Prisma via the decorated fastify instance
      const users = await fastify.prisma.user.findMany();
      reply.send(users);
    } catch (error) {
      request.log.error(error, 'Error fetching users');
      reply.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  // TODO: Register your other routes and plugins here
  return fastify;
};

// Function to start the server
const start = async (fastifyInstance: FastifyInstance) => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001; // Default to port 3001 for the backend
    await fastifyInstance.listen({ port, host: '0.0.0.0' }); // Listen on all available network interfaces
    // fastifyInstance.log.info(`Backend server listening on port ${port}`); // logger might not be set yet if not passed in build opts
  } catch (err) {
    fastifyInstance.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown (applies to the instance that is started)
// This logic might be better handled if server is started by a top level FastifyInstance
// For now, we'll keep it simple. If the app is started directly, it will attach to that instance.

// Main function to build and start server if run directly
const main = async () => {
  const app = build({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  });

  await start(app);
};

// Start the server only if this file is run directly (not imported as a module)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

// Export the build function for testing or programmatic use
export { build };

// Export the Fastify instance if you need to import it elsewhere (e.g., for testing)
// export default fastify;
