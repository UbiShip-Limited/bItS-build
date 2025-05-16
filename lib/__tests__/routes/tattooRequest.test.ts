process.env.NODE_ENV = 'test';

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings } from '../test-helpers';
import supertest from 'supertest';

// Type guard for mocked functions like in server.test.ts
const isMockFunction = (fn: any): fn is jest.Mock => 
  fn && typeof fn === 'function' && typeof fn.mockReset === 'function';

// Mock data
const mockTattooRequests = [
  {
    id: '1',
    customerId: 'customer1',
    description: 'Dragon tattoo',
    placement: 'Arm',
    size: 'Medium',
    colorPreference: 'Full color',
    style: 'Japanese',
    referenceImages: JSON.parse("[]"), // Parse the JSON string to match Json type
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    images: [] // This is fine as an empty array because it's a relation
  },
  {
    id: '2',
    customerId: 'customer2',
    description: 'Flower tattoo',
    placement: 'Back',
    size: 'Small',
    colorPreference: 'Black and grey',
    style: 'Minimalist',
    referenceImages: JSON.parse("[]"), // Parse the JSON string to match Json type
    status: 'reviewed',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-5678',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    images: [] // This is fine as an empty array because it's a relation
  }
];

const mockTattooRequestWithDateStrings = mockTattooRequests.map(req => dateToISOStrings(req));

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'artist@example.com',
  role: 'artist'
};

describe('Tattoo Request Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  beforeEach(async () => {
    // Setup test app and get supertest instance
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Reset mocks using the type guard pattern from server.test.ts
    if (isMockFunction(mockPrismaClient.tattooRequest.findMany)) {
      mockPrismaClient.tattooRequest.findMany.mockReset();
      mockPrismaClient.tattooRequest.count.mockReset();
      mockPrismaClient.tattooRequest.findUnique.mockReset();
      mockPrismaClient.tattooRequest.create.mockReset();
      mockPrismaClient.tattooRequest.update.mockReset();
      mockPrismaClient.auditLog.create.mockReset();
      mockPrismaClient.user.findUnique.mockReset();
    }
    
    // Setup explicit mock implementation for user auth check
    mockPrismaClient.user.findUnique.mockImplementation((args) => {
      console.log('Mock user.findUnique called with:', JSON.stringify(args));
      return Promise.resolve({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
    });

    // Add this right after creating authRequest
    console.log('Auth request setup with token:', mockToken);
    // Log a sample request to verify headers
    const sampleHeaders = authRequest.get('/').header;
    console.log('Sample headers:', sampleHeaders);
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('GET /tattoo-requests', () => {
    it('should return a paginated list of tattoo requests', async () => {
      try {
        // Setup explicit mock implementations
        mockPrismaClient.tattooRequest.findMany.mockImplementation(() => {
          console.log('Mock tattooRequest.findMany implementation called');
          return Promise.resolve(mockTattooRequests);
        });
        
        mockPrismaClient.tattooRequest.count.mockImplementation(() => {
          console.log('Mock tattooRequest.count implementation called');
          return Promise.resolve(mockTattooRequests.length);
        });
        
        console.log('Making request to /tattoo-requests');
        // Add debug headers to check authorization
        const response = await authRequest
          .get('/tattoo-requests')
          .set('x-debug', 'true')
          .expect(200)
          .expect('Content-Type', /json/);
        
        console.log('Response body:', JSON.stringify(response.body));
        
        expect(response.body).toEqual({
          data: mockTattooRequestWithDateStrings,
          pagination: {
            total: 2,
            page: 1,
            limit: 20,
            pages: 1
          }
        });
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });
    
    it('should filter by status', async () => {
      // Setup the mocks
      mockPrismaClient.tattooRequest.findMany.mockResolvedValue([mockTattooRequests[0]] as any);
      mockPrismaClient.tattooRequest.count.mockResolvedValue(1);
      
      const response = await authRequest
        .get('/tattoo-requests?status=new')
        .expect(200);
      
      expect(mockPrismaClient.tattooRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'new' },
        include: { customer: true, images: true },
        skip: 0,
        take: 20
      });
    });
    
    it('should handle pagination correctly', async () => {
      // Setup explicit mock implementations with more details
      mockPrismaClient.tattooRequest.findMany.mockImplementation(() => {
        console.log('Mock tattooRequest.findMany implementation called with pagination');
        return Promise.resolve([mockTattooRequests[1]]);
      });
      
      mockPrismaClient.tattooRequest.count.mockImplementation(() => {
        console.log('Mock tattooRequest.count implementation called with pagination');
        return Promise.resolve(2); // This is important! Make sure it returns 2
      });
      
      console.log('Making request to /tattoo-requests with pagination');
      const response = await authRequest
        .get('/tattoo-requests?page=2&limit=1')
        .expect(200);
      
      console.log('Pagination response:', JSON.stringify(response.body.pagination));
      
      // Modified expectations to check fields individually for better error messages
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /tattoo-requests/:id', () => {
    it('should return a single tattoo request', async () => {
      // Setup explicit mock implementation
      mockPrismaClient.tattooRequest.findUnique.mockImplementation((args) => {
        console.log('Mock tattooRequest.findUnique implementation called with:', JSON.stringify(args));
        if (args.where.id === '1') {
          return Promise.resolve(mockTattooRequests[0]);
        }
        return Promise.resolve(null);
      });
      
      console.log('Making request to /tattoo-requests/1');
      const response = await authRequest
        .get('/tattoo-requests/1')
        .expect(200);
      
      console.log('Single tattoo response:', JSON.stringify(response.body));
      expect(response.body).toEqual(mockTattooRequestWithDateStrings[0]);
    });
    
    it('should return 404 if tattoo request not found', async () => {
      // Setup the mock
      mockPrismaClient.tattooRequest.findUnique.mockResolvedValue(null);
      
      await authRequest
        .get('/tattoo-requests/999')
        .expect(404)
        .expect({ error: 'Tattoo request not found' });
    });
  });

  describe('POST /tattoo-requests', () => {
    it('should create a new tattoo request', async () => {
      // New request data
      const newRequest = {
        customerId: 'customer3',
        description: 'Wolf tattoo',
        placement: 'Chest',
        size: 'Large',
        colorPreference: 'Black',
        style: 'Realistic'
      };
      
      const createdRequest = {
        id: '3',
        ...newRequest,
        referenceImages: [],
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Setup explicit mock implementations
      mockPrismaClient.tattooRequest.create.mockImplementation((args) => {
        console.log('Mock tattooRequest.create implementation called with:', JSON.stringify(args));
        return Promise.resolve(createdRequest);
      });
      
      mockPrismaClient.auditLog.create.mockImplementation((args) => {
        console.log('Mock auditLog.create implementation called');
        return Promise.resolve({ id: 'audit1' });
      });
      
      console.log('Making POST request to /tattoo-requests');
      const response = await authRequest
        .post('/tattoo-requests')
        .send(newRequest)
        .expect(200);
      
      console.log('Create response:', JSON.stringify(response.body));
      expect(response.body).toEqual(dateToISOStrings(createdRequest));
    });
    
    it('should validate required fields', async () => {
      await authRequest
        .post('/tattoo-requests')
        .send({ customerId: 'customer3' }) // Missing description
        .expect(400);
    });
  });

  describe('PUT /tattoo-requests/:id', () => {
    it('should update a tattoo request', async () => {
      const updateData = {
        status: 'approved'
      };
      
      // IMPORTANT: Reset mocks before this test
      mockPrismaClient.tattooRequest.findUnique.mockReset();
      mockPrismaClient.tattooRequest.update.mockReset();
      mockPrismaClient.auditLog.create.mockReset();
      
      // Setup explicit mock implementations
      mockPrismaClient.tattooRequest.findUnique.mockImplementation((args) => {
        console.log('Mock tattooRequest.findUnique implementation called with:', JSON.stringify(args));
        if (args?.where?.id === '1') {
          console.log('Returning mock tattoo request for id 1');
          return Promise.resolve(mockTattooRequests[0]);
        }
        console.log('Returning null for id:', args?.where?.id);
        return Promise.resolve(null);
      });
      
      mockPrismaClient.tattooRequest.update.mockImplementation((args) => {
        console.log('Mock tattooRequest.update implementation called with:', JSON.stringify(args));
        const updated = {
          ...mockTattooRequests[0],
          ...updateData
        };
        console.log('Returning updated tattoo request:', JSON.stringify(updated));
        return Promise.resolve(updated);
      });
      
      mockPrismaClient.auditLog.create.mockImplementation((args) => {
        console.log('Mock auditLog.create implementation called with:', JSON.stringify(args));
        return Promise.resolve({ id: 'audit2' });
      });
      
      console.log('Making PUT request to /tattoo-requests/1');
      try {
        const response = await authRequest
          .put('/tattoo-requests/1')
          .send(updateData)
          .expect(200);
        
        console.log('Update response:', JSON.stringify(response.body));
        expect(response.body.status).toEqual('approved');
      } catch (error) {
        console.error('PUT test failed:', error.message);
        console.log('Mock was called:', mockPrismaClient.tattooRequest.findUnique.mock.calls.length, 'times');
        
        // Let's try to debug why findUnique might not be working
        const testFind = await mockPrismaClient.tattooRequest.findUnique({ where: { id: '1' } });
        console.log('Test find result:', testFind);
        
        throw error;
      }
    });
    
    it('should return 404 if tattoo request not found', async () => {
      // Setup mock
      mockPrismaClient.tattooRequest.findUnique.mockResolvedValue(null);
      
      await authRequest
        .put('/tattoo-requests/999')
        .send({ status: 'approved' })
        .expect(404)
        .expect({ error: 'Tattoo request not found' });
    });
  });
});
