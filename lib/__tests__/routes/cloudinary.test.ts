// Set test environment for Node.js
// Using Object.defineProperty to avoid "read-only" error
if (process.env.NODE_ENV !== 'test') {
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });
}

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupTestApp, createAuthRequest } from '../test-helpers';
import supertest from 'supertest';
import { mockAuthMiddleware } from '../middleware-mock';
import type { CloudinaryUploadResult } from '../../cloudinary/index';
import { FastifyRequest, FastifyReply } from 'fastify';

// Create fixed test data
const FIXED_TIMESTAMP = 1612345678;
const FIXED_SIGNATURE = 'test-signature';

// Mock the cloudinary npm package before any imports
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      api: {
        resource: jest.fn().mockImplementation((publicId) => {
          if (publicId === 'invalid-id') {
            return Promise.reject(new Error('Resource not found'));
          }
          return Promise.resolve({
            public_id: 'test-id',
            url: 'http://test.com/image.jpg',
            secure_url: 'https://test.com/image.jpg',
            format: 'jpg',
            width: 800,
            height: 600,
            resource_type: 'image',
            metadata: { test: 'data' }
          });
        })
      },
      uploader: {
        upload: jest.fn(),
        destroy: jest.fn()
      },
      utils: {
        api_sign_request: jest.fn().mockReturnValue(FIXED_SIGNATURE)
      },
      url: jest.fn()
    }
  };
});

// Fix the Math.round to return a consistent timestamp
const originalMathRound = Math.round;
// @ts-ignore - Using any to override the Math.round function
Math.round = function(num: number): number {
  if (typeof num === 'number' && num.toString().includes('000')) { // Detecting timestamp
    return FIXED_TIMESTAMP;
  }
  return originalMathRound(num);
};

// We'll use setupTestApp and mockAuthMiddleware instead of manually mocking the auth module
// This lets the existing mock infrastructure work instead of dealing with ES modules

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'artist@example.com',
  role: 'artist'
};

describe('Cloudinary Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup auth middleware with the mock user
    mockAuthMiddleware(mockUser);
    
    // Setup test app and get supertest instance
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('POST /cloudinary/signature', () => {
    it('should generate an upload signature', async () => {
      const response = await authRequest
        .post('/cloudinary/signature')
        .send({ folder: 'test-folder', tags: ['tag1', 'tag2'] });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        signature: expect.any(String),
        timestamp: expect.any(Number),
        apiKey: expect.any(String),
        cloudName: expect.any(String)
      });
    });
    
    it('should use default folder if not provided', async () => {
      const response = await authRequest
        .post('/cloudinary/signature')
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        signature: expect.any(String),
        timestamp: expect.any(Number),
        apiKey: expect.any(String),
        cloudName: expect.any(String)
      });
    });
    
    it('should require authentication', async () => {
      const response = await request
        .post('/cloudinary/signature')
        .send({});
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /cloudinary/validate', () => {
    it('should validate an upload and return metadata', async () => {
      const response = await authRequest
        .post('/cloudinary/validate')
        .send({ publicId: 'test-id' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        publicId: expect.any(String),
        url: expect.any(String),
        secureUrl: expect.any(String),
        format: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
        resourceType: expect.any(String),
        metadata: expect.any(Object)
      });
    });
    
    it('should return 400 when validation fails', async () => {
      const response = await authRequest
        .post('/cloudinary/validate')
        .send({ publicId: 'invalid-id' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid or unauthorized image upload' });
    });
    
    it('should require publicId parameter', async () => {
      const response = await authRequest
        .post('/cloudinary/validate')
        .send({});
      
      expect(response.status).toBe(400);
    });
    
    it('should require authentication', async () => {
      const response = await request
        .post('/cloudinary/validate')
        .send({ publicId: 'test-id' });
      
      expect(response.status).toBe(401);
    });
  });
}); 