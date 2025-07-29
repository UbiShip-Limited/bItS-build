// This must be the very first import to ensure environment variables are loaded before anything else.
import './config/envLoader';


import fastify from 'fastify';
import cors from '@fastify/cors';

import tattooRequestsRoutes from './routes/tattooRequest';
import prismaPlugin from './plugins/prisma';
import servicesPlugin from './plugins/services';
import customerRoutes from './routes/customer';
import paymentRoutes from './routes/payments/index';
import appointmentRoutes from './routes/appointment';
import auditRoutes from './routes/audit';
import cloudinaryRoutes from './routes/cloudinary';
import webhookRoutes from './routes/webhooks/index';
import healthRoutes from './routes/health';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import businessHoursRoutes from './routes/businessHours';
import emailTemplatesRoutes from './routes/emailTemplates';
import emailAutomationRoutes from './routes/emailAutomation';
import squareSyncRoutes from './routes/square-sync';
import databaseHealthRoutes from './routes/database-health';
import { initializeRecaptchaService } from './services/recaptchaService';
import { SquareIntegrationService } from './services/squareIntegrationService';
import { SquareBookingSyncJob } from './jobs/squareBookingSync';
import { EmailAutomationService } from './services/emailAutomationService';
import { RealtimeService } from './services/realtimeService';

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
    'RECAPTCHA_SECRET_KEY': process.env.RECAPTCHA_SECRET_KEY,
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'EMAIL_FROM': process.env.EMAIL_FROM,
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

  // Check email configuration status
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasEmailFrom = !!process.env.EMAIL_FROM;
  if (hasResendKey && hasEmailFrom) {
    console.log('✅ Email service (Resend) is configured and ready');
  } else if (hasResendKey && !hasEmailFrom) {
    console.warn('⚠️  Email service (Resend) API key is set but EMAIL_FROM is missing - using default from address');
  } else {
    console.warn('⚠️  Email service (Resend) is not configured - email features will be disabled');
    console.warn('   Set RESEND_API_KEY to enable email functionality');
  }

  console.log('✅ Environment validation passed');
}

// Initialize Fastify
const build = (opts = {}) => {
  if (process.env.NODE_ENV !== 'test') {
    validateEnvironment();
  }

  // Initialize reCAPTCHA service if secret key is provided
  if (process.env.RECAPTCHA_SECRET_KEY) {
    try {
      initializeRecaptchaService(process.env.RECAPTCHA_SECRET_KEY);
      console.log('✅ reCAPTCHA service initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize reCAPTCHA service:', error);
    }
  } else {
    console.warn('⚠️  reCAPTCHA is not configured - bot protection will be limited to rate limiting');
    console.warn('   Set RECAPTCHA_SECRET_KEY to enable reCAPTCHA verification');
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
  fastifyInstance.register(servicesPlugin);

  // Initialize email automation after services are loaded
  fastifyInstance.register(async (fastify) => {
    await fastify.after();
    if (process.env.ENABLE_EMAIL_AUTOMATION !== 'false') {
      await setupEmailAutomation(fastify);
    }
  });

  fastifyInstance.register(healthRoutes);
  fastifyInstance.register(databaseHealthRoutes, { prefix: '/database' });
  fastifyInstance.register(authRoutes, { prefix: '/auth' });
  fastifyInstance.register(userRoutes, { prefix: '/users' });
  fastifyInstance.register(eventsRoutes, { prefix: '/events' });
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
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      // Don't re-throw - allow server to start even if payment routes fail
      // This ensures other routes remain accessible
      console.error('⚠️  Server will continue without payment routes');
    }
  });
  
  fastifyInstance.register(appointmentRoutes, { prefix: '/appointments' });
  fastifyInstance.register(auditRoutes, { prefix: '/audit-logs' });
  fastifyInstance.register(cloudinaryRoutes, { prefix: '/cloudinary' });
  fastifyInstance.register(webhookRoutes, { prefix: '/webhooks' });
  fastifyInstance.register(analyticsRoutes, { prefix: '/analytics' });
  fastifyInstance.register(notificationRoutes, { prefix: '/notifications' });
  fastifyInstance.register(businessHoursRoutes, { prefix: '/business-hours' });
  fastifyInstance.register(emailTemplatesRoutes, { prefix: '/email-templates' });
  fastifyInstance.register(emailAutomationRoutes, { prefix: '/email-automation' });
  fastifyInstance.register(squareSyncRoutes, { prefix: '/square-sync' });
  
  return fastifyInstance;
};

// Function to start the server
const start = async (fastifyInstance) => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await fastifyInstance.listen({ port, host: '0.0.0.0' });
    fastifyInstance.log.info(`Backend server listening on port ${port}`);
    
    // Set up automatic Square sync
    setupSquareSync(fastifyInstance);
  } catch (err) {
    fastifyInstance.log.error(err);
    process.exit(1);
  }
};

// Function to set up automatic Square sync
const setupSquareSync = (fastifyInstance) => {
  // Check if Square sync is enabled
  const ENABLE_AUTO_SQUARE_SYNC = process.env.ENABLE_AUTO_SQUARE_SYNC === 'true';
  const SQUARE_SYNC_INTERVAL = parseInt(process.env.SQUARE_SYNC_INTERVAL || '900000'); // Default 15 minutes
  
  if (!ENABLE_AUTO_SQUARE_SYNC) {
    fastifyInstance.log.info('Automatic Square sync is disabled');
    return;
  }
  
  fastifyInstance.log.info(`Setting up automatic Square sync every ${SQUARE_SYNC_INTERVAL / 1000 / 60} minutes`);
  
  // Create sync job instance
  const squareService = new SquareIntegrationService();
  const syncJob = new SquareBookingSyncJob(squareService);
  
  // Run initial sync after 30 seconds
  setTimeout(async () => {
    fastifyInstance.log.info('Running initial Square sync...');
    try {
      const result = await syncJob.run();
      fastifyInstance.log.info(`Initial Square sync completed: ${result.synced} bookings synced`);
    } catch (error) {
      fastifyInstance.log.error('Initial Square sync failed:', error);
    }
  }, 30000);
  
  // Set up recurring sync
  const syncInterval = setInterval(async () => {
    if (syncJob.getIsRunning()) {
      fastifyInstance.log.warn('Square sync job is already running, skipping this interval');
      return;
    }
    
    fastifyInstance.log.info('Running scheduled Square sync...');
    try {
      const result = await syncJob.run();
      fastifyInstance.log.info(`Scheduled Square sync completed: ${result.synced} bookings synced`);
    } catch (error) {
      fastifyInstance.log.error('Scheduled Square sync failed:', error);
    }
  }, SQUARE_SYNC_INTERVAL);
  
  // Clean up on shutdown
  process.on('SIGINT', () => {
    clearInterval(syncInterval);
  });
  process.on('SIGTERM', () => {
    clearInterval(syncInterval);
  });
};

// Function to set up email automation
const setupEmailAutomation = async (fastifyInstance) => {
  // Check if email automation is enabled
  const ENABLE_EMAIL_AUTOMATION = process.env.ENABLE_EMAIL_AUTOMATION !== 'false';
  
  if (!ENABLE_EMAIL_AUTOMATION) {
    fastifyInstance.log.info('Email automation is disabled');
    return;
  }
  
  fastifyInstance.log.info('Setting up email automation service...');
  
  try {
    // Get the realtime service from the fastify instance
    const realtimeService = fastifyInstance.services?.realtimeService || new RealtimeService();
    
    // Create email automation service instance
    const emailAutomationService = new EmailAutomationService(realtimeService);
    
    // Initialize the service
    await emailAutomationService.initialize();
    
    // Store reference for cleanup
    fastifyInstance.decorate('emailAutomationService', emailAutomationService);
    
    // Also store in services for consistency
    if (!fastifyInstance.services) {
      fastifyInstance.decorate('services', {});
    }
    fastifyInstance.services.emailAutomationService = emailAutomationService;
    
    fastifyInstance.log.info('Email automation service initialized successfully');
  } catch (error) {
    fastifyInstance.log.error('Failed to initialize email automation:', error);
  }
  
  // Clean up on shutdown
  process.on('SIGINT', () => {
    if (fastifyInstance.emailAutomationService) {
      fastifyInstance.emailAutomationService.stop();
    }
  });
  process.on('SIGTERM', () => {
    if (fastifyInstance.emailAutomationService) {
      fastifyInstance.emailAutomationService.stop();
    }
  });
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

