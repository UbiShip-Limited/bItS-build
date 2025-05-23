import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// For tests, Jest will automatically use the mocked version
// from the moduleNameMapper defined in jest.config.mjs
export const prisma =
  global.prisma ||
  new PrismaClient({
    // Optional logging, can be enabled as needed
    // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

// Only store in global in dev mode for hot reloading without connections
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}
