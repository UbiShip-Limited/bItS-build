import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

// Extend Fastify instance type to include Prisma
interface FastifyInstanceWithPrisma extends FastifyInstance {
  prisma: PrismaClient;
}

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

interface DatabaseDiagnostics {
  timestamp: string;
  environment: string;
  databaseConfig: {
    hasConnectionString: boolean;
    connectionStringFormat: string;
    host: string;
    port: string;
  };
  prismaStatus: string;
  connectionTest: string;
  error: any;
  databaseInfo?: {
    userCount: number;
    querySuccessful: boolean;
  };
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const server = fastify as FastifyInstanceWithPrisma;
  
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    return reply.status(200).send(healthData);
  });

  // Comprehensive database diagnostics
  fastify.get('/health/database', async (request, reply) => {
    const diagnostics: DatabaseDiagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      databaseConfig: {
        hasConnectionString: !!process.env.DATABASE_URL,
        connectionStringFormat: process.env.DATABASE_URL ? 
          (process.env.DATABASE_URL.startsWith('postgresql://') ? 'valid' : 'invalid') : 'missing',
        host: process.env.DATABASE_URL ? 
          new URL(process.env.DATABASE_URL).hostname : 'N/A',
        port: process.env.DATABASE_URL ? 
          new URL(process.env.DATABASE_URL).port : 'N/A'
      },
      prismaStatus: 'unknown',
      connectionTest: 'not_attempted',
      error: null
    };

    try {
      // Test basic Prisma client availability
      if (!server.prisma) {
        diagnostics.prismaStatus = 'unavailable';
        diagnostics.error = 'Prisma client not initialized';
        return reply.status(500).send(diagnostics);
      }

      diagnostics.prismaStatus = 'initialized';

      // Test database connection with timeout
      diagnostics.connectionTest = 'attempting';
      
      // Set a reasonable timeout for the connection test
      const connectionPromise = server.prisma.$executeRaw`SELECT 1 as connection_test`;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );

      await Promise.race([connectionPromise, timeoutPromise]);
      
      diagnostics.connectionTest = 'successful';
      diagnostics.prismaStatus = 'connected';

      // If connection successful, test basic query
      const userCount = await server.prisma.user.count();
      
      // Get connection pool and metrics data if available (optional)
      let poolMetrics: any = null;
      try {
        const metrics = await (server.prisma as any).$metrics?.json?.();
        if (metrics) {
          poolMetrics = metrics;
        }
      } catch (error) {
        // Metrics not enabled or available
        poolMetrics = null;
      }

      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          userCount: userCount,
          querySuccessful: true
        },
        ...(poolMetrics && { poolMetrics })
      });

    } catch (error: any) {
      diagnostics.connectionTest = 'failed';
      diagnostics.error = {
        name: error.name,
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };

      request.log.error(error, 'Database health check failed');

      return reply.status(500).send({
        status: 'unhealthy',
        ...diagnostics
      });
    }
  });

  // Environment variables check (safe - doesn't expose values)
  fastify.get('/health/environment', async (request, reply) => {
    const requiredVars = [
      'DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SQUARE_ACCESS_TOKEN',
      'SQUARE_APPLICATION_ID',
      'SQUARE_LOCATION_ID',
      'SQUARE_ENVIRONMENT'
    ];

    const optionalVars = [
      'FRONTEND_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'SQUARE_WEBHOOK_SIGNATURE_KEY'
    ];

    const envStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      required: {} as Record<string, string>,
      optional: {} as Record<string, string>,
      summary: {
        requiredMissing: 0,
        requiredPresent: 0,
        optionalMissing: 0,
        optionalPresent: 0
      }
    };

    requiredVars.forEach(varName => {
      const isPresent = !!process.env[varName];
      envStatus.required[varName] = isPresent ? 'present' : 'missing';
      if (isPresent) {
        envStatus.summary.requiredPresent++;
      } else {
        envStatus.summary.requiredMissing++;
      }
    });

    optionalVars.forEach(varName => {
      const isPresent = !!process.env[varName];
      envStatus.optional[varName] = isPresent ? 'present' : 'missing';
      if (isPresent) {
        envStatus.summary.optionalPresent++;
      } else {
        envStatus.summary.optionalMissing++;
      }
    });

    const isHealthy = envStatus.summary.requiredMissing === 0;

    return reply.status(isHealthy ? 200 : 500).send({
      status: isHealthy ? 'healthy' : 'unhealthy',
      ...envStatus
    });
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
      await server.prisma.$queryRaw`SELECT 1`;
      health.checks.database = { status: 'healthy' };
    } catch (error: any) {
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
    } catch (error: any) {
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