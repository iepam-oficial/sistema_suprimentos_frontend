import {
  DASHBOARD_FINANCE_PATH,
  DASHBOARD_OPERATIONAL_PATH,
  DASHBOARD_ROLES,
  canAccessDashboard,
  isDashboardPath,
} from '@/utils/dashboardNav'

describe('dashboardNav', () => {
  it('exports operational and finance dashboard paths', () => {
    expect(DASHBOARD_OPERATIONAL_PATH).toBe('/dashboard')
    expect(DASHBOARD_FINANCE_PATH).toBe('/dashboard/financeiro')
  })

  it('allows ADMIN, MANAGER and DIRECTOR via DASHBOARD_ROLES / canAccessDashboard', () => {
    expect(DASHBOARD_ROLES).toEqual(['ADMIN', 'MANAGER', 'DIRECTOR'])
    expect(canAccessDashboard('ADMIN')).toBe(true)
    expect(canAccessDashboard('MANAGER')).toBe(true)
    expect(canAccessDashboard('DIRECTOR')).toBe(true)
  })

  it('denies roles outside DASHBOARD_ROLES', () => {
    expect(canAccessDashboard('EMPLOYEE')).toBe(false)
    expect(canAccessDashboard('COORDINATOR')).toBe(false)
    expect(canAccessDashboard('TECHNICIAN')).toBe(false)
    expect(canAccessDashboard('SUPPORT')).toBe(false)
    expect(canAccessDashboard('')).toBe(false)
  })

  it('detects dashboard paths and rejects non-dashboard paths', () => {
    expect(isDashboardPath('/dashboard')).toBe(true)
    expect(isDashboardPath('/dashboard/financeiro')).toBe(true)
    expect(isDashboardPath('/dashboard/anything')).toBe(true)
    expect(isDashboardPath('/procurement')).toBe(false)
    expect(isDashboardPath('/dashboardfoo')).toBe(false)
    expect(isDashboardPath('/orders')).toBe(false)
  })
})
