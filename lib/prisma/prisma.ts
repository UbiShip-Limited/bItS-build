import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use a real client in development/production and a mock in test
export const prisma =
  process.env.NODE_ENV === 'test'
    ? // For tests, the mock will be loaded from @prisma/client
      new PrismaClient()
    : // For dev and prod, use normal singleton pattern
      global.prisma ||
      new PrismaClient({
        // Optional: log: ['query', 'info', 'warn', 'error'],
      });

// Only store in global in dev
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  global.prisma = prisma;
}
