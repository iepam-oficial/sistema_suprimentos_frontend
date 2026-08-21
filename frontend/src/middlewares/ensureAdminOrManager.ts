import { NextRequest, NextResponse } from 'next/server';
import { hasAnyRole } from '@ti-assistant/contracts/dist/roles';
import { resolveUserRoles } from '@/utils/pageAccess';
import { getPostLoginPath } from '@/utils/postLoginRedirect';

export function middleware(request: NextRequest) {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const roles = resolveUserRoles(user);

    if (!hasAnyRole(roles, 'ADMIN', 'MANAGER')) {
        const home = getPostLoginPath(roles) ?? '/';
        return NextResponse.redirect(new URL(home, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
    ],
};
