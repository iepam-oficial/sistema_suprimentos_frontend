export const DASHBOARD_ROLES = ['ADMIN', 'MANAGER', 'DIRECTOR'] as const

export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

export const DASHBOARD_OPERATIONAL_PATH = '/dashboard'
export const DASHBOARD_FINANCE_PATH = '/dashboard/financeiro'

export function canAccessDashboard(role: string): boolean {
  return (DASHBOARD_ROLES as readonly string[]).includes(role)
}

export function isDashboardPath(path: string): boolean {
  return path === '/dashboard' || path.startsWith('/dashboard/')
}
