import { FastifyPluginAsync } from 'fastify';
import { checkDatabaseConnection } from '../prisma/prisma';

const databaseHealthRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /database/health - Check database connectivity
  fastify.get('/health', async (request, reply) => {
    try {
      // Quick connection test
      await fastify.prisma.$queryRaw`SELECT 1 as health_check`;
      
      // Get connection pool stats if available (optional)
      let poolStats: any = null;
      try {
        if (fastify.prisma && (fastify.prisma as any).$metrics) {
          poolStats = await (fastify.prisma as any).$metrics.json();
        } else {
          poolStats = 'Metrics not enabled';
        }
      } catch (metricsError) {
        // Metrics not enabled, which is fine
        poolStats = 'Metrics not enabled';
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          host: process.env.DATABASE_URL?.includes('supabase') ? 'Supabase' : 'PostgreSQL',
          poolStats: poolStats || 'Not available'
        }
      };
    } catch (error: any) {
      const errorCode = error.code || 'UNKNOWN';
      const errorMessage = error.message || 'Unknown database error';
      
      // Attempt reconnection
      let reconnected = false;
      try {
        request.log.warn('Database health check failed, attempting reconnect...');
        await fastify.prisma.$disconnect();
        await fastify.prisma.$connect();
        await fastify.prisma.$queryRaw`SELECT 1`;
        reconnected = true;
      } catch (reconnectError) {
        request.log.error('Database reconnection failed:', reconnectError);
      }
      
      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: errorCode,
          message: errorMessage,
          reconnected,
          details: {
            isP1001: errorCode === 'P1001' ? 'Cannot reach database server' : undefined,
            isP1002: errorCode === 'P1002' ? 'Database server timeout' : undefined,
            isP1003: errorCode === 'P1003' ? 'Database does not exist' : undefined,
          }
        },
        advice: getDatabaseErrorAdvice(errorCode, errorMessage)
      });
    }
  });
  
  // GET /database/reconnect - Force database reconnection
  fastify.get('/reconnect', async (request, reply) => {
    try {
      request.log.info('Forcing database reconnection...');
      
      // Disconnect existing connection
      await fastify.prisma.$disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconnect
      await fastify.prisma.$connect();
      
      // Test connection
      await fastify.prisma.$queryRaw`SELECT 1 as reconnect_test`;
      
      return {
        status: 'success',
        message: 'Database reconnected successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to reconnect to database',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
};

function getDatabaseErrorAdvice(errorCode: string, errorMessage: string): string[] {
  const advice: string[] = [];
  
  if (errorCode === 'P1001' || errorMessage.includes("Can't reach database")) {
    advice.push('Check if Supabase database is active and not paused');
    advice.push('Verify DATABASE_URL is correct in your .env file');
    advice.push('Check network connectivity and firewall settings');
    advice.push('Try accessing Supabase dashboard to wake up the database');
  }
  
  if (errorCode === 'P1002' || errorMessage.includes('timeout')) {
    advice.push('Database server may be overloaded or slow to respond');
    advice.push('Consider increasing connection timeout values');
    advice.push('Check Supabase dashboard for any ongoing issues');
  }
  
  if (errorMessage.includes('pooler')) {
    advice.push('Ensure you are using the correct Supabase connection string');
    advice.push('Use the "Connection Pooler" URL from Supabase settings for serverless environments');
    advice.push('Add ?pgbouncer=true to your connection string');
  }
  
  return advice;
}

export default databaseHealthRoutes;