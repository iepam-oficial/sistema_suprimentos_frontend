import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('@ti-assistant:token')?.value

  const { pathname } = request.nextUrl

  // Protect selected app routes
  const protectedPaths = [
    '/dashboard',
    '/orders',
    '/internal-service-orders',
    '/maintenance-schedules',
    '/tasks',
    '/inventory',
    '/supplies',
    '/supply-requests',
    '/procurement',
    '/extra-expenses',
    '/depreciation-rates',
    '/fiscal-codes',
    '/alerts',
    '/events',
    '/reports',
    '/settings',
    '/support-tickets',
  ]
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // If navigating to a protected page without token, redirect to login
  if (isProtected && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // For API requests, add Authorization header if token exists
  if (pathname.startsWith('/api/') && token) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${token}`)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/orders',
    '/orders/:path*',
    '/internal-service-orders',
    '/internal-service-orders/:path*',
    '/maintenance-schedules',
    '/maintenance-schedules/:path*',
    '/tasks',
    '/tasks/:path*',
    '/inventory',
    '/inventory/:path*',
    '/supplies',
    '/supplies/:path*',
    '/supply-requests',
    '/supply-requests/:path*',
    '/procurement',
    '/procurement/:path*',
    '/extra-expenses',
    '/extra-expenses/:path*',
    '/depreciation-rates',
    '/depreciation-rates/:path*',
    '/fiscal-codes',
    '/fiscal-codes/:path*',
    '/alerts',
    '/alerts/:path*',
    '/events',
    '/events/:path*',
    '/reports',
    '/reports/:path*',
    '/settings',
    '/settings/:path*',
    '/support-tickets',
    '/support-tickets/:path*',
  ],
}
