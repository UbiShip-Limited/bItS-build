// This file is used to set up the test environment for Jest
import { jest, beforeAll, afterAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ESM compatibility for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make these available globally
global.__filename = __filename;
global.__dirname = __dirname;

// Set up environment variables
dotenv.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

// Setup global test utilities
global.waitFor = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a more flexible mock method that solves TypeScript 'never' type issues
 * by properly implementing common Jest mock methods
 */
const createMockMethod = () => {
  // Start with a basic mock function
  const mockFn = jest.fn();
  
  // Properly type all the mock methods to handle any value
  mockFn.mockResolvedValue = function(value) {
    return jest.fn().mockImplementation(() => Promise.resolve(value));
  };
  
  mockFn.mockResolvedValueOnce = function(value) {
    return jest.fn().mockImplementationOnce(() => Promise.resolve(value));
  };
  
  mockFn.mockRejectedValue = function(value) {
    return jest.fn().mockImplementation(() => Promise.reject(value));
  };
  
  mockFn.mockReturnValue = function(value) {
    return jest.fn().mockImplementation(() => value);
  };
  
  mockFn.mockReturnValueOnce = function(value) {
    return jest.fn().mockImplementationOnce(() => value);
  };
  
  return mockFn;
};

// Create a simplified mock of the Prisma client
const createMockPrismaClient = () => {
  // Create base CRUD methods for models
  const createModelMethods = () => {
    const findMany = jest.fn()
      .mockImplementation((...args) => {
        console.log('Mock findMany called with:', JSON.stringify(args));
        return Promise.resolve([]);
      });
    
    return {
      findUnique: createMockMethod(),
      findFirst: createMockMethod(),
      findMany,
      create: createMockMethod(),
      update: createMockMethod(),
      upsert: createMockMethod(),
      delete: createMockMethod(),
      count: createMockMethod(),
    };
  };

  // Create models based on your Prisma schema
  return {
    user: createModelMethods(),
    customer: createModelMethods(),
    tattooRequest: createModelMethods(),
    appointment: createModelMethods(),
    payment: createModelMethods(),
    image: createModelMethods(), 
    invoice: createModelMethods(),
    auditLog: createModelMethods(),
    
    // Client methods
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(operations => 
      Array.isArray(operations) 
        ? Promise.all(operations) 
        : operations(mockPrismaClient)
    ),
  };
};

// Create and export the mock Prisma client
const mockPrismaClient = createMockPrismaClient();

// Create a simple mock Supabase client
const mockSupabase = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
    getSession: jest.fn().mockReturnValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  match: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

// Setup global hooks
beforeAll(() => console.log('Test suite started'));
afterAll(() => console.log('Test suite completed'));

// Mock modules
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Fix the path to properly mock the supabase client
jest.mock('./lib/supabase/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Export mocks for use in tests
export { mockPrismaClient, mockSupabase as supabase }; 