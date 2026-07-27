const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/orders',
  '/internal-service-orders',
  '/maintenance-schedules',
  '/tasks',
  '/inventory',
  '/supplies',
  '/supply-requests',
  '/quotes',
  '/procurement',
  '/extra-expenses',
  '/alerts',
  '/events',
  '/reports',
  '/settings',
  '/support-tickets',
] as const

const ROLE_DEFAULT_PATH: Record<string, string> = {
  ADMIN: '/dashboard',
  MANAGER: '/dashboard',
  COORDINATOR: '/procurement/solicitacoes',
  DIRECTOR: '/procurement/aprovacoes-sc',
  EMPLOYEE: '/supply-requests',
  TECHNICIAN: '/supply-requests',
  ORGANIZER: '/supply-requests',
  SUPPORT: '/support-tickets',
}

const EMPLOYEE_SELF_SERVICE_PREFIXES = [
  '/supply-requests',
  '/support-tickets',
  '/quotes',
  '/events',
] as const

/** Paths a role may use as post-login `?from=` target (prefix match). */
const ROLE_ALLOWED_FROM_PREFIXES: Record<string, readonly string[]> = {
  ADMIN: PROTECTED_PATH_PREFIXES,
  MANAGER: PROTECTED_PATH_PREFIXES,
  COORDINATOR: [...EMPLOYEE_SELF_SERVICE_PREFIXES, '/procurement'],
  DIRECTOR: ['/procurement', '/quotes', '/events'],
  EMPLOYEE: EMPLOYEE_SELF_SERVICE_PREFIXES,
  TECHNICIAN: [
    '/supply-requests',
    '/support-tickets',
    '/internal-service-orders',
    '/maintenance-schedules',
    '/quotes',
    '/events',
  ],
  ORGANIZER: EMPLOYEE_SELF_SERVICE_PREFIXES,
  SUPPORT: ['/support-tickets', '/alerts', '/quotes', '/events'],
}

function normalizeFromPath(from: string | null | undefined): string | null {
  if (!from || typeof from !== 'string') return null
  const path = from.startsWith('/') ? from.split('?')[0] : `/${from.split('?')[0]}`
  if (path === '/' || path === '') return null
  const isProtected = PROTECTED_PATH_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  )
  return isProtected ? path : null
}

function isFromAllowedForRole(path: string, role: string): boolean {
  const allowed = ROLE_ALLOWED_FROM_PREFIXES[role]
  if (!allowed) return false
  return allowed.some((p) => path === p || path.startsWith(`${p}/`))
}

export function getPostLoginPath(role: string): string | null {
  return ROLE_DEFAULT_PATH[role] ?? null
}

export function resolvePostLoginPath(
  role: string,
  options?: { from?: string | null },
): string | null {
  const fromPath = normalizeFromPath(options?.from)
  if (fromPath && isFromAllowedForRole(fromPath, role)) {
    return fromPath
  }
  return getPostLoginPath(role)
}

export function getFromSearchParam(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('from')
}

/** Full page navigation so httpOnly cookies are sent on the next request. */
export function redirectAfterLogin(
  role: string,
  options?: { from?: string | null },
): void {
  const path = resolvePostLoginPath(role, options)
  if (!path) return
  window.location.assign(path)
}
