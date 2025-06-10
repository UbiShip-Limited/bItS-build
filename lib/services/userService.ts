import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { UserRole, UserWithRole } from '../types/auth';
import { ValidationError, NotFoundError } from './errors';
import { supabase, isSupabaseConfigured, getSupabaseClient } from '../supabase/supabaseClient';

const prisma = new PrismaClient();

// Create Supabase admin client with graceful error handling
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. User management features are not available.');
  }

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return _supabaseAdmin;
}

export interface CreateUserData {
  email: string;
  role: UserRole;
  password?: string;
  sendInvite?: boolean;
}

export interface UpdateUserData {
  email?: string;
  role?: UserRole;
  password?: string;
}

export interface UserInvitation {
  email: string;
  role: UserRole;
  invitedBy: string;
  expiresAt: Date;
}

export class UserService {
  /**
   * Create a new user account (for staff/admin use)
   */
  async createUser(userData: CreateUserData, _createdBy?: string): Promise<UserWithRole> {
    const { email, role, password, sendInvite = false } = userData;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    try {
      // Create user in Supabase Auth
      let supabaseUser;
      
      if (sendInvite) {
        // Send invitation email instead of creating with password
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { role },
          redirectTo: `${process.env.FRONTEND_URL}/auth/set-password`
        });
        
        if (error) {
          throw new Error(`Failed to send invitation: ${error.message}`);
        }
        
        supabaseUser = data.user;
      } else if (password) {
        // Create user with password
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: { role },
          email_confirm: true
        });
        
        if (error) {
          throw new Error(`Failed to create user in Supabase: ${error.message}`);
        }
        
        supabaseUser = data.user;
      } else {
        throw new ValidationError('Either password or sendInvite must be provided');
      }

      if (!supabaseUser) {
        throw new Error('Failed to create user in Supabase');
      }

      // Create user record in our database
      const user = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email,
          role,
        }
      });

      return {
        ...supabaseUser,
        role: user.role as UserRole
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error instanceof ValidationError ? error : new Error('Failed to create user');
    }
  }

  /**
   * Get user by ID with role information
   */
  async getUserById(id: string): Promise<UserWithRole | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return null;
    }

    // Get Supabase user data
    const supabaseAdmin = getSupabaseAdmin();
    const { data: supabaseUser, error } = await supabaseAdmin.auth.admin.getUserById(id);
    
    if (error || !supabaseUser.user) {
      throw new Error('Failed to fetch user from Supabase');
    }

    return {
      ...supabaseUser.user,
      role: user.role as UserRole
    };
  }

  /**
   * Update user information
   */
  async updateUser(id: string, updateData: UpdateUserData): Promise<UserWithRole> {
    const { email, role, password } = updateData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    try {
      // Update in Supabase if needed
      if (email || password) {
        const supabaseUpdates: { email?: string; password?: string } = {};
        if (email) supabaseUpdates.email = email;
        if (password) supabaseUpdates.password = password;

        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, supabaseUpdates);
        
        if (error) {
          throw new Error(`Failed to update user in Supabase: ${error.message}`);
        }
      }

      // Update in our database
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(role && { role }),
          updatedAt: new Date()
        }
      });

      // Get updated Supabase user data
      const supabaseAdmin = getSupabaseAdmin();
      const { data: supabaseUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);
      
      if (fetchError || !supabaseUser.user) {
        throw new Error('Failed to fetch updated user from Supabase');
      }

      return {
        ...supabaseUser.user,
        role: updatedUser.role as UserRole
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error instanceof ValidationError || error instanceof NotFoundError 
        ? error 
        : new Error('Failed to update user');
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(id: string): Promise<void> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    try {
      // Delete from Supabase
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      
      if (error) {
        throw new Error(`Failed to delete user from Supabase: ${error.message}`);
      }

      // Delete from our database
      await prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error instanceof NotFoundError ? error : new Error('Failed to delete user');
    }
  }

  /**
   * List all users with pagination
   */
  async listUsers(page: number = 1, limit: number = 20): Promise<{
    users: UserWithRole[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count()
    ]);

    // Get Supabase user data for each user
    const usersWithSupabaseData = await Promise.all(
      users.map(async (user) => {
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { data: supabaseUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
          if (supabaseUser?.user) {
            return {
              ...supabaseUser.user,
              role: user.role as UserRole
            };
          } else {
            // Fallback if no Supabase user found
            throw new Error('No Supabase user data');
          }
        } catch (error) {
          console.error(`Error fetching Supabase data for user ${user.id}:`, error);
          // Return a minimal UserWithRole when Supabase data is unavailable
          return {
            id: user.id,
            email: user.email || '',
            role: user.role as UserRole,
            created_at: user.createdAt.toISOString(),
            updated_at: user.updatedAt.toISOString(),
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            email_confirmed_at: user.createdAt.toISOString(),
            last_sign_in_at: undefined,
            phone: undefined,
            phone_confirmed_at: undefined,
            confirmation_sent_at: undefined,
            confirmed_at: user.createdAt.toISOString(),
            email_change_sent_at: undefined,
            new_email: undefined,
            invited_at: undefined,
            action_link: undefined,
            email_change_confirm_status: 0,
            banned_until: undefined,
            new_phone: undefined,
            phone_change_sent_at: undefined,
            phone_change_token: undefined,
            phone_change: undefined,
            is_sso_user: false,
            deleted_at: undefined,
            is_anonymous: false
          } as UserWithRole;
        }
      })
    );

    return {
      users: usersWithSupabaseData,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(authToken: string): Promise<UserWithRole | null> {
    try {
      const { data, error } = await supabase.auth.getUser(authToken);
      
      if (error || !data.user) {
        return null;
      }

      // Get role from our database
      const userRecord = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { role: true }
      });

      if (!userRecord) {
        return null;
      }

      return {
        ...data.user,
        role: userRecord.role as UserRole
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Update current user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        throw new Error(`Failed to update password: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw error instanceof Error ? error : new Error('Failed to update password');
    }
  }
} 