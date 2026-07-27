import {
  countChangedItems,
  fingerprintPurchaseOrder,
  fingerprintPurchaseRequest,
  fingerprintQuote,
  type MenuBadgeSnapshotItem,
} from '@/features/procurement/utils/menuBadgeDiff';

describe('countChangedItems', () => {
  it('returns 0 when baseline and current match', () => {
    const baseline: MenuBadgeSnapshotItem[] = [
      { id: 'a', fingerprint: 'APPROVED|t1' },
      { id: 'b', fingerprint: 'SENT|t1' },
    ];
    expect(countChangedItems(baseline, baseline)).toBe(0);
  });

  it('counts new ids', () => {
    const baseline: MenuBadgeSnapshotItem[] = [{ id: 'a', fingerprint: 'x' }];
    const current: MenuBadgeSnapshotItem[] = [
      { id: 'a', fingerprint: 'x' },
      { id: 'b', fingerprint: 'y' },
      { id: 'c', fingerprint: 'z' },
    ];
    expect(countChangedItems(baseline, current)).toBe(2);
  });

  it('counts altered fingerprints', () => {
    const baseline: MenuBadgeSnapshotItem[] = [
      { id: 'a', fingerprint: 'PENDING|t1' },
      { id: 'b', fingerprint: 'APPROVED|t1' },
    ];
    const current: MenuBadgeSnapshotItem[] = [
      { id: 'a', fingerprint: 'APPROVED|t2' },
      { id: 'b', fingerprint: 'APPROVED|t1' },
    ];
    expect(countChangedItems(baseline, current)).toBe(1);
  });

  it('does not count removals', () => {
    const baseline: MenuBadgeSnapshotItem[] = [
      { id: 'a', fingerprint: 'x' },
      { id: 'b', fingerprint: 'y' },
    ];
    const current: MenuBadgeSnapshotItem[] = [{ id: 'a', fingerprint: 'x' }];
    expect(countChangedItems(baseline, current)).toBe(0);
  });
});

describe('fingerprints', () => {
  it('builds purchase request fingerprint with priority', () => {
    expect(
      fingerprintPurchaseRequest({
        id: '1',
        status: 'APPROVED',
        updated_at: '2026-01-01',
        priority: 'HIGH',
      }),
    ).toEqual({ id: '1', fingerprint: 'APPROVED|2026-01-01|HIGH' });
  });

  it('builds quote and order fingerprints', () => {
    expect(
      fingerprintQuote({ id: 'q', status: 'SENT', updated_at: 't' }),
    ).toEqual({ id: 'q', fingerprint: 'SENT|t' });
    expect(
      fingerprintPurchaseOrder({ id: 'p', status: 'DRAFT', created_at: 't' }),
    ).toEqual({ id: 'p', fingerprint: 'DRAFT|t' });
  });
});
