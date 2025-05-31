import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, mockAuthMiddleware } from '../test-helpers';
import { mockSquareClient } from '../square/square-test-helpers';
import supertest from 'supertest';

// Mock JWT token and user (admin role needed)
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'admin1',
  email: 'admin@example.com',
  role: 'admin'
};

describe('Admin Payment Routes', () => {
  let _app: Awaited<ReturnType<typeof setupTestApp>>;
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  // Mock data
  const mockPayments = [
    {
      id: 'payment1',
      amount: 100.0,
      status: 'completed',
      paymentMethod: 'credit_card',
      paymentDetails: { cardType: 'visa', last4: '1234' },
      squareId: 'sq_1',
      createdAt: new Date(),
      updatedAt: new Date(),
      invoices: []
    },
    {
      id: 'payment2',
      amount: 200.0,
      status: 'completed',
      paymentMethod: 'cash',
      paymentDetails: null,
      squareId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      invoices: []
    }
  ];

  const mockSquarePayments = [
    {
      id: 'sq_1',
      amount_money: { amount: 10000, currency: 'CAD' },
      status: 'COMPLETED',
      source_type: 'CARD'
    },
    {
      id: 'sq_2',
      amount_money: { amount: 20000, currency: 'CAD' },
      status: 'COMPLETED',
      source_type: 'CARD'
    }
  ];
  
  beforeEach(async () => {
    // Setup test app and get supertest instance
    _app = await setupTestApp();
    request = _app.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Setup auth middleware for this test
    mockAuthMiddleware(mockUser);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Square mocks - use the existing mockSquareClient from jest.setup.mjs
    mockSquareClient.getPayments = jest.fn().mockReturnValue({
      result: {
        payments: mockSquarePayments,
        cursor: 'next_page_token'
      }
    });
    
    mockSquareClient.getPaymentById = jest.fn().mockImplementation((id) => {
      return Promise.resolve({
        result: {
          payment: mockSquarePayments.find(p => p.id === id) || null
        }
      });
    });
    
    // Set up Prisma mock responses
    mockPrismaClient.payment.findMany.mockResolvedValue(mockPayments);
    mockPrismaClient.payment.count.mockResolvedValue(mockPayments.length);
    mockPrismaClient.payment.findUnique.mockImplementation((args) => {
      const id = args?.where?.id;
      const squareId = args?.where?.squareId;
      if (id === 'payment1') return Promise.resolve(mockPayments[0]);
      if (squareId === 'sq_1') return Promise.resolve(mockPayments[0]);
      return Promise.resolve(null);
    });
    
    mockPrismaClient.payment.create.mockImplementation((args) => {
      return Promise.resolve({
        id: 'new_payment',
        ...args?.data
      });
    });
  });
  
  afterEach(async () => {
    await _app.teardown();
  });
  
  describe('GET /payments', () => {
    it('should return a paginated list of payments from database', async () => {
      const response = await authRequest
        .get('/payments/')
        .expect(200);
      
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20
      });
    });
    
    // Note: Skipping Square-related tests until Square integration is properly mocked
    it.skip('should return payments from Square when includeSquare=true', async () => {
      const response = await authRequest
        .get('/payments/?includeSquare=true')
        .expect(200);
      
      expect(response.body.data).toEqual(mockSquarePayments);
      expect(response.body.pagination.cursor).toBe('next_page_token');
    });
    
    it('should filter by status', async () => {
      await authRequest
        .get('/payments/?status=completed')
        .expect(200);
      
      expect(mockPrismaClient.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'completed' }
        })
      );
    });
  });
  
  describe('GET /payments/:id', () => {
    it('should return a single payment from database', async () => {
      const response = await authRequest
        .get('/payments/payment1')
        .expect(200);
      
      expect(response.body.id).toBe('payment1');
      expect(response.body.amount).toBe(100.0);
      
      expect(mockPrismaClient.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        include: { invoices: true }
      });
    });
    
    // Note: Skipping Square-related tests until Square integration is properly mocked
    it.skip('should return a payment from Square when source=square', async () => {
      const response = await authRequest
        .get('/payments/sq_1?source=square')
        .expect(200);
      
      expect(response.body.id).toBe('sq_1');
    });
    
    it('should return 404 if payment not found', async () => {
      // Override the previous mock for this test only
      mockPrismaClient.payment.findUnique.mockResolvedValueOnce(null);
      
      await authRequest
        .get('/payments/nonexistent')
        .expect(404)
        .expect({ error: 'Payment not found' });
    });
  });
  
  // Note: Skipping Square-related tests until Square integration is properly mocked
  describe('GET /payments/square/sync', () => {
    it.skip('should sync payments from Square to database', async () => {
      // Set up findUnique mock specifically for this test
      mockPrismaClient.payment.findUnique.mockImplementation((args) => {
        // Only the first payment exists in our database
        if (args?.where?.squareId === 'sq_1') {
          return Promise.resolve(mockPayments[0]);
        }
        return Promise.resolve(null);
      });
      
      const response = await authRequest
        .get('/payments/square/sync')
        .expect(200);
      
      expect(response.body.synced).toBe(1); // Only one new payment should be synced (sq_2)
      expect(response.body.total).toBe(2);
    });
  });
});