import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types/auth';
import { SquareBookingSyncJob } from '../jobs/squareBookingSync';
import { SquareIntegrationService } from '../services/squareIntegrationService';
import { writeRateLimit } from '../middleware/rateLimiting';

interface SyncRequestBody {
  startDate?: string;
  endDate?: string;
}

const squareSyncRoutes: FastifyPluginAsync = async (fastify) => {
  const squareService = new SquareIntegrationService();
  const syncJob = new SquareBookingSyncJob(squareService);

  // GET /square-sync/status - Get Square configuration and last sync status
  fastify.get('/status', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])]
  }, async () => {
    const configStatus = squareService.getConfigurationStatus();
    const lastSync = await syncJob.getLastSyncStatus();
    const isRunning = syncJob.getIsRunning();

    return {
      configuration: configStatus,
      lastSync,
      isRunning
    };
  });

  // POST /square-sync/run - Manually trigger a sync
  fastify.post('/run', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[]), writeRateLimit()],
    schema: {
      body: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' }
        }
      }
    }
  }, async (request, reply) => {
    const { startDate, endDate } = request.body as SyncRequestBody;

    // Check if already running
    if (syncJob.getIsRunning()) {
      return reply.status(409).send({
        error: 'Sync job is already running',
        code: 'SYNC_IN_PROGRESS'
      });
    }

    // Run sync in background
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    // Start the sync asynchronously
    syncJob.run(options).catch(error => {
      fastify.log.error('Square sync job failed:', error);
    });

    // Return immediately
    return {
      message: 'Square booking sync started',
      status: 'running'
    };
  });

  // GET /square-sync/appointments - Get appointments with Square sync status
  fastify.get('/appointments', {
    preHandler: [authenticate, authorize(['admin', 'artist'] as UserRole[])],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          hasSquareId: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request) => {
    const { hasSquareId, limit = 20 } = request.query as { hasSquareId?: boolean; limit?: number };

    const where = hasSquareId !== undefined
      ? { squareId: hasSquareId ? { not: null } : null }
      : {};

    const appointments = await fastify.prisma.appointment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            squareId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const stats = await fastify.prisma.appointment.aggregate({
      _count: {
        id: true,
        squareId: true
      }
    });

    return {
      appointments: appointments.map(apt => ({
        id: apt.id,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        hasSquareId: !!apt.squareId,
        squareId: apt.squareId,
        customer: apt.customer,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt
      })),
      stats: {
        total: stats._count.id,
        synced: stats._count.squareId
      }
    };
  });
};

export default squareSyncRoutes;