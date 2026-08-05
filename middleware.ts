import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const studentRoutes = ['/dashboard', '/courses', '/catalog'];
const adminRoutes = ['/admin'];

const isDevAdminBypassEnabled = process.env.DEV_ADMIN_BYPASS === 'true';

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function middleware(request: NextRequest) {
  if (isDevAdminBypassEnabled) {
    const pathname = request.nextUrl.pathname;
    if (matchesRoute(pathname, adminRoutes) || matchesRoute(pathname, studentRoutes)) {
      return NextResponse.next();
    }

    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  const { response, userId, role } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if ((matchesRoute(pathname, studentRoutes) || matchesRoute(pathname, adminRoutes)) && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (matchesRoute(pathname, adminRoutes) && role === 'student') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (matchesRoute(pathname, studentRoutes) && role === 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && userId && role) {
    const url = request.nextUrl.clone();
    url.pathname = role === 'admin' ? '/admin' : '/catalog';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/courses/:path*', '/catalog/:path*', '/admin/:path*']
};