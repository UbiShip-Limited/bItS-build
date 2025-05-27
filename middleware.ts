import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Proxy /api/* requests to backend, excluding Next.js API routes
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/upload')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const path = request.nextUrl.pathname.replace('/api', '');
    
    return NextResponse.rewrite(new URL(path, backendUrl));
  }
}

export const config = {
  matcher: '/api/:path*',
};
