import {
  displayCount,
  resolvePollCount,
} from '@/features/procurement/utils/menuBadgeCount';
import type { MenuBadgeSnapshotItem } from '@/features/procurement/utils/menuBadgeDiff';

describe('resolvePollCount', () => {
  it('absolute: uses total when provided', () => {
    expect(
      resolvePollCount({
        routeKey: 'aprovacoes-sc',
        total: 5,
        itemsLength: 2,
        baseline: null,
        currentItems: [],
      }),
    ).toBe(5);
  });

  it('absolute: falls back to itemsLength when total missing', () => {
    expect(
      resolvePollCount({
        routeKey: 'fila-compras',
        total: null,
        itemsLength: 4,
        baseline: null,
        currentItems: [],
      }),
    ).toBe(4);
  });

  it('absolute: first poll without baseline uses total (not forced 0)', () => {
    expect(
      resolvePollCount({
        routeKey: 'aprovacoes-sc',
        total: 3,
        itemsLength: 3,
        baseline: null,
        currentItems: [{ id: 'a', fingerprint: 'x' }],
      }),
    ).toBe(3);
  });

  it('diff: baseline null returns 0 (seed path)', () => {
    expect(
      resolvePollCount({
        routeKey: 'cotacoes',
        total: 10,
        itemsLength: 10,
        baseline: null,
        currentItems: [{ id: 'a', fingerprint: 'x' }],
      }),
    ).toBe(0);
  });

  it('diff: counts new and altered vs baseline', () => {
    const baseline: MenuBadgeSnapshotItem[] = [{ id: 'a', fingerprint: 'old' }];
    const current: MenuBadgeSnapshotItem[] = [
      { id: 'a', fingerprint: 'new' },
      { id: 'b', fingerprint: 'x' },
    ];
    expect(
      resolvePollCount({
        routeKey: 'pedidos',
        total: 2,
        itemsLength: 2,
        baseline,
        currentItems: current,
      }),
    ).toBe(2);
  });
});

describe('displayCount', () => {
  it('returns 0 when route active and not aggregate', () => {
    expect(displayCount({ raw: 3, routeActive: true, aggregate: false })).toBe(0);
  });

  it('returns raw when route active and aggregate', () => {
    expect(displayCount({ raw: 3, routeActive: true, aggregate: true })).toBe(3);
  });

  it('returns raw when route not active', () => {
    expect(displayCount({ raw: 7, routeActive: false })).toBe(7);
  });
});
