import 'dotenv/config';
// For specifically loading .env.local
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

// Load .env file and log the result
const envResult = config({ path: '.env' });
if (envResult.error) {
  console.warn('⚠️  Could not load .env file:', envResult.error.message);
} else {
  console.log('✅ .env file loaded successfully');
}

// Debug: Log Cloudinary environment variables at startup
console.log('🔍 Environment Variables Debug:');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? '***SET***' : 'NOT SET');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '***SET***' : 'NOT SET');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

import Fastify, { FastifyInstance } from 'fastify';
import tattooRequestsRoutes from './routes/tattooRequest';
import prismaPlugin from './plugins/prisma'; // Path to your prisma plugin
import customerRoutes from './routes/customer';
import paymentRoutes from './routes/payments/index.js';
import appointmentRoutes from './routes/appointment';
import auditRoutes from './routes/audit';
import cloudinaryRoutes from './routes/cloudinary.js'; // Import Cloudinary routes
import webhookRoutes from './routes/webhooks/index.js'; // Import webhook routes
import healthRoutes from './routes/health.js'; // Import health check routes
import cors from '@fastify/cors';

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'SQUARE_ACCESS_TOKEN': process.env.SQUARE_ACCESS_TOKEN,
    'SQUARE_APPLICATION_ID': process.env.SQUARE_APPLICATION_ID,
    'SQUARE_LOCATION_ID': process.env.SQUARE_LOCATION_ID,
    'SQUARE_ENVIRONMENT': process.env.SQUARE_ENVIRONMENT
  };

  // Optional but important for webhooks
  const optionalEnvVars = {
    'SQUARE_WEBHOOK_SIGNATURE_KEY': process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
    'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
    'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET
  };

  const missingRequired = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const missingOptional = Object.entries(optionalEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach(env => console.error(`   - ${env}`));
    console.error('\nPlease set these in your .env file and restart the server.');
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    missingOptional.forEach(env => console.warn(`   - ${env}`));
    console.warn('Some features may not work properly.\n');
  }

  // Validate Square environment
  const validSquareEnvs = ['sandbox', 'production'];
  if (!validSquareEnvs.includes(process.env.SQUARE_ENVIRONMENT!)) {
    console.error(`❌ Invalid SQUARE_ENVIRONMENT: ${process.env.SQUARE_ENVIRONMENT}`);
    console.error(`Must be one of: ${validSquareEnvs.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

// Initialize Fastify
const build = (opts = {}): FastifyInstance => {
  // Validate environment first (skip in test mode)
  if (process.env.NODE_ENV !== 'test') {
    validateEnvironment();
  }

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
  fastify.register(healthRoutes); // No prefix for health checks
  fastify.register(tattooRequestsRoutes, { prefix: '/tattoo-requests' });
  fastify.register(customerRoutes, { prefix: '/customers' });
  fastify.register(paymentRoutes, { prefix: '/payments' });
  fastify.register(appointmentRoutes, { prefix: '/appointments' });
  fastify.register(auditRoutes, { prefix: '/audit-logs' });
  fastify.register(cloudinaryRoutes, { prefix: '/cloudinary' });
  fastify.register(webhookRoutes, { prefix: '/webhooks' });

  // Set Cloudinary fallbacks only in development/test if NO real values are set
  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
    if (!process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠️  Using demo Cloudinary values for development/test only');
      process.env.CLOUDINARY_URL = 'cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@demo';
      process.env.CLOUDINARY_CLOUD_NAME = 'demo';
      process.env.CLOUDINARY_API_KEY = '123456789012345';
      process.env.CLOUDINARY_API_SECRET = 'abcdefghijklmnopqrstuvwxyz';
    } else {
      console.log('✅ Using real Cloudinary credentials from .env file');
    }
  }

  return fastify;
};

// Function to start the server
const start = async (fastifyInstance: FastifyInstance) => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001; // Default to port 3001 for the backend
    await fastifyInstance.listen({ port, host: '0.0.0.0' }); // Listen on all available network interfaces
     fastifyInstance.log.info(`Backend server listening on port ${port}`); // logger might not be set yet if not passed in build opts
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
