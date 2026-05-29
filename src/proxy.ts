import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16: "Proxy" is the renamed Middleware convention.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: soft gate on auth token presence (real authz is enforced
  // server-side by Convex getAdminCaller and the API routes' requireAdminAuth).
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
