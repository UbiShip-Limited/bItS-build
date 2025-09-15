import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Force Node.js runtime for all dashboard routes
  const response = NextResponse.next();

  // Add headers to ensure proper module resolution
  response.headers.set('x-middleware-runtime', 'nodejs');

  // Log for debugging in production
  if (process.env.NODE_ENV === 'production') {
    console.log(`[Dashboard Middleware] ${request.method} ${request.url}`);
  }

  return response;
}

export const config = {
  matcher: '/dashboard/:path*',
};