import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireRole, requireAdmin } from '../../../src/middleware/auth';
import supabaseAuth from '../../../src/integrations/supabase/auth';
import { UserService } from '../../../src/services/userService';
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

// Mock headers and send for request/reply
const mockRequest = (headers = {}) => {
  return {
    headers,
    user: undefined
  } as unknown as FastifyRequest;
};

const mockReply = () => {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sent: false,
  } as unknown as FastifyReply;
  return reply;
};

// Get mock UserService
const mockUserService = new UserService();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('authenticate', () => {
    it('should return 401 if no token is provided', async () => {
      const req = mockRequest();
      const reply = mockReply();
      
      await authenticate(req, reply);
      
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No valid authentication token provided'
      });
    });
    
    it('should return 401 if token verification fails', async () => {
      const req = mockRequest({ authorization: 'Bearer invalid-token' });
      const reply = mockReply();
      
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: false,
        user: null,
        error: 'Invalid token'
      });
      
      await authenticate(req, reply);
      
      expect(supabaseAuth.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid token'
      });
    });
    
    it('should attach user data to request if token is valid', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      const mockUser = { id: 'user123', email: 'test@example.com' };
      
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: mockUser
      });
      
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        role: Role.USER
      });
      
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      await authenticate(req, reply);
      
      expect(supabaseAuth.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockUserService.upsertUser).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email
      });
      expect(mockUserService.isUserAdmin).toHaveBeenCalledWith(mockUser.id);
      
      expect(req.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: Role.USER,
        isAdmin: false
      });
      
      expect(reply.status).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });
    
    it('should handle database errors and return 500', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      const mockUser = { id: 'user123', email: 'test@example.com' };
      
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: mockUser
      });
      
      (mockUserService.upsertUser as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );
      
      await authenticate(req, reply);
      
      expect(reply.status).toHaveBeenCalledWith(500);
      expect(reply.send).toHaveBeenCalledWith({
        error: 'Server error',
        message: 'Failed to authenticate user'
      });
    });
  });
  
  describe('requireRole', () => {
    it('should proceed if user has the required role', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      
      // Mock successful authentication
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: { id: 'user123', email: 'test@example.com' }
      });
      
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      // Set up request to have user data after authentication
      const requireUserRole = requireRole(Role.USER);
      await requireUserRole(req, reply);
      
      // Verify expected behavior
      expect(req.user).toBeDefined();
      expect(reply.status).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });
    
    it('should allow admin access to any role-protected route', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      
      // Mock successful authentication
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: { id: 'admin123', email: 'admin@example.com' }
      });
      
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(true);
      
      // Set up request to have admin user data after authentication
      const requireArtistRole = requireRole(Role.ARTIST);
      await requireArtistRole(req, reply);
      
      // Verify admin can access artist-only route
      expect(req.user).toBeDefined();
      expect(reply.status).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });
    
    it('should return 403 if user lacks the required role', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      
      // Mock successful authentication but with regular user
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: { id: 'user123', email: 'user@example.com' }
      });
      
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      // Set up request and attempt to access ARTIST-only route
      const requireArtistRole = requireRole(Role.ARTIST);
      await requireArtistRole(req, reply);
      
      // Verify access denied
      expect(reply.status).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith({
        error: 'Access denied',
        message: `Requires ${Role.ARTIST} role`
      });
    });
  });
  
  describe('requireAdmin', () => {
    it('should proceed if user is an admin', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      
      // Mock successful authentication with admin user
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: { id: 'admin123', email: 'admin@example.com' }
      });
      
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(true);
      
      await requireAdmin(req, reply);
      
      // Verify admin can proceed
      expect(reply.status).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });
    
    it('should return 403 if user is not an admin', async () => {
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const reply = mockReply();
      
      // Mock successful authentication but with regular user
      (supabaseAuth.verifyToken as jest.Mock).mockResolvedValueOnce({
        valid: true,
        user: { id: 'user123', email: 'user@example.com' }
      });
      
      (mockUserService.upsertUser as jest.Mock).mockResolvedValueOnce({});
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(false);
      
      await requireAdmin(req, reply);
      
      // Verify access denied
      expect(reply.status).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'Requires admin privileges'
      });
    });
  });
}); 