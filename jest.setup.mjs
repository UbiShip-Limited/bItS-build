// This file is used to set up the test environment for Jest
import { jest, beforeAll, afterAll } from '@jest/globals';

// Setup global test utilities
global.waitFor = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create a more comprehensive mock of the Prisma client
const createMockPrismaClient = () => {
  // Create a function that creates mock methods with proper typings
  const createMockMethod = () => jest.fn();
  
  // Common CRUD operations for any model
  const createModelMethods = () => ({
    findUnique: createMockMethod(),
    findFirst: createMockMethod(),
    findMany: createMockMethod(),
    create: createMockMethod(),
    update: createMockMethod(),
    upsert: createMockMethod(),
    delete: createMockMethod(),
    count: createMockMethod(),
  });

  // Create mock models - add all models used in your app
  return {
    user: createModelMethods(),
    appointment: createModelMethods(),
    service: createModelMethods(),
    // Add other models as needed
    
    // Prisma client methods
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(operations => 
      Array.isArray(operations) 
        ? Promise.all(operations) 
        : operations(mockPrismaClient)
    ),
  };
};

// Create and export the mock client
const mockPrismaClient = createMockPrismaClient();

// Setup global hooks
beforeAll(() => {
  // Any setup needed before all tests run
  console.log('Test suite started');
});

afterAll(() => {
  // Any cleanup after all tests complete
  console.log('Test suite completed');
});

// Mock prisma client module
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock other common modules here if needed
// For example:
// jest.mock('next/router', () => require('next-router-mock'));

// Export the mock client for direct use in tests
export { mockPrismaClient }; 