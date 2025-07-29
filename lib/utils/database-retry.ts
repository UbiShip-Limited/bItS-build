import { PrismaClient } from '@prisma/client';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (error: any, attempt: number) => void;
}

/**
 * Wraps a Prisma operation with retry logic for connection failures
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection error that should be retried
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database
        error.code === 'P1002' || // Timeout
        error.code === 'P1008' || // Operations timed out
        error.message?.includes('Connection refused') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('Connection timeout');

      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      // Call retry handler if provided
      if (onRetry) {
        onRetry(error, attempt);
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Creates a Prisma client wrapper that automatically retries on connection failures
 */
export function createRetryablePrismaClient(prisma: PrismaClient): PrismaClient {
  // Create a proxy that intercepts all method calls
  return new Proxy(prisma, {
    get(target, prop) {
      const original = target[prop as keyof PrismaClient];
      
      // If it's not a model property, return as-is
      if (typeof original !== 'object' || !original) {
        return original;
      }

      // Create a proxy for the model
      return new Proxy(original, {
        get(modelTarget, modelProp) {
          const modelMethod = modelTarget[modelProp as keyof typeof modelTarget];
          
          // If it's not a function, return as-is
          if (typeof modelMethod !== 'function') {
            return modelMethod;
          }

          // Wrap the method with retry logic
          return async (...args: any[]) => {
            return withDatabaseRetry(
              () => modelMethod.apply(modelTarget, args),
              {
                onRetry: (error, attempt) => {
                  console.warn(`Database operation failed (attempt ${attempt}):`, error.message);
                }
              }
            );
          };
        }
      });
    }
  });
}

/**
 * Connection pool monitoring utility
 */
export class DatabaseConnectionMonitor {
  private prisma: PrismaClient;
  private isHealthy: boolean = true;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  start(intervalMs: number = 30000) {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        if (!this.isHealthy) {
          console.log('✅ Database connection restored');
          this.isHealthy = true;
        }
      } catch (error) {
        if (this.isHealthy) {
          console.error('❌ Database connection lost:', error);
          this.isHealthy = false;
        }
      }
    }, intervalMs);
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getStatus() {
    return {
      isHealthy: this.isHealthy,
      lastCheck: new Date().toISOString()
    };
  }
}