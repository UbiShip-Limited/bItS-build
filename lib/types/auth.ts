import { User as SupabaseUser } from '@supabase/supabase-js';

// Define roles for the application
export type UserRole = 'artist' | 'assistant' | 'admin';

// Extended user type that includes role information
export interface UserWithRole extends SupabaseUser {
  role?: UserRole;
}

// Auth error types
export type AuthError = {
  message: string;
  statusCode: number;
}; 