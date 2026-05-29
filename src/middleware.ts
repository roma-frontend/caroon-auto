/**
 * Security Middleware (Edge runtime)
 * - Auth guard for protected routes
 * - CSP headers with nonce
 * - Security headers
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/products',
  '/categories',
  '/cart',
  '/checkout',
  '/api/health',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) return true;
  if (pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/)) return true;
  if (pathname.startsWith('/products/') || pathname.startsWith('/categories/')) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // CSP — nonce-based, strict-dynamic
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://va.vercel-scripts.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Admin routes: check auth token presence
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  response.headers.set('X-Nonce', nonce);

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('Content-Security-Policy', csp);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
