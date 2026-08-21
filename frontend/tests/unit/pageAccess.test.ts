import {
  assertPageAccess,
  resolveUserRoles,
} from '@/utils/pageAccess'

describe('pageAccess', () => {
  describe('assertPageAccess', () => {
    it('allows when user has any allowlist role', () => {
      expect(assertPageAccess(['EMPLOYEE', 'DIRECTOR'], ['MANAGER', 'DIRECTOR'])).toEqual({
        allowed: true,
      })
      expect(assertPageAccess(['ADMIN'], ['ADMIN', 'MANAGER'])).toEqual({
        allowed: true,
      })
    })

    it('allows ADMIN even when ADMIN is not on the allowlist (bypass)', () => {
      expect(assertPageAccess(['ADMIN'], ['MANAGER', 'DIRECTOR'])).toEqual({
        allowed: true,
      })
      expect(assertPageAccess(['EMPLOYEE', 'ADMIN'], ['COORDINATOR'])).toEqual({
        allowed: true,
      })
    })

    it('denies and redirects to role home (not /unauthorized)', () => {
      const denied = assertPageAccess(['EMPLOYEE'], ['ADMIN', 'MANAGER'])
      expect(denied).toEqual({
        allowed: false,
        redirectTo: '/supply-requests',
      })
      expect(denied).not.toMatchObject({ redirectTo: '/unauthorized' })

      expect(assertPageAccess(['SUPPORT'], ['ADMIN', 'MANAGER'])).toEqual({
        allowed: false,
        redirectTo: '/support-tickets',
      })

      expect(assertPageAccess(['DIRECTOR'], ['ADMIN', 'MANAGER'])).toEqual({
        allowed: false,
        redirectTo: '/dashboard/financeiro',
      })
    })

    it('uses highest-priority home for multi-role denial', () => {
      expect(
        assertPageAccess(['EMPLOYEE', 'DIRECTOR'], ['ADMIN', 'MANAGER']),
      ).toEqual({
        allowed: false,
        redirectTo: '/dashboard/financeiro',
      })
    })

    it('falls back to / when roles are empty', () => {
      expect(assertPageAccess([], ['ADMIN'])).toEqual({
        allowed: false,
        redirectTo: '/',
      })
    })
  })

  describe('resolveUserRoles', () => {
    it('prefers roles array over legacy singular role', () => {
      expect(
        resolveUserRoles({ roles: ['EMPLOYEE', 'DIRECTOR'], role: 'ADMIN' }),
      ).toEqual(['EMPLOYEE', 'DIRECTOR'])
    })

    it('migrates legacy singular role', () => {
      expect(resolveUserRoles({ role: 'MANAGER' })).toEqual(['MANAGER'])
    })

    it('returns empty for missing user/roles', () => {
      expect(resolveUserRoles(null)).toEqual([])
      expect(resolveUserRoles({})).toEqual([])
      expect(resolveUserRoles({ roles: [] })).toEqual([])
    })
  })
})
