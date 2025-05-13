import { mockPrismaClient } from '../../jest.setup.mjs';
import { FastifyInstance } from 'fastify';
import { build } from '../server';
import supertest from 'supertest';


// Types for common test data
export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data factory functions
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

// Test app builder with setup and teardown
export const setupTestApp = () => {
  let app: FastifyInstance;

  const setup = async () => {
    // Reset prisma mocks
    Object.values(mockPrismaClient).forEach(model => {
      if (model && typeof model === 'object') {
        Object.values(model).forEach(method => {
          if (typeof method === 'function' && 'mockReset' in method) {
            method.mockReset();
          }
        });
      }
    });

    // Build and initialize the app
    app = build();
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

// Helper to convert Date objects to ISO strings for comparison with API responses
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

// Helper to create mock HTTP requests with authentication
export const createAuthRequest = (request: supertest.SuperTest<supertest.Test>, token: string) => {
  return {
    get: (url: string) => request.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string, body?: any) => request.post(url).set('Authorization', `Bearer ${token}`).send(body),
    put: (url: string, body?: any) => request.put(url).set('Authorization', `Bearer ${token}`).send(body),
    delete: (url: string) => request.delete(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string, body?: any) => request.patch(url).set('Authorization', `Bearer ${token}`).send(body),
  };
}; 