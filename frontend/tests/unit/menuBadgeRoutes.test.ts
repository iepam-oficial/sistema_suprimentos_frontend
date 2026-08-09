import {
  isAbsolutePendingRoute,
  shouldClearCountOnMarkSeen,
  badgeRouteAfterAction,
  stableBadgeListFilters,
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

describe('shouldClearCountOnMarkSeen', () => {
  it('does not clear count for absolute pending routes (visit must not consume)', () => {
    expect(shouldClearCountOnMarkSeen('aprovacoes-sc')).toBe(false);
    expect(shouldClearCountOnMarkSeen('fila-compras')).toBe(false);
  });

  it('clears count for diff routes on visit', () => {
    expect(shouldClearCountOnMarkSeen('cotacoes')).toBe(true);
    expect(shouldClearCountOnMarkSeen('pedidos')).toBe(true);
    expect(shouldClearCountOnMarkSeen('solicitacoes')).toBe(true);
  });
});

describe('badgeRouteAfterAction', () => {
  it('maps approve/reject SC to aprovacoes-sc', () => {
    expect(badgeRouteAfterAction('approve_sc')).toBe('aprovacoes-sc');
    expect(badgeRouteAfterAction('reject_sc')).toBe('aprovacoes-sc');
  });

  it('maps create quote to fila-compras', () => {
    expect(badgeRouteAfterAction('create_quote')).toBe('fila-compras');
  });
});

describe('stableBadgeListFilters', () => {
  it('uses PENDING_APPROVAL for aprovacoes-sc (not page UI filters)', () => {
    expect(stableBadgeListFilters('aprovacoes-sc')).toEqual({ status: 'PENDING_APPROVAL' });
  });

  it('uses awaiting_quote for fila-compras', () => {
    expect(stableBadgeListFilters('fila-compras')).toEqual({ awaiting_quote: true });
  });
});
