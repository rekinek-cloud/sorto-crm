import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  console.log('🔒 Middleware checking path:', path);
  
  // Skip middleware for auth pages, API routes, and static assets
  if (
    path.startsWith('/crm/auth/') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // Redirect /dashboard to /crm/dashboard
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL(path.replace('/dashboard', '/crm/dashboard'), request.url));
  }

  // Check if user is trying to access dashboard
  if (path.startsWith('/crm/dashboard')) {
    const accessToken = request.cookies.get('access_token');
    
    if (!accessToken) {
      return NextResponse.redirect(new URL('/crm/auth/login/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};