// Mock implementation of @prisma/client
import { jest } from '@jest/globals';

// Define a mock Prisma client that matches the structure in jest.setup.mjs
// rather than trying to import it dynamically

// Create a mock Prisma client
const mockPrismaClient = {
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(args => Promise.resolve({ id: 'mock-id', ...args.data })),
    update: jest.fn().mockImplementation(args => Promise.resolve({ id: args.where.id, ...args.data })),
  },
  customer: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(args => Promise.resolve({ id: 'mock-id', ...args.data })),
    update: jest.fn().mockImplementation(args => Promise.resolve({ id: args.where.id, ...args.data })),
  },
  tattooRequest: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(args => Promise.resolve({ id: 'mock-id', ...args.data })),
    update: jest.fn().mockImplementation(args => Promise.resolve({ id: args.where.id, ...args.data })),
  },
  appointment: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation(args => Promise.resolve({ id: 'mock-id', ...args.data })),
    update: jest.fn().mockImplementation(args => Promise.resolve({ id: args.where.id, ...args.data })),
  },
  payment: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(args => Promise.resolve({ id: 'mock-id', ...args.data })),
    update: jest.fn().mockImplementation(args => Promise.resolve({ id: args.where.id, ...args.data })),
  },
  auditLog: {
    create: jest.fn().mockImplementation(args => Promise.resolve({ id: 'mock-audit-id', ...args.data })),
  },
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn(operations => 
    Array.isArray(operations) 
      ? Promise.all(operations) 
      : operations(mockPrismaClient)
  ),
};

// Main export class
export class PrismaClient {
  constructor() {
    return mockPrismaClient;
  }
}

// Enums that might be used in tests
export const Prisma = {
  // Add any Prisma enums your code uses
  BookingStatus: {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show'
  }
};

// Export a named mockPrismaClient to match what's expected in tests
export { mockPrismaClient };

// Default export
export default {
  PrismaClient
}; 