import { PrismaClient } from '@prisma/client'
import config from '../config' // Import config to potentially access NODE_ENV

declare global {
  // Allow global `var` declarations for the prisma instance in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Initialize Prisma Client
const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URI,
      },
    },
    // Optional logging based on config:
    // log: config.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  })

// Prevent multiple instances in development
if (config.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Export the initialized client instance
export default prisma;
