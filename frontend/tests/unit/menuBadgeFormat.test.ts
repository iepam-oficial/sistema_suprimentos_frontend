import { formatBadgeCount } from '@/features/procurement/utils/menuBadgeFormat';
import {
  isPathActiveForRoute,
  routeKeyFromPathname,
  routeKeysForRole,
} from '@/features/procurement/utils/menuBadgeRoutes';

describe('formatBadgeCount', () => {
  it('returns empty for zero or negative', () => {
    expect(formatBadgeCount(0)).toBe('');
    expect(formatBadgeCount(-1)).toBe('');
  });

  it('returns exact digit for 1..9', () => {
    expect(formatBadgeCount(1)).toBe('1');
    expect(formatBadgeCount(9)).toBe('9');
  });

  it('returns 9+ above 9', () => {
    expect(formatBadgeCount(10)).toBe('9+');
    expect(formatBadgeCount(99)).toBe('9+');
  });
});

describe('menuBadgeRoutes', () => {
  it('maps roles to route keys', () => {
    expect(routeKeysForRole('COORDINATOR')).toEqual(['solicitacoes']);
    expect(routeKeysForRole('DIRECTOR')).toEqual(['aprovacoes-sc', 'cotacoes']);
    expect(routeKeysForRole('MANAGER')).toEqual(['fila-compras', 'pedidos', 'cotacoes']);
    expect(routeKeysForRole('ADMIN')).toEqual([
      'solicitacoes',
      'aprovacoes-sc',
      'fila-compras',
      'pedidos',
      'cotacoes',
    ]);
  });

  it('resolves pathname to route key including recebimentos → pedidos', () => {
    expect(routeKeyFromPathname('/procurement/fila-compras')).toBe('fila-compras');
    expect(routeKeyFromPathname('/procurement/recebimentos/abc')).toBe('pedidos');
    expect(isPathActiveForRoute('/procurement/cotacoes/1', 'cotacoes')).toBe(true);
  });
});
