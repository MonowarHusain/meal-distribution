import { NextResponse } from 'next/server';

export default function proxy(request) {
  const { pathname } = request.nextUrl;
  
  const protectedRoutes = ['/admin', '/kitchen', '/delivery', '/customer'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const roleCookie = request.cookies.get('role');
    
    if (!roleCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const role = roleCookie.value.toLowerCase();
    
    // Role-based access control
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/kitchen') && role !== 'kitchen') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/delivery') && role !== 'delivery') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/customer') && role !== 'customer') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Auto-redirect logged-in users away from the login page
  if (pathname === '/') {
    const roleCookie = request.cookies.get('role');
    if (roleCookie) {
      const role = roleCookie.value.toLowerCase();
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
      if (role === 'kitchen') return NextResponse.redirect(new URL('/kitchen', request.url));
      if (role === 'delivery') return NextResponse.redirect(new URL('/delivery', request.url));
      if (role === 'customer') return NextResponse.redirect(new URL('/customer', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/kitchen/:path*', '/delivery/:path*', '/customer/:path*'],
};
