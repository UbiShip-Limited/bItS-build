import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../../config';
import { UserService } from '../../services/userService';

// Initialize UserService
const userService = new UserService();

/**
 * Singleton class to manage Supabase client instance
 */
class SupabaseAuth {
  private static instance: SupabaseAuth;
  private client: SupabaseClient;
  
  private constructor() {
    this.client = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY
    );
  }
  
  /**
   * Get the Supabase client instance
   */
  public static getInstance(): SupabaseAuth {
    if (!SupabaseAuth.instance) {
      SupabaseAuth.instance = new SupabaseAuth();
    }
    
    return SupabaseAuth.instance;
  }
  
  /**
   * Get the Supabase client
   */
  public getClient(): SupabaseClient {
    return this.client;
  }
  
  /**
   * Verify a JWT token from Supabase
   * @param token JWT token to verify
   */
  public async verifyToken(token: string): Promise<{
    valid: boolean;
    user: any | null;
    error?: string;
  }> {
    try {
      const { data, error } = await this.client.auth.getUser(token);
      
      if (error) {
        return {
          valid: false,
          user: null,
          error: error.message
        };
      }
      
      return {
        valid: true,
        user: data.user
      };
    } catch (err: any) {
      return {
        valid: false,
        user: null,
        error: err.message || 'Unknown error verifying token'
      };
    }
  }
  
  /**
   * Check if user has admin role using Prisma database
   * @param userId User ID to check
   */
  public async isAdmin(userId: string): Promise<boolean> {
    return userService.isUserAdmin(userId);
  }
}

export default SupabaseAuth.getInstance(); 