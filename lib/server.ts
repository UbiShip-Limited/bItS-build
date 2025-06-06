// This must be the very first import to ensure environment variables are loaded before anything else.
import './config/envLoader.js';

import { fileURLToPath } from 'url';
import { resolve } from 'path';
import fastify from 'fastify';
import cors from '@fastify/cors';

import tattooRequestsRoutes from './routes/tattooRequest.js';
import prismaPlugin from './plugins/prisma.js';
import customerRoutes from './routes/customer.js';
import paymentRoutes from './routes/payments/index.js';
import appointmentRoutes from './routes/appointment.js';
import auditRoutes from './routes/audit.js';
import cloudinaryRoutes from './routes/cloudinary.js';
import webhookRoutes from './routes/webhooks/index.js';
import healthRoutes from './routes/health.js';
import userRoutes from './routes/users.js';

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'SQUARE_ACCESS_TOKEN': process.env.SQUARE_ACCESS_TOKEN,
    'SQUARE_APPLICATION_ID': process.env.SQUARE_APPLICATION_ID,
    'SQUARE_LOCATION_ID': process.env.SQUARE_LOCATION_ID,
    'SQUARE_ENVIRONMENT': process.env.SQUARE_ENVIRONMENT,
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const optionalEnvVars = {
    'SQUARE_WEBHOOK_SIGNATURE_KEY': process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
    'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
    'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET,
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
  }

  const validSquareEnvs = ['sandbox', 'production'];
  if (!validSquareEnvs.includes(process.env.SQUARE_ENVIRONMENT!)) {
    console.error(`❌ Invalid SQUARE_ENVIRONMENT: ${process.env.SQUARE_ENVIRONMENT}`);
    console.error(`Must be one of: ${validSquareEnvs.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

// Initialize Fastify
const build = (opts = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    validateEnvironment();
  }

  const fastifyInstance = fastify(opts);

  fastifyInstance.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  fastifyInstance.register(prismaPlugin);

  fastifyInstance.register(healthRoutes);
  fastifyInstance.register(userRoutes, { prefix: '/users' });
  fastifyInstance.register(tattooRequestsRoutes, { prefix: '/tattoo-requests' });
  fastifyInstance.register(customerRoutes, { prefix: '/customers' });
  fastifyInstance.register(paymentRoutes, { prefix: '/payments' });
  fastifyInstance.register(appointmentRoutes, { prefix: '/appointments' });
  fastifyInstance.register(auditRoutes, { prefix: '/audit-logs' });
  fastifyInstance.register(cloudinaryRoutes, { prefix: '/cloudinary' });
  fastifyInstance.register(webhookRoutes, { prefix: '/webhooks' });
  
  return fastifyInstance;
};

// Function to start the server
const start = async (fastifyInstance) => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await fastifyInstance.listen({ port, host: '0.0.0.0' });
    fastifyInstance.log.info(`Backend server listening on port ${port}`);
  } catch (err) {
    fastifyInstance.log.error(err);
    process.exit(1);
  }
};

const isMainModule = () => {
  if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url);
    const mainPath = resolve(process.argv[1]);
    return modulePath === mainPath;
  }
  return false;
};

if (isMainModule()) {
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

  start(app);
}

export { build };

