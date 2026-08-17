import {
  getPostLoginPath,
  resolvePostLoginPath,
} from '@/utils/postLoginRedirect'

describe('postLoginRedirect', () => {
  it('maps roles to default paths', () => {
    expect(getPostLoginPath('ADMIN')).toBe('/dashboard')
    expect(getPostLoginPath('MANAGER')).toBe('/dashboard')
    expect(getPostLoginPath('COORDINATOR')).toBe('/procurement/solicitacoes')
    expect(getPostLoginPath('DIRECTOR')).toBe('/dashboard/financeiro')
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
    expect(
      resolvePostLoginPath('COORDINATOR', { from: '/procurement/solicitacoes/abc' }),
    ).toBe('/procurement/solicitacoes/abc')
    expect(
      resolvePostLoginPath('COORDINATOR', { from: '/supply-requests' }),
    ).toBe('/supply-requests')
    expect(
      resolvePostLoginPath('COORDINATOR', { from: '/support-tickets/abc' }),
    ).toBe('/support-tickets/abc')
    expect(
      resolvePostLoginPath('DIRECTOR', { from: '/procurement/solicitacoes/abc' }),
    ).toBe('/procurement/solicitacoes/abc')
  })

  it('ignores Dashboard ?from= and uses role default', () => {
    expect(
      resolvePostLoginPath('ADMIN', { from: '/dashboard/financeiro' }),
    ).toBe('/dashboard')
    expect(
      resolvePostLoginPath('MANAGER', { from: '/dashboard/financeiro' }),
    ).toBe('/dashboard')
    expect(
      resolvePostLoginPath('DIRECTOR', { from: '/dashboard' }),
    ).toBe('/dashboard/financeiro')
    expect(
      resolvePostLoginPath('DIRECTOR', { from: '/dashboard/financeiro' }),
    ).toBe('/dashboard/financeiro')
  })

  it('ignores disallowed ?from= paths', () => {
    expect(
      resolvePostLoginPath('SUPPORT', { from: '/dashboard' }),
    ).toBe('/support-tickets')
  })

  it('does not honor ?from=/quotes; falls back to role default', () => {
    expect(resolvePostLoginPath('ADMIN', { from: '/quotes' })).toBe('/dashboard')
    expect(resolvePostLoginPath('DIRECTOR', { from: '/quotes' })).toBe(
      '/dashboard/financeiro',
    )
    expect(resolvePostLoginPath('COORDINATOR', { from: '/quotes' })).toBe(
      '/procurement/solicitacoes',
    )
    expect(resolvePostLoginPath('EMPLOYEE', { from: '/quotes' })).toBe(
      '/supply-requests',
    )
    expect(resolvePostLoginPath('TECHNICIAN', { from: '/quotes' })).toBe(
      '/supply-requests',
    )
    expect(resolvePostLoginPath('SUPPORT', { from: '/quotes' })).toBe(
      '/support-tickets',
    )
  })
})
