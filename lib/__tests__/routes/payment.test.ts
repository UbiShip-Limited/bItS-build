import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings, mockAuthMiddleware } from '../test-helpers';
import supertest from 'supertest';

// Type guard for mocked functions
const isMockFunction = (fn: any): fn is jest.Mock => 
  fn && typeof fn === 'function' && typeof fn.mockReset === 'function';

// Mock data
const mockPayments = [
  {
    id: 'payment1',
    amount: 100.0,
    status: 'pending',
    paymentMethod: 'credit_card',
    paymentDetails: JSON.parse('{"cardType": "visa", "last4": "1234"}'),
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

const mockPaymentWithRelations = {
  ...mockPayments[0],
  invoices: [
    {
      id: 'invoice1',
      appointmentId: 'appt1',
      paymentId: 'payment1',
      amount: 100.0,
      status: 'paid',
      description: 'Deposit for tattoo session',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

const mockPaymentsWithDateStrings = mockPayments.map(payment => dateToISOStrings(payment));
const mockPaymentWithRelationsString = dateToISOStrings(mockPaymentWithRelations);

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'admin@example.com',
  role: 'admin'
};

describe('Payment Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Setup auth middleware for this test
    mockAuthMiddleware(mockUser);
    
    // Reset all mock implementations
    jest.resetAllMocks();
    
    // Setup explicit mock implementation for user auth check
    mockPrismaClient.user.findUnique.mockImplementation((args) => {
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
  
  describe('GET /payments', () => {
    it('should return a paginated list of payments', async () => {
      // Setup explicit mock implementations
      mockPrismaClient.payment.findMany.mockImplementation(() => {
        return Promise.resolve(mockPayments);
      });
      
      mockPrismaClient.payment.count.mockImplementation(() => {
        return Promise.resolve(mockPayments.length);
      });
      
      const response = await authRequest
        .get('/payments/')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toEqual({
        data: mockPaymentsWithDateStrings,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
      
      expect(mockPrismaClient.payment.findMany).toHaveBeenCalledWith({
        where: {},
        include: { invoices: true },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
    
    it('should filter by status', async () => {
      // Setup the mocks with explicit implementations
      mockPrismaClient.payment.findMany.mockImplementation(() => {
        return Promise.resolve([mockPayments[0]]);
      });
      
      mockPrismaClient.payment.count.mockImplementation(() => {
        return Promise.resolve(1);
      });
      
      const response = await authRequest
        .get('/payments/?status=pending')
        .expect(200);
      
      expect(mockPrismaClient.payment.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        include: { invoices: true },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('GET /payments/:id', () => {
    it('should return a single payment with related data', async () => {
      // Setup explicit mock implementation
      mockPrismaClient.payment.findUnique.mockImplementation((args) => {
        if (args.where.id === 'payment1') {
          return Promise.resolve(mockPaymentWithRelations);
        }
        return Promise.resolve(null);
      });
      
      const response = await authRequest
        .get('/payments/payment1')
        .expect(200);
      
      expect(response.body).toEqual(mockPaymentWithRelationsString);
      expect(mockPrismaClient.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        include: { invoices: true }
      });
    });
    
    it('should return 404 if payment not found', async () => {
      // Setup mock with explicit implementation
      mockPrismaClient.payment.findUnique.mockImplementation(() => {
        return Promise.resolve(null);
      });
      
      await authRequest
        .get('/payments/nonexistent')
        .expect(404)
        .expect({ error: 'Payment not found' });
    });
  });

  describe('PUT /payments/:id', () => {
    it('should update a payment', async () => {
      const updateData = {
        status: 'completed'
      };
      
      // Reset mocks before this test
      mockPrismaClient.payment.findUnique.mockReset();
      mockPrismaClient.payment.update.mockReset();
      mockPrismaClient.auditLog.create.mockReset();
      
      // Setup explicit mock implementations
      mockPrismaClient.payment.findUnique.mockImplementation((args) => {
        if (args?.where?.id === 'payment1') {
          return Promise.resolve(mockPayments[0]);
        }
        return Promise.resolve(null);
      });
      
      mockPrismaClient.payment.update.mockImplementation((args) => {
        const updated = {
          ...mockPayments[0],
          ...updateData
        };
        return Promise.resolve(updated);
      });
      
      mockPrismaClient.auditLog.create.mockImplementation((args) => {
        return Promise.resolve({ id: 'audit2' });
      });
      
      const response = await authRequest
        .put('/payments/payment1')
        .send(updateData)
        .expect(200);
      
      expect(response.body.status).toEqual('completed');
      expect(mockPrismaClient.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment1' },
        data: updateData
      });
      
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });
    
    it('should return 404 if payment not found', async () => {
      // Setup mock with explicit implementation
      mockPrismaClient.payment.findUnique.mockImplementation(() => {
        return Promise.resolve(null);
      });
      
      await authRequest
        .put('/payments/nonexistent')
        .send({ status: 'completed' })
        .expect(404)
        .expect({ error: 'Payment not found' });
      
      expect(mockPrismaClient.payment.update).not.toHaveBeenCalled();
    });
  });
}); 