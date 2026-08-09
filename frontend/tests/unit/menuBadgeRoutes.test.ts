import {
  isAbsolutePendingRoute,
  type MenuBadgeRouteKey,
} from '@/features/procurement/utils/menuBadgeRoutes';

describe('isAbsolutePendingRoute', () => {
  it('returns true only for aprovacoes-sc and fila-compras', () => {
    expect(isAbsolutePendingRoute('aprovacoes-sc')).toBe(true);
    expect(isAbsolutePendingRoute('fila-compras')).toBe(true);
  });

  it('returns false for diff-mode routes', () => {
    const diffRoutes: MenuBadgeRouteKey[] = ['solicitacoes', 'cotacoes', 'pedidos'];
    for (const key of diffRoutes) {
      expect(isAbsolutePendingRoute(key)).toBe(false);
    }
  });
});
