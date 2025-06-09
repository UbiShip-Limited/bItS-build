import { User as SupabaseUser } from '@supabase/supabase-js';

// Define roles for the application - matches Prisma schema
// Customers don't login to admin system, they use public endpoints
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

// Permission helpers
export const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  assistant: 2,
  artist: 1,
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Role-based permission checks
export const canManageAllBookings = (role: UserRole): boolean => role === 'admin';
export const canManageOwnBookings = (role: UserRole): boolean => ['admin', 'assistant', 'artist'].includes(role);
export const canViewAllTattooRequests = (role: UserRole): boolean => ['admin', 'assistant'].includes(role);
export const canManageTattooRequests = (role: UserRole): boolean => ['admin', 'artist'].includes(role);
export const canAccessAnalytics = (role: UserRole): boolean => ['admin', 'assistant'].includes(role);
export const canManageUsers = (role: UserRole): boolean => role === 'admin'; 