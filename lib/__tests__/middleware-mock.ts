/**
 * Separate file for auth middleware mocking
 * This avoids hoisting issues in test-helpers.ts
 */
import { jest } from '@jest/globals';
import { FastifyRequest, FastifyReply } from 'fastify';

// Define a more flexible Request type that can accept a user object
export interface MockUserRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Create a basic mock middleware that injects a user into the request
 */
export const dummyAuthMiddleware = jest.fn().mockImplementation(
  (req: MockUserRequest, _reply: FastifyReply, done: () => void) => {
    // Default implementation just calls next
    done();
  }
);

/**
 * Helper to mock the authentication middleware with a specific user
 */
export const mockAuthMiddleware = (mockUser: MockUserRequest['user']) => {
  // Reset the previous mock implementation
  dummyAuthMiddleware.mockReset();
  
  // Set up a new implementation that injects the user
  dummyAuthMiddleware.mockImplementation(
    (req: MockUserRequest, _reply: FastifyReply, done: () => void) => {
      req.user = mockUser;
      done();
    }
  );
  
  return dummyAuthMiddleware;
};

// Instead of using jest.mock which has issues with ESM,
// export a function that manually mocks the auth middleware
// when imported by tests
export const setupAuthMock = () => {
  // Return the mocked module API
  return {
    authenticate: dummyAuthMiddleware,
    authorize: jest.fn(() => dummyAuthMiddleware)
  };
}; 