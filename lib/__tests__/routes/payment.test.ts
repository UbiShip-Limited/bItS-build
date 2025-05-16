import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings, mockAuthMiddleware } from '../test-helpers';
import supertest from 'supertest';

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
  
  // Mock the authentication middleware
  mockAuthMiddleware(mockUser);
  
  beforeEach(async () => {
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Reset mocks
    if (typeof mockPrismaClient.payment.findMany === 'function' && 'mockReset' in mockPrismaClient.payment.findMany) {
      mockPrismaClient.payment.findMany.mockReset();
      mockPrismaClient.payment.count.mockReset();
      mockPrismaClient.payment.findUnique.mockReset();
      mockPrismaClient.payment.create.mockReset();
      mockPrismaClient.payment.update.mockReset();
      mockPrismaClient.auditLog.create.mockReset();
    }
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('GET /payments', () => {
    it('should return a paginated list of payments', async () => {
      // Setup the mocks
      mockPrismaClient.payment.findMany.mockResolvedValue(mockPayments);
      mockPrismaClient.payment.count.mockResolvedValue(mockPayments.length);
      
      const response = await authRequest
        .get('/payments')
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
      // Setup the mocks
      mockPrismaClient.payment.findMany.mockResolvedValue([mockPayments[0]]);
      mockPrismaClient.payment.count.mockResolvedValue(1);
      
      const response = await authRequest
        .get('/payments?status=pending')
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
      // Setup the mock
      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPaymentWithRelations);
      
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
      // Setup the mock
      mockPrismaClient.payment.findUnique.mockResolvedValue(null);
      
      await authRequest
        .get('/payments/nonexistent')
        .expect(404)
        .expect({ error: 'Payment not found' });
    });
  });

  describe('POST /payments', () => {
    it('should create a new payment', async () => {
      // New payment data
      const newPayment = {
        amount: 150.0,
        status: 'pending',
        paymentMethod: 'credit_card'
      };
      
      const createdPayment = {
        id: 'payment3',
        ...newPayment,
        paymentDetails: null,
        squareId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Setup mocks
      mockPrismaClient.payment.create.mockResolvedValue(createdPayment);
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit1' });
      
      const response = await authRequest
        .post('/payments')
        .send(newPayment)
        .expect(200);
      
      expect(response.body).toEqual(dateToISOStrings(createdPayment));
      expect(mockPrismaClient.payment.create).toHaveBeenCalledWith({
        data: newPayment
      });
      
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });
    
    it('should validate required fields', async () => {
      await authRequest
        .post('/payments')
        .send({ paymentMethod: 'credit_card' }) // Missing amount
        .expect(400);
    });
  });

  describe('PUT /payments/:id', () => {
    it('should update a payment', async () => {
      const updateData = {
        status: 'completed'
      };
      
      // Setup mocks
      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayments[0]);
      mockPrismaClient.payment.update.mockResolvedValue({
        ...mockPayments[0],
        ...updateData
      });
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit2' });
      
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
      // Setup mock
      mockPrismaClient.payment.findUnique.mockResolvedValue(null);
      
      await authRequest
        .put('/payments/nonexistent')
        .send({ status: 'completed' })
        .expect(404)
        .expect({ error: 'Payment not found' });
    });
  });
}); 