import { User as SupabaseUser } from '@supabase/supabase-js';

// Define roles for the application - matches Prisma schema
// Customers don't login to admin system, they use public endpoints
export type UserRole = 'artist' | 'assistant' | 'admin' | 'owner';

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
  owner: 4,
  admin: 3,
  assistant: 2,
  artist: 1,
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Role-based permission checks
export const canManageAllBookings = (role: UserRole): boolean => ['admin', 'owner'].includes(role);
export const canManageOwnBookings = (role: UserRole): boolean => ['admin', 'assistant', 'artist', 'owner'].includes(role);
export const canViewAllTattooRequests = (role: UserRole): boolean => ['admin', 'assistant', 'owner'].includes(role);
export const canManageTattooRequests = (role: UserRole): boolean => ['admin', 'artist', 'owner'].includes(role);
export const canAccessAnalytics = (role: UserRole): boolean => ['admin', 'assistant', 'owner'].includes(role);
export const canManageUsers = (role: UserRole): boolean => ['admin', 'owner'].includes(role); 