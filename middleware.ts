import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/auth/register'];
  const adminOnlyRoutes = ['/auth/register'];
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
  
  // Skip auth check for login page and public routes
  if (pathname === '/auth/login' || !isProtectedRoute) {
    return res;
  }
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      // Be more forgiving during initial auth flow
      console.log(`Middleware: No session found for ${pathname}. Error: ${error?.message || 'No session'}`);
      
      // For dashboard routes, allow through and let client-side handle auth
      // This prevents redirect loops during initial login
      if (pathname.startsWith('/dashboard')) {
        console.log('🔄 Dashboard route: Allowing through, client-side will handle auth');
        return res;
      }
      
      // For other protected routes, redirect
      console.log('🚪 Protected route: Redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // For admin-only routes, check if user has admin role
    if (isAdminOnlyRoute) {
      // Check user role from our database
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}/users/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log('Failed to fetch user role, redirecting to login');
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      
      const userData = await response.json();
      
      if (userData.user?.role !== 'admin') {
        // Not an admin, redirect to dashboard with error
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('error', 'insufficient_permissions');
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Set the user data in headers for the page to use
    res.headers.set('x-user-id', session.user.id);
    res.headers.set('x-user-email', session.user.email || '');
    
  } catch (error) {
    console.error(`Middleware auth error for ${pathname}:`, error);
    
    // For dashboard routes, be more forgiving on errors
    if (pathname.startsWith('/dashboard')) {
      console.log('🔄 Dashboard route error: Allowing through, client-side will handle');
      return res;
    }
    
    // For other protected routes, redirect on error
    console.log('🚪 Protected route error: Redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
