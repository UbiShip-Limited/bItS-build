import { SquareIntegrationService } from '../services/squareIntegrationService';
import { prisma } from '../prisma/prisma';

/**
 * Job to sync Square bookings with local appointments
 * Can be run manually or scheduled via cron/systemd/etc
 */
export class SquareBookingSyncJob {
  private squareService: SquareIntegrationService;
  private isRunning: boolean = false;
  
  constructor(squareService?: SquareIntegrationService) {
    this.squareService = squareService || new SquareIntegrationService();
  }

  /**
   * Run the sync job
   * @param options - Options for the sync job
   */
  async run(options?: {
    startDate?: Date;
    endDate?: Date;
    dryRun?: boolean;
  }): Promise<{
    success: boolean;
    synced: number;
    created: number;
    updated: number;
    errors: Array<{ bookingId: string; error: string }>;
    duration: number;
  }> {
    if (this.isRunning) {
      console.warn('Square booking sync job is already running');
      return {
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        errors: [{ bookingId: 'job', error: 'Job already running' }],
        duration: 0
      };
    }

    const startTime = Date.now();
    this.isRunning = true;

    try {
      console.log(`[SquareBookingSyncJob] Starting sync at ${new Date().toISOString()}`);
      
      // Check if Square is configured
      const configStatus = this.squareService.getConfigurationStatus();
      if (!configStatus.isConfigured) {
        console.warn('[SquareBookingSyncJob] Square integration is not configured');
        console.warn('[SquareBookingSyncJob] Warnings:', configStatus.warnings);
        return {
          success: false,
          synced: 0,
          created: 0,
          updated: 0,
          errors: [{ bookingId: 'config', error: 'Square not configured: ' + configStatus.warnings.join(', ') }],
          duration: Date.now() - startTime
        };
      }

      // Log job start
      await prisma.auditLog.create({
        data: {
          action: 'square_sync_job_started',
          resource: 'system',
          resourceId: 'square_sync',
          resourceType: 'job',
          details: JSON.stringify({
            startDate: options?.startDate?.toISOString(),
            endDate: options?.endDate?.toISOString(),
            dryRun: options?.dryRun || false
          })
        }
      });

      // Run the sync
      const result = await this.squareService.syncSquareBookingsToLocal(
        options?.startDate,
        options?.endDate
      );

      const duration = Date.now() - startTime;
      
      console.log(`[SquareBookingSyncJob] Sync completed in ${duration}ms`);
      console.log(`[SquareBookingSyncJob] Results:`, {
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length
      });

      // Log job completion
      await prisma.auditLog.create({
        data: {
          action: 'square_sync_job_completed',
          resource: 'system',
          resourceId: 'square_sync',
          resourceType: 'job',
          details: JSON.stringify({
            ...result,
            duration,
            success: true
          })
        }
      });

      return {
        success: true,
        ...result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[SquareBookingSyncJob] Sync failed:', error);
      
      // Log job failure
      await prisma.auditLog.create({
        data: {
          action: 'square_sync_job_failed',
          resource: 'system',
          resourceId: 'square_sync',
          resourceType: 'job',
          details: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            duration
          })
        }
      });

      return {
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        errors: [{ 
          bookingId: 'job', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }],
        duration
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get the last sync status from audit logs
   */
  async getLastSyncStatus(): Promise<{
    lastRun?: Date;
    success?: boolean;
    results?: any;
  }> {
    const lastSync = await prisma.auditLog.findFirst({
      where: {
        action: {
          in: ['square_sync_job_completed', 'square_sync_job_failed']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!lastSync) {
      return {};
    }

    const details = typeof lastSync.details === 'string' 
      ? JSON.parse(lastSync.details) 
      : lastSync.details;

    return {
      lastRun: lastSync.createdAt,
      success: lastSync.action === 'square_sync_job_completed',
      results: details
    };
  }

  /**
   * Check if job is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

// Export a singleton instance for use in scripts
export const squareBookingSyncJob = new SquareBookingSyncJob();