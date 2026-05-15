import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userData = request.cookies.get('@ti-assistant:user')?.value;

  if (!userData) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { role } = JSON.parse(userData);

  if (role !== 'MANAGER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/inventory/:path*',
    '/reports/:path*',
  ],
}; 