import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

// Middleware next-intl
const intlMiddleware = createMiddleware(routing);

// BasePath from next.config.js - must match!
const BASE_PATH = '/crm';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for static assets, API routes
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Handle root path - redirect to default locale (with basePath)
  if (path === '/' || path === '') {
    return NextResponse.redirect(new URL(`${BASE_PATH}/pl`, request.url));
  }

  // Check if it's an auth page - don't require auth
  const isAuthPage = path.includes('/auth/');

  // Check if user is trying to access dashboard
  const isDashboardPage = path.includes('/dashboard');

  if (isDashboardPage && !isAuthPage) {
    const accessToken = request.cookies.get('access_token');

    if (!accessToken) {
      // Redirect to login, preserving locale (with basePath)
      const locale = path.split('/')[1];
      const loginPath = routing.locales.includes(locale as any)
        ? `${BASE_PATH}/${locale}/auth/login`
        : `${BASE_PATH}/pl/auth/login`;
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  // Apply i18n routing
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
