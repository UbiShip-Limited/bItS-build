import { UserService } from '../../../src/services/userService';
import supabaseAuth from '../../../src/integrations/supabase/auth';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn()
      }
    }))
  };
});

// Mock user service
jest.mock('../../../src/services/userService', () => {
  return {
    UserService: jest.fn().mockImplementation(() => ({
      isUserAdmin: jest.fn()
    }))
  };
});

// Import the mocked module as a variable
const mockUserService = new UserService();

describe('SupabaseAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('verifyToken', () => {
    it('should return valid=true and user data when token is valid', async () => {
      // Get the client from supabaseAuth
      const client = supabaseAuth.getClient();
      
      // Mock successful authentication
      const mockUser = { id: 'test-id', email: 'test@example.com' };
      (client.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });
      
      // Call the method
      const result = await supabaseAuth.verifyToken('valid-token');
      
      // Verify the expected behavior
      expect(client.auth.getUser).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        valid: true,
        user: mockUser
      });
    });
    
    it('should return valid=false when token verification fails', async () => {
      // Get the client from supabaseAuth
      const client = supabaseAuth.getClient();
      
      // Mock failed authentication
      (client.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' }
      });
      
      // Call the method
      const result = await supabaseAuth.verifyToken('invalid-token');
      
      // Verify the expected behavior
      expect(client.auth.getUser).toHaveBeenCalledWith('invalid-token');
      expect(result).toEqual({
        valid: false,
        user: null,
        error: 'Invalid token'
      });
    });
    
    it('should handle exceptions during verification', async () => {
      // Get the client from supabaseAuth
      const client = supabaseAuth.getClient();
      
      // Mock exception
      (client.auth.getUser as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Call the method
      const result = await supabaseAuth.verifyToken('token');
      
      // Verify the expected behavior
      expect(client.auth.getUser).toHaveBeenCalledWith('token');
      expect(result).toEqual({
        valid: false,
        user: null,
        error: 'Network error'
      });
    });
  });
  
  describe('isAdmin', () => {
    it('should delegate to UserService.isUserAdmin', async () => {
      // Mock the UserService's isUserAdmin method
      (mockUserService.isUserAdmin as jest.Mock).mockResolvedValueOnce(true);
      
      // Call the method and check the result
      const result = await supabaseAuth.isAdmin('admin-user-id');
      
      // Expectations
      expect(mockUserService.isUserAdmin).toHaveBeenCalledWith('admin-user-id');
      expect(result).toBe(true);
    });
  });
}); 