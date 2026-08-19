import type { PurchaseRequestDTO, UserRole } from '@ti-assistant/contracts';
import {
  SC_PAGE_ROLES,
  canMutatePurchaseRequest,
  canSetPriorityInWizard,
  creatorLocksQueuePriority,
  isWizardEditableStatus,
} from '@/features/procurement/lib/purchaseRequestAccess';

function makeDto(
  createdBy: PurchaseRequestDTO['created_by'],
): Pick<PurchaseRequestDTO, 'created_by'> {
  return { created_by: createdBy };
}

describe('SC_PAGE_ROLES', () => {
  it('lists COORDINATOR, MANAGER and ADMIN', () => {
    expect(SC_PAGE_ROLES).toEqual(['COORDINATOR', 'MANAGER', 'ADMIN']);
  });
});

describe('canMutatePurchaseRequest', () => {
  const dto = makeDto({ id: 'creator-1', name: 'Ana', email: 'a@test.com', role: 'COORDINATOR' });

  it('returns true when the user is the creator', () => {
    expect(canMutatePurchaseRequest({ id: 'creator-1', role: 'EMPLOYEE' }, dto)).toBe(true);
  });

  it('returns true when the user is ADMIN even if not the creator', () => {
    expect(canMutatePurchaseRequest({ id: 'admin-9', role: 'ADMIN' }, dto)).toBe(true);
  });

  it('returns false when the user is neither the creator nor ADMIN', () => {
    expect(canMutatePurchaseRequest({ id: 'other', role: 'MANAGER' }, dto)).toBe(false);
    expect(canMutatePurchaseRequest({ id: 'other', role: 'COORDINATOR' }, dto)).toBe(false);
  });
});

describe('isWizardEditableStatus', () => {
  it('returns true for DRAFT and REJECTED', () => {
    expect(isWizardEditableStatus('DRAFT')).toBe(true);
    expect(isWizardEditableStatus('REJECTED')).toBe(true);
  });

  it('returns false for other purchase-request statuses', () => {
    expect(isWizardEditableStatus('PENDING_APPROVAL')).toBe(false);
    expect(isWizardEditableStatus('APPROVED')).toBe(false);
    expect(isWizardEditableStatus('CANCELLED')).toBe(false);
  });
});

describe('canSetPriorityInWizard', () => {
  it('returns true for MANAGER and ADMIN', () => {
    const allowed: UserRole[] = ['MANAGER', 'ADMIN'];
    for (const role of allowed) {
      expect(canSetPriorityInWizard(role)).toBe(true);
    }
  });

  it('returns false for other roles', () => {
    expect(canSetPriorityInWizard('COORDINATOR')).toBe(false);
    expect(canSetPriorityInWizard('EMPLOYEE')).toBe(false);
    expect(canSetPriorityInWizard('DIRECTOR')).toBe(false);
  });
});

describe('creatorLocksQueuePriority', () => {
  it('returns true when created_by.role is MANAGER or ADMIN', () => {
    expect(
      creatorLocksQueuePriority(
        makeDto({ id: 'm1', name: 'Mgr', email: 'm@test.com', role: 'MANAGER' }),
      ),
    ).toBe(true);
    expect(
      creatorLocksQueuePriority(
        makeDto({ id: 'a1', name: 'Adm', email: 'a@test.com', role: 'ADMIN' }),
      ),
    ).toBe(true);
  });

  it('returns false when created_by.role is missing or not MANAGER/ADMIN', () => {
    expect(creatorLocksQueuePriority(makeDto({ id: 'u1', name: 'Ana', email: 'a@test.com' }))).toBe(
      false,
    );
    expect(
      creatorLocksQueuePriority(
        makeDto({ id: 'c1', name: 'Coord', email: 'c@test.com', role: 'COORDINATOR' }),
      ),
    ).toBe(false);
  });
});
