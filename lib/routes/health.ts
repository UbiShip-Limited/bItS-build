import { FastifyPluginAsync } from 'fastify';

interface HealthCheck {
  status: string;
  error?: string;
  environment?: string;
  hasToken?: boolean;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  checks: {
    database?: HealthCheck;
    square?: HealthCheck;
    cloudinary?: HealthCheck;
  };
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    try {
      // Test database connection
      await fastify.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
    } catch (error) {
      reply.status(503);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  });

  // Detailed health check for monitoring
  fastify.get('/health/detailed', async (request, reply) => {
    const health: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // Database check
      await fastify.prisma.$queryRaw`SELECT 1`;
      health.checks.database = { status: 'healthy' };
    } catch (error) {
      health.checks.database = { status: 'unhealthy', error: error.message };
      health.status = 'unhealthy';
    }

    // Square API check
    try {
      const squareEnv = process.env.SQUARE_ENVIRONMENT;
      const squareToken = process.env.SQUARE_ACCESS_TOKEN;
      health.checks.square = { 
        status: 'configured',
        environment: squareEnv,
        hasToken: !!squareToken
      };
    } catch (error) {
      health.checks.square = { status: 'misconfigured', error: error.message };
    }

    // Cloudinary check
    health.checks.cloudinary = {
      status: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not_configured'
    };

    if (health.status === 'unhealthy') {
      reply.status(503);
    }

    return health;
  });
};

export default healthRoutes; 