import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/tattooRequest',
    '/auth/login',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/update-password',
    '/api/tattooRequest',
  ];

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/auth/register'];
  const adminOnlyRoutes = ['/auth/register'];

  // Check if this is a public route (exact match or starts with for API routes)
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route ||
    (route === '/api/tattooRequest' && pathname.startsWith(route))
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));

  // If not a protected route, it's a public route we haven't explicitly listed - allow it
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  
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
      console.log(`🔒 Middleware: No session found for protected route ${pathname}`);

      // Redirect to login for ALL protected routes including dashboard
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // For admin-only routes, check if user has admin role
    if (isAdminOnlyRoute) {
      try {
        // Check user role from our database
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'}/users/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          if (userData.user?.role !== 'admin') {
            // Not an admin, redirect to dashboard with error
            const redirectUrl = new URL('/dashboard', request.url);
            redirectUrl.searchParams.set('error', 'insufficient_permissions');
            return NextResponse.redirect(redirectUrl);
          }
        } else {
          // Failed to verify admin role, redirect to dashboard
          console.log('⚠️ Admin route: Failed to verify admin role, redirecting to dashboard');
          const dashboardUrl = new URL('/dashboard', request.url);
          dashboardUrl.searchParams.set('error', 'role_verification_failed');
          return NextResponse.redirect(dashboardUrl);
        }
      } catch (error) {
        // Error checking admin role, deny access
        console.error('❌ Admin route error:', error);
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'role_check_error');
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // Set the user data in headers for the page to use
    res.headers.set('x-user-id', session.user.id);
    res.headers.set('x-user-email', session.user.email || '');

    // Add security headers
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy - adjust as needed for your app
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com https://res.cloudinary.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ];
    res.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  } catch (error) {
    console.error(`❌ Middleware auth error for ${pathname}:`, error);

    // On any error, deny access to protected routes
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    loginUrl.searchParams.set('error', 'auth_error');
    return NextResponse.redirect(loginUrl);
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
