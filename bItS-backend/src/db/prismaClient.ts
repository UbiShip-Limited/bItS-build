import { PrismaClient } from '@prisma/client';

/**
 * Singleton class for PrismaClient to avoid multiple instances
 */
class PrismaClientSingleton {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });
    }

    return PrismaClientSingleton.instance;
  }
}

// Export singleton instance
const prisma = PrismaClientSingleton.getInstance();
export default prisma; 