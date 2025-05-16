// lib/__tests__/routes/customer.test.ts
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings, mockAuthMiddleware } from '../test-helpers';
import supertest from 'supertest';

// Create typed mock data with simpler structure
type MockCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Mock data factory for customers
const createMockCustomers = (): MockCustomer[] => [
  {
    id: 'customer1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    notes: 'Regular client',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'customer2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-5678',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'artist@example.com',
  role: 'artist'
};

describe('Customer Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  let mockCustomers: MockCustomer[];
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Create fresh mock data for each test
    mockCustomers = createMockCustomers();
    
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
  
  describe('GET /customers', () => {
    it('should return a paginated list of customers', async () => {
      // Setup mocks with explicit implementation
      mockPrismaClient.customer.findMany.mockImplementation(() => {
        return Promise.resolve(mockCustomers);
      });
      
      mockPrismaClient.customer.count.mockImplementation(() => {
        return Promise.resolve(mockCustomers.length);
      });
      
      const response = await authRequest
        .get('/customers')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toEqual({
        data: mockCustomers.map(c => dateToISOStrings(c)),
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
      
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      });
    });
    
    it('should filter by search term', async () => {
      // Setup mocks with explicit implementation
      mockPrismaClient.customer.findMany.mockImplementation(() => {
        return Promise.resolve([mockCustomers[0]]);
      });
      
      mockPrismaClient.customer.count.mockImplementation(() => {
        return Promise.resolve(1);
      });
      
      const response = await authRequest
        .get('/customers?search=john')
        .expect(200);
      
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
            { phone: { contains: 'john' } }
          ]
        },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      });
    });
  });

  describe('GET /customers/:id', () => {
    it('should return a single customer with related data', async () => {
      // Create a customer with relations
      const customerWithRelations = {
        ...mockCustomers[0],
        appointments: [
          {
            id: 'appt1',
            customerId: 'customer1',
            artistId: 'artist1',
            date: new Date(),
            duration: 120,
            status: 'confirmed',
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        tattooRequests: [
          {
            id: 'req1',
            customerId: 'customer1',
            description: 'Dragon tattoo',
            placement: 'Arm',
            size: 'Medium',
            colorPreference: 'Full color',
            style: 'Japanese',
            referenceImages: [],
            status: 'approved',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
      
      // Setup mock with explicit implementation
      mockPrismaClient.customer.findUnique.mockImplementation((args) => {
        if (args.where.id === 'customer1') {
          return Promise.resolve(customerWithRelations);
        }
        return Promise.resolve(null);
      });
      
      const response = await authRequest
        .get('/customers/customer1')
        .expect(200);
      
      expect(response.body).toEqual(dateToISOStrings(customerWithRelations));
      expect(mockPrismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer1' },
        include: {
          appointments: {
            orderBy: { date: 'desc' },
            take: 5
          },
          tattooRequests: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });
    });
    
    it('should return 404 if customer not found', async () => {
      // Setup mock with explicit implementation
      mockPrismaClient.customer.findUnique.mockImplementation((args) => {
        return Promise.resolve(null);
      });
      
      await authRequest
        .get('/customers/999')
        .expect(404)
        .expect({ error: 'Customer not found' });
    });
  });

  describe('POST /customers', () => {
    it('should create a new customer', async () => {
      // New customer data
      const newCustomer = {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        phone: '555-9999'
      };
      
      const createdCustomer = {
        id: 'customer3',
        ...newCustomer,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Setup mocks with explicit implementation
      mockPrismaClient.customer.findUnique.mockImplementation((args) => {
        return Promise.resolve(null);
      });
      
      mockPrismaClient.customer.create.mockImplementation((args) => {
        return Promise.resolve(createdCustomer);
      });
      
      mockPrismaClient.auditLog.create.mockImplementation((args) => {
        return Promise.resolve({ id: 'audit1' });
      });
      
      const response = await authRequest
        .post('/customers')
        .send(newCustomer)
        .expect(200);
      
      expect(response.body).toEqual(dateToISOStrings(createdCustomer));
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith({
        data: newCustomer
      });
      
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });
    
    it('should return 409 if email already exists', async () => {
      // Setup mock with explicit implementation
      mockPrismaClient.customer.findUnique.mockImplementation((args) => {
        if (args.where.email === 'john@example.com') {
          return Promise.resolve(mockCustomers[0]);
        }
        return Promise.resolve(null);
      });
      
      await authRequest
        .post('/customers')
        .send({
          name: 'New Person',
          email: 'john@example.com' // Already exists
        })
        .expect(409)
        .expect({
          error: 'Customer with this email already exists',
          customerId: 'customer1'
        });
      
      expect(mockPrismaClient.customer.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /customers/:id', () => {
    it('should update a customer', async () => {
      const updateData = {
        name: 'John Doe Jr.',
        notes: 'Updated notes'
      };
      
      const updatedCustomer = {
        ...mockCustomers[0],
        ...updateData
      };
      
      // Setup mocks with explicit implementation
      mockPrismaClient.customer.findUnique.mockImplementation((args) => {
        if (args.where.id === 'customer1') {
          return Promise.resolve(mockCustomers[0]);
        }
        return Promise.resolve(null);
      });
      
      mockPrismaClient.customer.update.mockImplementation((args) => {
        return Promise.resolve(updatedCustomer);
      });
      
      mockPrismaClient.auditLog.create.mockImplementation((args) => {
        return Promise.resolve({ id: 'audit2' });
      });
      
      const response = await authRequest
        .put('/customers/customer1')
        .send(updateData)
        .expect(200);
      
      expect(response.body.name).toEqual('John Doe Jr.');
      expect(mockPrismaClient.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer1' },
        data: updateData
      });
      
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });
    
    it('should check email uniqueness when updating', async () => {
      // Setup mocks with explicit implementation
      mockPrismaClient.customer.findUnique.mockImplementation((args) => {
        if (args.where.id === 'customer1') {
          return Promise.resolve(mockCustomers[0]);
        } else if (args.where.email === 'jane@example.com') {
          return Promise.resolve(mockCustomers[1]); // For finding existing with same email
        }
        return Promise.resolve(null);
      });
      
      await authRequest
        .put('/customers/customer1')
        .send({
          email: 'jane@example.com' // Already used by customer2
        })
        .expect(409)
        .expect({ error: 'Email already in use by another customer' });
      
      expect(mockPrismaClient.customer.update).not.toHaveBeenCalled();
    });
  });
});
