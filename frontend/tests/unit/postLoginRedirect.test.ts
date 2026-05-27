import {
  getPostLoginPath,
  resolvePostLoginPath,
} from '@/utils/postLoginRedirect'

describe('postLoginRedirect', () => {
  it('maps roles to default paths', () => {
    expect(getPostLoginPath('ADMIN')).toBe('/dashboard')
    expect(getPostLoginPath('MANAGER')).toBe('/dashboard')
    expect(getPostLoginPath('EMPLOYEE')).toBe('/supply-requests')
    expect(getPostLoginPath('TECHNICIAN')).toBe('/supply-requests')
    expect(getPostLoginPath('ORGANIZER')).toBe('/supply-requests')
    expect(getPostLoginPath('SUPPORT')).toBe('/support-tickets')
  })

  it('honors allowed ?from= for role', () => {
    expect(
      resolvePostLoginPath('EMPLOYEE', { from: '/supply-requests/admin' }),
    ).toBe('/supply-requests/admin')
    expect(
      resolvePostLoginPath('EMPLOYEE', { from: '/dashboard' }),
    ).toBe('/supply-requests')
  })

  it('ignores disallowed ?from= paths', () => {
    expect(
      resolvePostLoginPath('SUPPORT', { from: '/dashboard' }),
    ).toBe('/support-tickets')
  })
})
