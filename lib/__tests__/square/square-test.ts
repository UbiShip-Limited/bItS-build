import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings, mockAuthMiddleware } from '../test-helpers';
import supertest from 'supertest';

// First, mock the square package since we import from it directly in square/index.ts
jest.mock('square', () => {
  // Create a mock client constructor
  const MockClient = jest.fn().mockImplementation(() => ({
    paymentsApi: {
      listPayments: jest.fn(),
      retrievePayment: jest.fn()
    },
    bookingsApi: {
      listBookings: jest.fn(),
      retrieveBooking: jest.fn()
    },
    customersApi: {
      listCustomers: jest.fn()
    },
    catalogApi: {
      listCatalog: jest.fn()
    }
  }));

  return {
    Client: MockClient,
    Environment: {
      Production: 'production',
      Sandbox: 'sandbox'
    }
  };
});

// Then mock our own Square client
jest.mock('../../square', () => {
  const mockSquareClient = {
    getPayments: jest.fn(),
    getPaymentById: jest.fn(),
    getBookings: jest.fn(),
    getBookingById: jest.fn(),
    getCustomers: jest.fn(),
    getCatalog: jest.fn()
  };
  
  return {
    __esModule: true,
    default: {
      fromEnv: jest.fn(() => mockSquareClient)
    }
  };
});

// Import after mocking
import SquareClient from '../../square';

// Mock data
const mockSquarePayments = {
  result: {
    payments: [
      {
        id: 'sq_payment1',
        amountMoney: { amount: 15000, currency: 'USD' },
        status: 'COMPLETED',
        sourceType: 'CARD',
        cardDetails: { card: { last4: '1234' } },
        createdAt: '2023-06-01T12:00:00Z'
      },
      {
        id: 'sq_payment2',
        amountMoney: { amount: 25000, currency: 'USD' },
        status: 'COMPLETED',
        sourceType: 'CARD',
        cardDetails: { card: { last4: '5678' } },
        createdAt: '2023-06-02T12:00:00Z'
      }
    ],
    cursor: 'next_page_token'
  }
};

const mockSquarePayment = {
  result: {
    payment: {
      id: 'sq_payment1',
      amountMoney: { amount: 15000, currency: 'USD' },
      status: 'COMPLETED',
      sourceType: 'CARD',
      cardDetails: { card: { last4: '1234' } },
      createdAt: '2023-06-01T12:00:00Z'
    }
  }
};

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'admin@example.com',
  role: 'admin'
};

describe('Square Mock Tests', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  let squareClient: any;
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Setup auth middleware for this test
    mockAuthMiddleware(mockUser);
    
    // Reset all mock implementations
    jest.resetAllMocks();
    
    // Get the mocked Square client instance
    squareClient = (SquareClient.fromEnv as jest.Mock)();
    
    // Setup user auth check
    mockPrismaClient.user.findUnique.mockImplementation(() => {
      return Promise.resolve({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
    });
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('GET /payments with Square integration', () => {
    it('should fetch payments from Square when includeSquare=true', async () => {
      // Setup Square client mock
      squareClient.getPayments.mockResolvedValue(mockSquarePayments);
      
      // Make request with includeSquare=true
      const response = await authRequest
        .get('/payments?includeSquare=true')
        .expect(200);
      
      // Check response
      expect(response.body).toEqual({
        data: mockSquarePayments.result.payments,
        pagination: {
          cursor: mockSquarePayments.result.cursor
        }
      });
      
      // Verify Square client was called
      expect(squareClient.getPayments).toHaveBeenCalled();
    });
    
    it('should support filtering by date range for Square payments', async () => {
      // Setup Square client mock
      squareClient.getPayments.mockResolvedValue(mockSquarePayments);
      
      // Make request with date filters
      const beginTime = '2023-06-01T00:00:00Z';
      const endTime = '2023-06-30T23:59:59Z';
      
      await authRequest
        .get(`/payments?includeSquare=true&beginTime=${beginTime}&endTime=${endTime}`)
        .expect(200);
      
      // Verify Square client was called with date filters
      expect(squareClient.getPayments).toHaveBeenCalledWith(
        beginTime,
        endTime,
        undefined,
        20
      );
    });
    
    it('should handle errors from Square API', async () => {
      // Setup Square client to throw error
      squareClient.getPayments.mockRejectedValue(new Error('Square API error'));
      
      // Make request and expect error response
      await authRequest
        .get('/payments?includeSquare=true')
        .expect(500)
        .expect({
          error: 'Failed to fetch payments from Square'
        });
    });
  });
  
  describe('GET /payments/:id with Square integration', () => {
    it('should fetch a specific payment from Square', async () => {
      // Setup Square client mock
      squareClient.getPaymentById.mockResolvedValue(mockSquarePayment);
      
      // Make request to fetch from Square source
      const response = await authRequest
        .get('/payments/sq_payment1?source=square')
        .expect(200);
      
      // Check response
      expect(response.body).toEqual(mockSquarePayment.result.payment);
      
      // Verify Square client was called with correct ID
      expect(squareClient.getPaymentById).toHaveBeenCalledWith('sq_payment1');
    });
    
    it('should handle errors when fetching from Square', async () => {
      // Setup Square client to throw error
      squareClient.getPaymentById.mockRejectedValue(new Error('Payment not found'));
      
      // Make request and expect error response
      await authRequest
        .get('/payments/invalid_id?source=square')
        .expect(404)
        .expect({
          error: 'Payment not found in Square'
        });
    });
  });
  
  describe('GET /payments/square/sync', () => {
    it('should sync payments from Square to internal database', async () => {
      // Setup Square client mock
      squareClient.getPayments.mockResolvedValue(mockSquarePayments);
      
      // Setup database mocks
      mockPrismaClient.payment.findUnique.mockImplementation((args) => {
        // Return null to simulate that payment doesn't exist yet
        return Promise.resolve(null);
      });
      
      mockPrismaClient.payment.create.mockImplementation((args: any) => {
        // Return created payment
        return Promise.resolve({
          id: 'new_id',
          ...args.data
        });
      });
      
      // Make request to sync
      const response = await authRequest
        .get('/payments/square/sync')
        .expect(200);
      
      // Check response
      expect(response.body).toEqual({
        synced: 2,
        total: 2,
        message: 'Synced 2 new payments from Square'
      });
      
      // Verify Square client was called
      expect(squareClient.getPayments).toHaveBeenCalled();
      
      // Verify database operations
      expect(mockPrismaClient.payment.create).toHaveBeenCalledTimes(2);
      
      // Verify first payment creation
      expect(mockPrismaClient.payment.create).toHaveBeenCalledWith({
        data: {
          amount: 150, // $150.00 converted from cents
          status: 'completed',
          paymentMethod: 'CARD',
          paymentDetails: mockSquarePayments.result.payments[0],
          squareId: 'sq_payment1'
        }
      });
    });
    
    it('should skip already synced payments', async () => {
      // Setup Square client mock
      squareClient.getPayments.mockResolvedValue(mockSquarePayments);
      
      // Setup database mocks to simulate all payments already exist
      mockPrismaClient.payment.findUnique.mockImplementation((args) => {
        // Return existing payment
        return Promise.resolve({
          id: 'existing_id',
          squareId: (args as any).where.squareId,
          amount: 150,
          status: 'completed'
        });
      });
      
      // Make request to sync
      const response = await authRequest
        .get('/payments/square/sync')
        .expect(200);
      
      // Check response shows no new syncs
      expect(response.body).toEqual({
        synced: 0,
        total: 2,
        message: 'Synced 0 new payments from Square'
      });
      
      // Verify no new payments were created
      expect(mockPrismaClient.payment.create).not.toHaveBeenCalled();
    });
    
    it('should handle no payments found in Square', async () => {
      // Setup Square client to return empty array
      squareClient.getPayments.mockResolvedValue({ result: { payments: [] } });
      
      // Make request to sync
      const response = await authRequest
        .get('/payments/square/sync')
        .expect(200);
      
      // Check response
      expect(response.body).toEqual({
        synced: 0,
        message: 'No payments found in Square'
      });
    });
    
    it('should handle errors from Square API during sync', async () => {
      // Setup Square client to throw error
      squareClient.getPayments.mockRejectedValue(new Error('Square API error'));
      
      // Make request and expect error response
      await authRequest
        .get('/payments/square/sync')
        .expect(500)
        .expect({
          error: 'Failed to sync payments from Square'
        });
    });
  });
}); 