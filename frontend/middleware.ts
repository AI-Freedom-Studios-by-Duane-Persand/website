import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT secret for decoding (should match backend, use env in prod)
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function middleware(req: NextRequest) {
  // Redirect /dashboard to /app/dashboard
  if (req.nextUrl.pathname === '/dashboard') {
    const url = req.nextUrl.clone();
    url.pathname = '/app/dashboard';
    return NextResponse.redirect(url);
  }

  const publicPaths = [
    '/login',
    '/signup',
    '/pricing',
    '/billing/success',
    '/billing/canceled',
    '/api/auth/login',
    '/api/auth/signup',
  ];
  // Next.js middleware for route guards (auth + subscription)
  const token = req.cookies.get('auth_token');
  const subscription = req.cookies.get('subscription_status');
  const url = req.nextUrl.clone();
  // Extensive logging
  console.log('[MIDDLEWARE] Incoming request:', req.nextUrl.pathname);
  console.log('[MIDDLEWARE] Cookie token:', token ? token.value : null);
  console.log('[MIDDLEWARE] Cookie subscription:', subscription ? subscription.value : null);

  // Protect admin routes with role-based guard
  if (url.pathname.startsWith('/admin')) {
    if (!token) {
      console.log('[MIDDLEWARE] No auth_token cookie, redirecting to /login');
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    try {
      const decoded = jwt.decode(token.value);
      console.log('[MIDDLEWARE] Decoded JWT:', decoded);
      // decoded can be string or JwtPayload
      if (typeof decoded === 'object' && decoded !== null) {
        // Accept both role and roles[]
        const roles = Array.isArray((decoded as any).roles) ? (decoded as any).roles : [(decoded as any).role];
        console.log('[MIDDLEWARE] Roles for admin check:', roles);
        if (!roles.includes('superadmin') && !roles.includes('admin')) {
          console.log('[MIDDLEWARE] Not an admin, redirecting to /login');
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
      } else {
        console.log('[MIDDLEWARE] Decoded JWT is not an object, redirecting to /login');
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.log('[MIDDLEWARE] Error decoding JWT:', err);
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  // Protect tenant routes with subscription status
  if (url.pathname.startsWith('/tenant')) {
    if (!token) {
      url.pathname = '/public/login';
      return NextResponse.redirect(url);
    }
    if (subscription?.value !== 'active') {
      url.pathname = '/public/billing';
      return NextResponse.redirect(url);
    }
  }

  if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for JWT in cookies (assume 'token' cookie)

  // Decode JWT and check subscription status
  // Only check subscription status for tenant routes
  if (token && req.nextUrl.pathname.startsWith('/tenant')) {
    // WARNING: jwt.decode does NOT verify signature. Only use for non-sensitive checks in middleware.
    const payload: any = jwt.decode(token.value);
    console.log('[MIDDLEWARE] Decoded JWT for subscription check:', payload);
    if (payload && payload.subscriptionStatus !== 'active') {
      // Allow access to billing, block other app/tenant routes
      if (!req.nextUrl.pathname.startsWith('/billing')) {
        console.log('[MIDDLEWARE] Subscription not active, redirecting to /billing');
        return NextResponse.redirect(new URL('/billing', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
    matcher: ['/tenant/:path*', '/admin/:path*'],
};
