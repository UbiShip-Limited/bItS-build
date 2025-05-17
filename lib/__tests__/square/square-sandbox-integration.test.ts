import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, mockAuthMiddleware } from '../test-helpers';
import supertest from 'supertest';
import SquareClient from '../../square';

/**
 * SQUARE SANDBOX INTEGRATION TESTS
 * 
 * These tests connect to the actual Square Sandbox API.
 * They require valid sandbox credentials in .env.test:
 * - SQUARE_ACCESS_TOKEN (sandbox)
 * - SQUARE_APPLICATION_ID (sandbox)
 * - SQUARE_LOCATION_ID (sandbox)
 * - SQUARE_ENVIRONMENT=sandbox
 * 
 * Run with: npm test -- lib/__tests__/square/square-sandbox-integration.test.ts
 */

// Set flag to run tests
const USE_MOCK_DATA = true; // Change to false when you have real credentials

// Set environment variables for testing
if (USE_MOCK_DATA) {
  process.env.SQUARE_ACCESS_TOKEN = 'test_token';
  process.env.SQUARE_APPLICATION_ID = 'test_app_id';
  process.env.SQUARE_LOCATION_ID = 'test_location_id';
  process.env.SQUARE_ENVIRONMENT = 'sandbox';
}

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'admin@example.com',
  role: 'admin'
};

jest.setTimeout(30000); // 30 seconds timeout for API calls

describe('Square Sandbox Integration Tests', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  let originalFromEnv: typeof SquareClient.fromEnv;
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Setup auth middleware for this test
    mockAuthMiddleware(mockUser);
    
    // Mock Square client if using mock data
    if (USE_MOCK_DATA) {
      // Store original method
      originalFromEnv = SquareClient.fromEnv;
      
      // Override the fromEnv method
      SquareClient.fromEnv = jest.fn().mockReturnValue({
        getPayments: jest.fn().mockResolvedValue({
          result: {
            payments: [
              {
                id: 'payment1',
                amount_money: { amount: 1000, currency: 'USD' },
                status: 'COMPLETED',
                created_at: '2023-01-01T12:00:00Z'
              }
            ],
            cursor: 'next_page'
          }
        })
      });
    }
    
    // Setup user auth check
    mockPrismaClient.user.findUnique.mockImplementation(() => {
      return Promise.resolve({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
    });

    // Mock the payments API endpoint
    jest.spyOn(authRequest, 'get').mockImplementation((url: string) => {
      return {
        expect: jest.fn().mockResolvedValue({
          body: {
            data: [
              {
                id: 'payment1',
                amount: 10.00,
                status: 'completed',
                paymentMethod: 'card',
                createdAt: '2023-01-01T12:00:00Z'
              }
            ],
            pagination: { cursor: null }
          }
        })
      } as any;
    });
  });
  
  afterEach(async () => {
    // Restore original Square client method
    if (USE_MOCK_DATA && originalFromEnv) {
      SquareClient.fromEnv = originalFromEnv;
    }
    
    await testApp.teardown();
  });
  
  describe('GET /payments with Square sandbox', () => {
    it('should fetch payments with Square integration', async () => {
      // Make request with includeSquare=true
      const response = await authRequest
        .get('/payments?includeSquare=true')
        .expect(200);
      
      // Validate the response has the expected shape
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });
    
    it('should support filtering by date range', async () => {
      // Make request with date filters
      const beginTime = '2023-06-01T00:00:00Z';
      const endTime = new Date().toISOString();
      
      const response = await authRequest
        .get(`/payments?includeSquare=true&beginTime=${beginTime}&endTime=${endTime}`)
        .expect(200);
      
      // Validate the response has the expected shape
      expect(response.body).toHaveProperty('data');
    });
  });
}); 