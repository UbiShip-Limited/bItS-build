import 'dotenv/config';
// For specifically loading .env.local
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
config({ path: '.env.local' });

// Set default Cloudinary URL if not provided to prevent initialization errors
if (!process.env.CLOUDINARY_URL) {
  process.env.CLOUDINARY_URL = 'cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@demo';
  process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  process.env.CLOUDINARY_API_KEY = '123456789012345';
  process.env.CLOUDINARY_API_SECRET = 'abcdefghijklmnopqrstuvwxyz';
}
import Fastify, { FastifyInstance } from 'fastify';
import tattooRequestsRoutes from './routes/tattooRequest';
import prismaPlugin from './plugins/prisma'; // Path to your prisma plugin
import customerRoutes from './routes/customer';
import paymentRoutes from './routes/payments/index.js';
import appointmentRoutes from './routes/appointment';
import auditRoutes from './routes/audit';
import cloudinaryRoutes from './routes/cloudinary.js'; // Import Cloudinary routes
import cors from '@fastify/cors';


// Initialize Fastify
const build = (opts = {}): FastifyInstance => {
  const fastify = Fastify(opts);

  // Register cors plugin FIRST before other plugins
  fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  });

  // Register Prisma plugin
  fastify.register(prismaPlugin);

  // Example route using Prisma (you can remove this later)
  fastify.get('/users', async (request, reply) => {
    try {
      // Access Prisma via the decorated fastify instance
      const users = await fastify.prisma.user.findMany();
      
      // Simple response without manual serialization
      reply.type('application/json');
      return users;
    } catch (error) {
      request.log.error(error, 'Error fetching users');
      reply.type('application/json').code(500);
      return { error: 'Failed to fetch users' };
    }
  });

  // Register your routes
  fastify.register(tattooRequestsRoutes, { prefix: '/tattoo-requests' });
  fastify.register(customerRoutes, { prefix: '/customers' });
  fastify.register(paymentRoutes, { prefix: '/payments' });
  fastify.register(appointmentRoutes, { prefix: '/appointments' });
  fastify.register(auditRoutes, { prefix: '/audit-logs' });
  fastify.register(cloudinaryRoutes, { prefix: '/cloudinary' });

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

// Only run the main function when directly executed, not when imported
// Use import.meta.url for ESM module detection
const isMainModule = () => {
  const modulePath = fileURLToPath(import.meta.url);
  const mainPath = resolve(process.argv[1]);
  return modulePath === mainPath;
};

if (isMainModule()) {
  main();
}

// Export the build function for testing or programmatic use
export { build };

// Export the Fastify instance if you need to import it elsewhere (e.g., for testing)
// export default fastify;
