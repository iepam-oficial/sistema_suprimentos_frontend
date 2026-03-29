import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
    ],
}; 