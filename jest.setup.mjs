// This file is used to set up the test environment for Jest
import { jest, beforeAll, afterAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { TextEncoder, TextDecoder } from 'util';

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

// Add TextEncoder and TextDecoder to global scope
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

/**
 * Creates a more flexible mock method that solves TypeScript 'never' type issues
 * by properly implementing common Jest mock methods
 */
const createMockMethod = () => {
  // Start with a basic mock function with any type
  const mockFn = jest.fn().mockImplementation(() => {
    return Promise.resolve({}); // Default implementation returns empty object
  });
  
  // Properly type all the mock methods to handle any value
  mockFn.mockResolvedValue = function(value) {
    mockFn.mockImplementation(() => Promise.resolve(value));
    return mockFn;
  };
  
  mockFn.mockResolvedValueOnce = function(value) {
    mockFn.mockImplementationOnce(() => Promise.resolve(value));
    return mockFn;
  };
  
  mockFn.mockRejectedValue = function(value) {
    mockFn.mockImplementation(() => Promise.reject(value));
    return mockFn;
  };
  
  mockFn.mockRejectedValueOnce = function(value) {
    mockFn.mockImplementationOnce(() => Promise.reject(value));
    return mockFn;
  };
  
  mockFn.mockReturnValue = function(value) {
    mockFn.mockImplementation(() => value);
    return mockFn;
  };
  
  mockFn.mockReturnValueOnce = function(value) {
    mockFn.mockImplementationOnce(() => value);
    return mockFn;
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
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
      findFirst: jest.fn().mockImplementation(() => Promise.resolve(null)),
      findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'mock-id', ...args.data })),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
      upsert: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'mock-id', ...args.create })),
      delete: jest.fn().mockImplementation(() => Promise.resolve({ id: 'mock-id' })),
      count: jest.fn().mockImplementation(() => Promise.resolve(0)),
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

// Create mock BookingService
const mockBookingService = {
  createBooking: jest.fn().mockImplementation((params) => {
    // Check if it's an anonymous booking
    if (params.isAnonymous) {
      return Promise.resolve({
        success: true,
        booking: {
          id: 'test-anonymous-booking-id',
          startTime: new Date(params.startAt),
          endTime: new Date(new Date(params.startAt).getTime() + params.duration * 60000),
          status: params.status || 'scheduled',
          type: params.bookingType,
          contactEmail: params.contactEmail,
          contactPhone: params.contactPhone,
          note: params.note || '',
        },
        squareBooking: null  // Square booking might be null for anonymous bookings
      });
    }
    
    // Return regular booking response for non-anonymous bookings
    return Promise.resolve({
      success: true,
      booking: {
        id: 'test-booking-id',
        startTime: new Date(params.startAt),
        endTime: new Date(new Date(params.startAt).getTime() + params.duration * 60000),
        status: params.status || 'scheduled',
        type: params.bookingType,
        customerId: params.customerId,
        artistId: params.artistId || 'test-artist-id',
        note: params.note || '',
      },
      squareBooking: {
        id: 'test-square-booking-id'
      }
    });
  }),
  updateBooking: jest.fn().mockResolvedValue({
    success: true,
    booking: {
      id: 'test-booking-id',
      status: 'confirmed'
    },
    squareBookingUpdated: {
      result: {
        booking: {
          id: 'updated-square-booking-id'
        }
      }
    }
  }),
  getBookingAvailability: jest.fn().mockResolvedValue({
    success: true,
    date: '2023-06-15',
    availableSlots: []
  }),
  cancelBooking: jest.fn().mockResolvedValue({
    success: true,
    booking: {
      id: 'test-booking-id',
      status: 'cancelled'
    },
    squareCancelled: true
  })
};

// Mock BookingService module
jest.mock('./lib/services/bookingService.ts', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockBookingService),
  BookingType: {
    CONSULTATION: 'consultation',
    DRAWING_CONSULTATION: 'drawing_consultation',
    TATTOO_SESSION: 'tattoo_session'
  },
  BookingStatus: {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show'
  }
}));

// Also mock the JS version for ESM compatibility
jest.mock('./lib/services/bookingService.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockBookingService),
  BookingType: {
    CONSULTATION: 'consultation',
    DRAWING_CONSULTATION: 'drawing_consultation',
    TATTOO_SESSION: 'tattoo_session'
  },
  BookingStatus: {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show'
  }
}));

// Setup global hooks
beforeAll(() => console.log('Test suite started'));
afterAll(() => console.log('Test suite completed'));

// We're already mocking Prisma through moduleNameMapper in jest.config.mjs
// This is only here to explicitly acknowledge the mock
jest.mock('@prisma/client');

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
process.env.CLOUDINARY_CLOUD_NAME = 'TEST_cloud_name';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.CLOUDINARY_URL = 'cloudinary://test-key:test-secret@TEST_cloud_name';

// Export mocks for use in tests
export { mockPrismaClient, mockSupabase as supabase, mockSquareClient, mockCloudinaryService, mockBookingService }; 