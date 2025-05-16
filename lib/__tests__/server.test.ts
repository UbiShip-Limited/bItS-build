import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../jest.setup.mjs';
import { createMockUsers, dateToISOStrings, setupTestApp } from './test-helpers';
import supertest from 'supertest';

// Create test data with fixed date strings for consistency
const mockUsers = createMockUsers(2);
const mockUsersWithDateStrings = mockUsers.map(user => dateToISOStrings(user));

// Type guard for mocked functions
const isMockFunction = (fn: any): fn is jest.Mock => 
  fn && typeof fn === 'function' && typeof fn.mockReset === 'function';

describe('Server', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  
  beforeEach(async () => {
    // Setup test app and get supertest instance
    const setup = await testApp.setup();
    request = setup.request;
    
    // Reset the mocks for each test
    if (isMockFunction(mockPrismaClient.user.findMany)) {
      mockPrismaClient.user.findMany.mockReset();
    }
  });

  afterEach(async () => {
    await testApp.teardown();
  });

  describe('GET /users endpoint', () => {
    it('should return a list of users successfully', async () => {
      // Setup the mock for this specific test with explicit implementation
      // Use the string date version to avoid serialization issues
      mockPrismaClient.user.findMany.mockImplementation(() => {
        console.log('Mock implementation called');
        return Promise.resolve(mockUsersWithDateStrings);
      });
      
      console.log('Mock data being returned:', JSON.stringify(mockUsersWithDateStrings));

      const response = await request
        .get('/users')
        .expect(200)
        .expect('Content-Type', /json/);
      
      console.log('Response body received:', JSON.stringify(response.body));
      
      // If response body is empty but status is 200, something is wrong with serialization
      if (Object.keys(response.body).length === 0) {
        console.error('Empty response body received with status 200');
      }
      
      expect(response.body).toEqual(mockUsersWithDateStrings);
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if Prisma query fails', async () => {
      // Setup the mock to simulate an error
      mockPrismaClient.user.findMany.mockImplementation(() => {
        console.log('Mock error implementation called');
        return Promise.reject(new Error('Database error'));
      });

      const response = await request
        .get('/users')
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual({ error: 'Failed to fetch users' });
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // Add more describe blocks for other routes or functionalities
}); 