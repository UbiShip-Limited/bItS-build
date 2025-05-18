import { mockPrismaClient } from '../../jest.setup.mjs';
import { FastifyInstance } from 'fastify';
import { build } from '../server';
import supertest from 'supertest';
import { jest } from '@jest/globals';
import { setPrismaClient } from '../plugins/prisma';

// Import the auth middleware mocks
import { dummyAuthMiddleware, mockAuthMiddleware } from './middleware-mock';

/**
 * Interface for test users
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates mock test users
 */
export const createMockUsers = (count = 2): TestUser[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    email: `test${i + 1}@example.com`,
    password: `password${i + 1}`,
    role: i === 0 ? 'artist' : 'assistant',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

/**
 * Sets up a test Fastify app with authentication mocking
 */
export const setupTestApp = () => {
  let app: FastifyInstance;

  const setup = async () => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Set the mock Prisma client before building the app
    setPrismaClient(mockPrismaClient);

    // Build the Fastify app
    app = build();
    
    // This will ensure the routes are actually registered
    // Log which routes are registered to debug
    console.log('Registered routes:', app.printRoutes());
    
    // Add the hook for auth
    app.addHook('preHandler', (req, reply, done) => {
      if (dummyAuthMiddleware.mock.calls.length) {
        dummyAuthMiddleware(req, reply, done);
      } else {
        done();
      }
    });
    
    await app.ready();
    
    return {
      app,
      request: supertest(app.server),
    };
  };

  const teardown = async () => {
    if (app) {
      await app.close();
    }
  };

  return {
    setup,
    teardown,
  };
};

/**
 * Converts Date objects to ISO strings recursively
 */
export const dateToISOStrings = <T extends object>(obj: T): T => {
  const result = { ...obj };
  
  Object.entries(result).forEach(([key, value]) => {
    if (value instanceof Date) {
      (result as any)[key] = value.toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as any)[key] = dateToISOStrings(value);
    } else if (Array.isArray(value)) {
      (result as any)[key] = value.map(item => 
        typeof item === 'object' && item !== null ? dateToISOStrings(item) : item
      );
    }
  });
  
  return result;
};

/**
 * Creates authenticated request helpers
 */
export const createAuthRequest = (request: supertest.SuperTest<supertest.Test>, token: string) => {
  return {
    get: (url: string) => request.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string, body?: any) => request.post(url).set('Authorization', `Bearer ${token}`).send(body),
    put: (url: string, body?: any) => request.put(url).set('Authorization', `Bearer ${token}`).send(body),
    delete: (url: string) => request.delete(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string, body?: any) => request.patch(url).set('Authorization', `Bearer ${token}`).send(body),
  };
};

// Export the auth middleware for use in tests
export { mockAuthMiddleware };