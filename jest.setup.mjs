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

// Create a mock Square client
const mockSquareClient = {
  createPayment: jest.fn().mockImplementation(params => {
    return Promise.resolve({
      result: {
        payment: {
          id: 'sq_payment_123',
          amount_money: { amount: 5000, currency: 'CAD' },
          status: 'COMPLETED',
          source_type: 'CARD'
        }
      }
    });
  }),
  createBooking: createMockMethod(),
  getBookings: createMockMethod(),
  getPayments: createMockMethod(),
  createRefund: jest.fn().mockImplementation(params => {
    return Promise.resolve({
      result: {
        refund: {
          id: 'ref_123',
          status: 'COMPLETED',
          payment_id: params.paymentId,
          amount_money: { amount: 5000, currency: 'CAD' }
        }
      }
    });
  })
};

// Create a mock Cloudinary client
const mockCloudinaryService = {
  validateUploadResult: createMockMethod(),
  generateUploadSignature: createMockMethod(),
  uploadImage: createMockMethod(),
  deleteImage: createMockMethod(),
  getTransformedImageUrl: createMockMethod(),
  cloudinary: {
    config: jest.fn(),
    api: {
      resource: createMockMethod()
    },
    uploader: {
      upload: createMockMethod(),
      destroy: createMockMethod()
    },
    utils: {
      api_sign_request: createMockMethod()
    },
    url: createMockMethod()
  }
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

// Mock Square client directly - use the absolute path for Square index
jest.mock('./lib/square/index.ts', () => ({
  __esModule: true,
  default: {
    fromEnv: jest.fn().mockReturnValue(mockSquareClient)
  }
}));

// Make sure all common paths to Square are mocked
jest.mock('./lib/square/index.js', () => ({
  __esModule: true,
  default: {
    fromEnv: jest.fn().mockReturnValue(mockSquareClient)
  }
}));

// Mock Cloudinary module
jest.mock('./lib/cloudinary/index.ts', () => ({
  __esModule: true,
  validateUploadResult: jest.fn(),
  generateUploadSignature: jest.fn(),
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  getTransformedImageUrl: jest.fn(),
  default: mockCloudinaryService
}));

// Also mock the JS version for ESM compatibility
jest.mock('./lib/cloudinary/index.js', () => ({
  __esModule: true,
  validateUploadResult: jest.fn(),
  generateUploadSignature: jest.fn(),
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  getTransformedImageUrl: jest.fn(),
  default: mockCloudinaryService
}));

// Also mock Square from node_modules to prevent any real API calls
jest.mock('square', () => {
  return {
    __esModule: true,
    SquareClient: jest.fn().mockImplementation(() => ({
      payments: {
        create: jest.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'sq_payment_123',
              amount_money: { amount: 5000, currency: 'CAD' },
              status: 'COMPLETED'
            }
          }
        })
      },
      refunds: {
        refundPayment: jest.fn().mockResolvedValue({
          result: {
            refund: {
              id: 'ref_123',
              status: 'COMPLETED',
              payment_id: 'sq_payment_123',
              amount_money: { amount: 5000, currency: 'CAD' }
            }
          }
        })
      },
      bookings: {
        create: jest.fn().mockResolvedValue({
          result: {
            booking: {
              id: 'sq_booking_123',
              start_at: '2023-10-15T14:00:00Z',
              status: 'ACCEPTED'
            }
          }
        })
      }
    })),
    SquareEnvironment: {
      Production: 'production',
      Sandbox: 'sandbox'
    }
  };
});

// Mock Cloudinary package
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      api: {
        resource: jest.fn()
      },
      uploader: {
        upload: jest.fn(),
        destroy: jest.fn()
      },
      utils: {
        api_sign_request: jest.fn()
      },
      url: jest.fn()
    }
  };
});

// Set environment variables needed by Square to prevent real API calls
process.env.SQUARE_ACCESS_TOKEN = 'test_token';
process.env.SQUARE_ENVIRONMENT = 'sandbox';
process.env.SQUARE_APPLICATION_ID = 'test_app_id';
process.env.SQUARE_LOCATION_ID = 'test_location_id';

// Set cloudinary environment variables
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';

// Export mocks for use in tests
export { mockPrismaClient, mockSupabase as supabase, mockSquareClient, mockCloudinaryService }; 