import Fastify, { FastifyInstance } from 'fastify';
import authRoutes from '../../../src/api/routes/auth';
import { Role } from '../../../src/types/user';

// Mock dependencies
jest.mock('../../../src/integrations/supabase/auth', () => ({
  verifyToken: jest.fn(),
  isAdmin: jest.fn()
}));

jest.mock('../../../src/services/userService', () => {
  return {
    UserService: jest.fn().mockImplementation(() => ({
      upsertUser: jest.fn(),
      isUserAdmin: jest.fn()
    }))
  };
});

// Import mocked supabaseAuth
import supabaseAuth from '../../../src/integrations/supabase/auth';
import { UserService } from '../../../src/services/userService';

const mockUserService = new UserService();

describe('Auth Routes', () => {
  let fastify: FastifyInstance;
  
  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.ready();
    
    jest.clearAllMocks();
  });
  
  afterEach(async () => {
    await fastify.close();
  });
  
  describe('POST /auth/verify', () => {
    it('should return user data when token is valid', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      
      // Mock token verification
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: mockUser
      });
      
      // Mock user service
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/verify',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        authenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: Role.USER,
          isAdmin: false
        }
      });
    });
    
    it('should return 401 when token is invalid', async () => {
      // Mock token verification failure
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: false,
        user: null,
        error: 'Invalid token'
      });
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/verify',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });
      
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toEqual({
        error: 'Authentication failed',
        message: 'Invalid token'
      });
    });
    
    it('should return 401 when no token is provided', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/verify',
      });
      
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toEqual({
        error: 'Authentication required',
        message: 'No valid authentication token provided'
      });
    });
  });
  
  describe('GET /auth/status', () => {
    it('should return auth status for authenticated users', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      
      // Mock token verification
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: mockUser
      });
      
      // Mock user service calls
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/status',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        authenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: Role.USER,
          isAdmin: false
        }
      });
    });
    
    it('should return 401 when not authenticated', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/status',
      });
      
      expect(response.statusCode).toBe(401);
    });
  });
  
  describe('GET /auth/admin-only', () => {
    it('should allow access for admins', async () => {
      const mockUser = { id: 'admin123', email: 'admin@example.com' };
      
      // Mock token verification
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: mockUser
      });
      
      // Mock user service calls for admin
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(true);
      
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/admin-only',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        message: 'You have admin access',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: Role.ADMIN,
          isAdmin: true
        }
      });
    });
    
    it('should deny access for non-admins', async () => {
      const mockUser = { id: 'user123', email: 'user@example.com' };
      
      // Mock token verification
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: mockUser
      });
      
      // Mock user service calls for regular user
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/admin-only',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });
      
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.payload)).toEqual({
        error: 'Access denied',
        message: 'Requires admin privileges'
      });
    });
  });
}); 