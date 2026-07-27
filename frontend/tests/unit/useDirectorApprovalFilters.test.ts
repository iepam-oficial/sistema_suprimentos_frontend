import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  buildDirectorApiFilters,
  DEFAULT_DIRECTOR_DRAWER_FILTERS,
  isDirectorDrawerFilterActive,
} from '@/features/procurement/hooks/useDirectorApprovalFilters';
import { filterDirectorVisiblePurchaseRequests } from '@/features/procurement/utils/directorApprovalFilters';

describe('buildDirectorApiFilters', () => {
  it('defaults to PENDING_APPROVAL on initial drawer state', () => {
    expect(buildDirectorApiFilters(DEFAULT_DIRECTOR_DRAWER_FILTERS)).toEqual({
      status: 'PENDING_APPROVAL',
    });
  });

  it('maps priority and date filters', () => {
    expect(
      buildDirectorApiFilters({
        status: 'APPROVED',
        priority: 'HIGH',
        createdFrom: '2026-01-01',
        createdTo: '2026-01-31',
      }),
    ).toEqual({
      status: 'APPROVED',
      priority: 'HIGH',
      created_from: '2026-01-01',
      created_to: '2026-01-31',
    });
  });
});

describe('isDirectorDrawerFilterActive', () => {
  it('is inactive for default pending status only', () => {
    expect(isDirectorDrawerFilterActive(DEFAULT_DIRECTOR_DRAWER_FILTERS)).toBe(false);
  });

  it('is active when status changes from default', () => {
    expect(
      isDirectorDrawerFilterActive({
        ...DEFAULT_DIRECTOR_DRAWER_FILTERS,
        status: 'APPROVED',
      }),
    ).toBe(true);
  });
});

describe('director listing pipeline', () => {
  const directorId = 'director-1';

  const foreignDraft: PurchaseRequestDTO = {
    id: 'draft-1',
    code: 1,
    display_code: 'SC-0001',
    status: 'DRAFT',
    priority: 'MEDIUM',
    justification: 'Rascunho alheio',
    chart_of_account_id: 'coa-1',
    created_by: { id: 'coord-1', name: 'Coord', email: 'c@t.com', role: 'COORDINATOR' },
    items: [],
    approvals: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  it('excludes foreign drafts from director-visible items', () => {
    expect(filterDirectorVisiblePurchaseRequests([foreignDraft], directorId)).toEqual([]);
  });
});
