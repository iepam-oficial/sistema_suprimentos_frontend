import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import { matchesPurchaseRequestSearch } from '@/features/procurement/hooks/usePurchaseRequestFilters';

const baseItem = {
  id: '1',
  code: 1,
  display_code: 'SC-0001',
  status: 'DRAFT',
  priority: 'MEDIUM',
  justification: 'Reposição de material',
  chart_of_account_id: 'coa-1',
  created_by: { id: 'u1', name: 'Ana', email: 'a@test.com', role: 'COORDINATOR' },
  items: [{ id: 'i1', description: 'Parafuso', quantity: 10, sort_order: 0 }],
  approvals: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
} satisfies PurchaseRequestDTO;

describe('matchesPurchaseRequestSearch', () => {
  it('returns all items when search is empty', () => {
    expect(matchesPurchaseRequestSearch(baseItem, '')).toBe(true);
    expect(matchesPurchaseRequestSearch(baseItem, '   ')).toBe(true);
  });

  it('matches display code, justification and item description', () => {
    expect(matchesPurchaseRequestSearch(baseItem, 'sc-0001')).toBe(true);
    expect(matchesPurchaseRequestSearch(baseItem, 'reposição')).toBe(true);
    expect(matchesPurchaseRequestSearch(baseItem, 'parafuso')).toBe(true);
    expect(matchesPurchaseRequestSearch(baseItem, 'inexistente')).toBe(false);
  });
});
