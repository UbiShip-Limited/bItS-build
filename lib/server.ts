// This must be the very first import to ensure environment variables are loaded before anything else.
import './config/envLoader';


import fastify from 'fastify';
import cors from '@fastify/cors';

import tattooRequestsRoutes from './routes/tattooRequest';
import prismaPlugin from './plugins/prisma';
import customerRoutes from './routes/customer';
import paymentRoutes from './routes/payments/index';
import appointmentRoutes from './routes/appointment';
import auditRoutes from './routes/audit';
import cloudinaryRoutes from './routes/cloudinary';
import webhookRoutes from './routes/webhooks/index';
import healthRoutes from './routes/health';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';

// Environment variable validation
function validateEnvironment() {
  const requiredEnvVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
  };

  const databaseEnvVars = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const squareEnvVars = {
    'SQUARE_ACCESS_TOKEN': process.env.SQUARE_ACCESS_TOKEN,
    'SQUARE_APPLICATION_ID': process.env.SQUARE_APPLICATION_ID,
    'SQUARE_LOCATION_ID': process.env.SQUARE_LOCATION_ID,
    'SQUARE_ENVIRONMENT': process.env.SQUARE_ENVIRONMENT,
  };

  const optionalEnvVars = {
    'SQUARE_WEBHOOK_SIGNATURE_KEY': process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
    'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
    'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET,
  };

  const missingRequired = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const missingDatabase = Object.entries(databaseEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const missingSquare = Object.entries(squareEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const missingOptional = Object.entries(optionalEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingRequired.length > 0) {
    console.error('❌ Missing critical environment variables:');
    missingRequired.forEach(env => console.error(`   - ${env}`));
    console.error('\nPlease set these in your .env file and restart the server.');
    process.exit(1);
  }

  // Check database configuration status
  const hasAllDatabaseVars = missingDatabase.length === 0;
  if (hasAllDatabaseVars) {
    console.log('✅ Database integration (Supabase) is configured and ready');
  } else {
    console.warn('⚠️  Database integration (Supabase) is not configured - authentication and database features will be limited');
    console.warn('   Missing Supabase environment variables:');
    missingDatabase.forEach(env => console.warn(`   - ${env}`));
    console.warn('   Routes requiring authentication will return appropriate error messages.');
  }

  // Check Square configuration status
  const hasAllSquareVars = missingSquare.length === 0;
  if (hasAllSquareVars) {
    const validSquareEnvs = ['sandbox', 'production'];
    if (!validSquareEnvs.includes(process.env.SQUARE_ENVIRONMENT!)) {
      console.error(`❌ Invalid SQUARE_ENVIRONMENT: ${process.env.SQUARE_ENVIRONMENT}`);
      console.error(`Must be one of: ${validSquareEnvs.join(', ')}`);
      process.exit(1);
    }
    console.log('✅ Square integration is configured and ready');
  } else {
    console.warn('⚠️  Square integration is not configured - payment features will be limited');
    console.warn('   Missing Square environment variables:');
    missingSquare.forEach(env => console.warn(`   - ${env}`));
    console.warn('   Payment routes will return appropriate error messages when Square features are accessed.');
  }

  if (missingOptional.length > 0) {
    console.warn('ℹ️  Missing optional environment variables:');
    missingOptional.forEach(env => console.warn(`   - ${env}`));
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
    origin: [
      'http://localhost:3000', // Development
      'https://b-it-s-build.vercel.app', // Production Vercel URL
      process.env.FRONTEND_URL || 'http://localhost:3000', // Fallback/alternative production URL
    ],
    credentials: true,
  });

  fastifyInstance.register(prismaPlugin);

  fastifyInstance.register(healthRoutes);
  fastifyInstance.register(authRoutes, { prefix: '/auth' });
  fastifyInstance.register(userRoutes, { prefix: '/users' });
  fastifyInstance.register(tattooRequestsRoutes, { prefix: '/tattoo-requests' });
  fastifyInstance.register(customerRoutes, { prefix: '/customers' });
  
  // Add explicit error handling for payment routes registration
  fastifyInstance.register(async (fastify) => {
    try {
      console.log('🔄 Attempting to register payment routes...');
      await fastify.register(paymentRoutes, { prefix: '/payments' });
      console.log('✅ Payment routes registered successfully');
    } catch (error) {
      console.error('❌ Failed to register payment routes:', error);
      throw error;
    }
  });
  
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
  return require.main === module;
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

