import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../jest.setup.mjs';
import { createMockUsers, dateToISOStrings, setupTestApp } from './test-helpers';
import supertest from 'supertest';

// Create test data
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
    const findMany = mockPrismaClient.user.findMany;
    if (isMockFunction(findMany)) {
      findMany.mockReset();
    }
  });

  afterEach(async () => {
    await testApp.teardown();
  });

  describe('GET /users endpoint', () => {
    it('should return a list of users successfully', async () => {
      // Setup the mock for this specific test
      const findMany = mockPrismaClient.user.findMany;
      if (isMockFunction(findMany)) {
        // Use type assertion to avoid type errors
        (findMany as any).mockResolvedValue(mockUsers);
      }

      const response = await request
        .get('/users')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toEqual(mockUsersWithDateStrings);
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if Prisma query fails', async () => {
      // Setup the mock to simulate an error
      const findMany = mockPrismaClient.user.findMany;
      if (isMockFunction(findMany)) {
        // Use type assertion to avoid type errors
        (findMany as any).mockRejectedValue(new Error('Database error'));
      }

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