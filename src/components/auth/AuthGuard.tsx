'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/src/lib/types/auth';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * AuthGuard component - Protects routes requiring authentication
 * Works in conjunction with middleware for double-layer protection
 */
export function AuthGuard({
  children,
  requiredRoles,
  redirectTo = '/auth/login',
  fallback
}: AuthGuardProps) {
  const { user, session, loading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip checks while loading
    if (loading) return;

    // No session or user - redirect to login
    if (!session || !user) {
      console.log('🔒 AuthGuard: No authenticated user, redirecting to login');
      const loginUrl = new URL(redirectTo, window.location.origin);
      loginUrl.searchParams.set('from', pathname);
      router.push(loginUrl.toString());
      return;
    }

    // Check required roles if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasRole(requiredRoles)) {
        console.log(`⚠️ AuthGuard: User lacks required role. Required: ${requiredRoles.join(', ')}, User has: ${user.role}`);
        router.push('/dashboard?error=insufficient_permissions');
        return;
      }
    }
  }, [user, session, loading, requiredRoles, router, pathname, redirectTo, hasRole]);

  // Show loading state
  if (loading) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session || !user) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="text-center">
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-obsidian">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-400 mb-6">
              You don't have the required permissions to access this area.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gold-500 text-obsidian font-semibold rounded-lg hover:bg-gold-600 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard requiredRoles={requiredRoles}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}