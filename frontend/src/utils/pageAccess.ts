import { hasAnyRole, isAdmin } from '@ti-assistant/contracts/dist/roles'
import { getPostLoginPath } from '@/utils/postLoginRedirect'

export type PageAccessResult =
  | { allowed: true }
  | { allowed: false; redirectTo: string }

type UserLike = {
  roles?: readonly string[] | null
  role?: string | null
} | null | undefined

/** Prefer `roles[]`; fall back to legacy singular `role`. */
export function resolveUserRoles(user: UserLike): string[] {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return [...user.roles]
  }
  if (user.role) return [user.role]
  return []
}

/**
 * Gate page access: ADMIN bypass total OR union via hasAnyRole.
 * Denied → role home from getPostLoginPath (never `/unauthorized`).
 */
export function assertPageAccess(
  roles: readonly string[],
  allowlist: readonly string[],
): PageAccessResult {
  if (isAdmin(roles) || hasAnyRole(roles, ...allowlist)) {
    return { allowed: true }
  }
  return {
    allowed: false,
    redirectTo: getPostLoginPath(roles) ?? '/',
  }
}
