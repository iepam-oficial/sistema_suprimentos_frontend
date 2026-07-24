import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import { filterDirectorVisiblePurchaseRequests } from '@/features/procurement/utils/directorApprovalFilters';

function makeItem(
  overrides: Partial<PurchaseRequestDTO> & Pick<PurchaseRequestDTO, 'id' | 'status'>,
): PurchaseRequestDTO {
  return {
    code: 1,
    display_code: 'SC-0001',
    priority: 'MEDIUM',
    justification: 'Test',
    chart_of_account_id: 'coa-1',
    created_by: {
      id: 'coord-1',
      name: 'Coordenador',
      email: 'c@test.com',
      role: 'COORDINATOR',
    },
    items: [],
    approvals: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('filterDirectorVisiblePurchaseRequests', () => {
  const directorId = 'director-1';

  it('hides DRAFT created by another user', () => {
    const items = [
      makeItem({ id: '1', status: 'DRAFT', created_by: { id: 'coord-1', name: 'A', email: 'a@t.com', role: 'COORDINATOR' } }),
    ];

    expect(filterDirectorVisiblePurchaseRequests(items, directorId)).toEqual([]);
  });

  it('keeps own DRAFT if it exists', () => {
    const items = [
      makeItem({
        id: '2',
        status: 'DRAFT',
        created_by: { id: directorId, name: 'Dir', email: 'd@t.com', role: 'DIRECTOR' },
      }),
    ];

    expect(filterDirectorVisiblePurchaseRequests(items, directorId)).toHaveLength(1);
  });

  it('keeps PENDING_APPROVAL from any user', () => {
    const items = [
      makeItem({ id: '3', status: 'PENDING_APPROVAL' }),
    ];

    expect(filterDirectorVisiblePurchaseRequests(items, directorId)).toHaveLength(1);
  });

  it('keeps APPROVED and REJECTED from any user', () => {
    const items = [
      makeItem({ id: '4', status: 'APPROVED' }),
      makeItem({ id: '5', status: 'REJECTED' }),
    ];

    expect(filterDirectorVisiblePurchaseRequests(items, directorId)).toHaveLength(2);
  });
});
