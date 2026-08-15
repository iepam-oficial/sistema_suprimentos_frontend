import type { PurchaseRequestDTO, PurchaseRequestPriority } from '@ti-assistant/contracts';
import { sortPurchaseRequestQueue } from '@/features/procurement/lib/sortPurchaseRequestQueue';

function makeRequest(
  overrides: Partial<PurchaseRequestDTO> &
    Pick<PurchaseRequestDTO, 'id' | 'priority' | 'created_at'> & {
      items?: PurchaseRequestDTO['items'];
    },
): PurchaseRequestDTO {
  return {
    code: 1,
    display_code: 'SC-0001',
    status: 'APPROVED',
    justification: 'Repos',
    destination: 'Almoxarifado',
    delivery_deadline: '2026-09-01T00:00:00.000Z',
    created_by: { id: 'u1', name: 'Ana', email: 'a@test.com', role: 'COORDINATOR' },
    items: [{ id: 'i1', description: 'Item', quantity: 1, sort_order: 0, abc_classification: null }],
    approvals: [],
    updated_at: overrides.created_at,
    ...overrides,
  };
}

describe('sortPurchaseRequestQueue', () => {
  it('orders by priority descending (URGENT before LOW)', () => {
    const low = makeRequest({
      id: 'low',
      priority: 'LOW',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    const urgent = makeRequest({
      id: 'urgent',
      priority: 'URGENT',
      created_at: '2026-01-02T00:00:00.000Z',
    });

    const sorted = sortPurchaseRequestQueue([low, urgent]);

    expect(sorted.map((r) => r.id)).toEqual(['urgent', 'low']);
  });

  it('at same priority, SC with any Class A item comes before those without', () => {
    const withoutA = makeRequest({
      id: 'no-a',
      priority: 'HIGH',
      created_at: '2026-01-01T00:00:00.000Z',
      items: [
        { id: 'i1', description: 'B', quantity: 1, sort_order: 0, abc_classification: 'B' },
        { id: 'i2', description: 'C', quantity: 1, sort_order: 1, abc_classification: 'C' },
      ],
    });
    const withA = makeRequest({
      id: 'has-a',
      priority: 'HIGH',
      created_at: '2026-01-02T00:00:00.000Z',
      items: [
        { id: 'i1', description: 'B', quantity: 1, sort_order: 0, abc_classification: 'B' },
        { id: 'i2', description: 'A', quantity: 1, sort_order: 1, abc_classification: 'A' },
      ],
    });

    const sorted = sortPurchaseRequestQueue([withoutA, withA]);

    expect(sorted.map((r) => r.id)).toEqual(['has-a', 'no-a']);
  });

  it('at same priority and Class A tie, orders by created_at ascending', () => {
    const older = makeRequest({
      id: 'older',
      priority: 'MEDIUM',
      created_at: '2026-01-01T00:00:00.000Z',
      items: [{ id: 'i1', description: 'A', quantity: 1, sort_order: 0, abc_classification: 'A' }],
    });
    const newer = makeRequest({
      id: 'newer',
      priority: 'MEDIUM',
      created_at: '2026-01-03T00:00:00.000Z',
      items: [{ id: 'i1', description: 'A', quantity: 1, sort_order: 0, abc_classification: 'A' }],
    });

    const sorted = sortPurchaseRequestQueue([newer, older]);

    expect(sorted.map((r) => r.id)).toEqual(['older', 'newer']);
  });

  it('does not treat B/C/null as Class A for the tie-break', () => {
    const nullAbc = makeRequest({
      id: 'null-abc',
      priority: 'MEDIUM' as PurchaseRequestPriority,
      created_at: '2026-01-01T00:00:00.000Z',
      items: [{ id: 'i1', description: 'X', quantity: 1, sort_order: 0, abc_classification: null }],
    });
    const classB = makeRequest({
      id: 'class-b',
      priority: 'MEDIUM',
      created_at: '2026-01-02T00:00:00.000Z',
      items: [{ id: 'i1', description: 'X', quantity: 1, sort_order: 0, abc_classification: 'B' }],
    });
    const classA = makeRequest({
      id: 'class-a',
      priority: 'MEDIUM',
      created_at: '2026-01-03T00:00:00.000Z',
      items: [{ id: 'i1', description: 'X', quantity: 1, sort_order: 0, abc_classification: 'A' }],
    });

    const sorted = sortPurchaseRequestQueue([nullAbc, classB, classA]);

    expect(sorted.map((r) => r.id)).toEqual(['class-a', 'null-abc', 'class-b']);
  });

  it('priority still beats Class A tie-break', () => {
    const lowWithA = makeRequest({
      id: 'low-a',
      priority: 'LOW',
      created_at: '2026-01-01T00:00:00.000Z',
      items: [{ id: 'i1', description: 'A', quantity: 1, sort_order: 0, abc_classification: 'A' }],
    });
    const highWithoutA = makeRequest({
      id: 'high-no-a',
      priority: 'HIGH',
      created_at: '2026-01-02T00:00:00.000Z',
      items: [{ id: 'i1', description: 'B', quantity: 1, sort_order: 0, abc_classification: 'B' }],
    });

    const sorted = sortPurchaseRequestQueue([lowWithA, highWithoutA]);

    expect(sorted.map((r) => r.id)).toEqual(['high-no-a', 'low-a']);
  });

  it('does not mutate the input array', () => {
    const a = makeRequest({
      id: 'a',
      priority: 'LOW',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    const b = makeRequest({
      id: 'b',
      priority: 'URGENT',
      created_at: '2026-01-02T00:00:00.000Z',
    });
    const input = [a, b];

    const sorted = sortPurchaseRequestQueue(input);

    expect(input.map((r) => r.id)).toEqual(['a', 'b']);
    expect(sorted.map((r) => r.id)).toEqual(['b', 'a']);
    expect(sorted).not.toBe(input);
  });
});
