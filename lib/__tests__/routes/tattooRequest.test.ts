import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings, mockAuthMiddleware } from '../test-helpers';
import supertest from 'supertest';

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
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Added this line to setup auth middleware with the mock user
    mockAuthMiddleware(mockUser);
    
    // Reset mocks
    if (typeof mockPrismaClient.tattooRequest.findMany === 'function' && 'mockReset' in mockPrismaClient.tattooRequest.findMany) {
      mockPrismaClient.tattooRequest.findMany.mockReset();
      mockPrismaClient.tattooRequest.count.mockReset();
      mockPrismaClient.tattooRequest.findUnique.mockReset();
      mockPrismaClient.tattooRequest.create.mockReset();
      mockPrismaClient.tattooRequest.update.mockReset();
      mockPrismaClient.auditLog.create.mockReset();
    }
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('GET /tattoo-requests', () => {
    it('should return a paginated list of tattoo requests', async () => {
      // Setup the mocks
      mockPrismaClient.tattooRequest.findMany.mockResolvedValue(mockTattooRequests as any);
      mockPrismaClient.tattooRequest.count.mockResolvedValue(mockTattooRequests.length);
      
      const response = await authRequest
        .get('/tattoo-requests')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toEqual({
        data: mockTattooRequestWithDateStrings,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
      
      expect(mockPrismaClient.tattooRequest.findMany).toHaveBeenCalledWith({
        where: {},
        include: { customer: true, images: true },
        skip: 0,
        take: 20
      });
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
      // Setup the mocks
      mockPrismaClient.tattooRequest.findMany.mockResolvedValue([mockTattooRequests[1]] as any);
      mockPrismaClient.tattooRequest.count.mockResolvedValue(2);
      
      const response = await authRequest
        .get('/tattoo-requests?page=2&limit=1')
        .expect(200);
      
      expect(mockPrismaClient.tattooRequest.findMany).toHaveBeenCalledWith({
        where: {},
        include: { customer: true, images: true },
        skip: 1,
        take: 1
      });
      
      expect(response.body.pagination).toEqual({
        total: 2,
        page: 2,
        limit: 1,
        pages: 2
      });
    });
  });

  describe('GET /tattoo-requests/:id', () => {
    it('should return a single tattoo request', async () => {
      // Setup the mock
      mockPrismaClient.tattooRequest.findUnique.mockResolvedValue(mockTattooRequests[0] as any);
      
      const response = await authRequest
        .get('/tattoo-requests/1')
        .expect(200);
      
      expect(response.body).toEqual(mockTattooRequestWithDateStrings[0]);
      expect(mockPrismaClient.tattooRequest.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { customer: true, images: true }
      });
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
      
      // Setup mocks
      mockPrismaClient.tattooRequest.create.mockResolvedValue(createdRequest);
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit1' });
      
      const response = await authRequest
        .post('/tattoo-requests')
        .send(newRequest)
        .expect(200);
      
      expect(response.body).toEqual(dateToISOStrings(createdRequest));
      expect(mockPrismaClient.tattooRequest.create).toHaveBeenCalledWith({
        data: {
          ...newRequest,
          referenceImages: []
        }
      });
      
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
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
      
      // Setup mocks
      mockPrismaClient.tattooRequest.findUnique.mockResolvedValue(mockTattooRequests[0] as any);
      mockPrismaClient.tattooRequest.update.mockResolvedValue({
        ...mockTattooRequests[0],
        ...updateData
      });
      mockPrismaClient.auditLog.create.mockResolvedValue({ id: 'audit2' });
      
      const response = await authRequest
        .put('/tattoo-requests/1')
        .send(updateData)
        .expect(200);
      
      expect(response.body.status).toEqual('approved');
      expect(mockPrismaClient.tattooRequest.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData
      });
      
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
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
