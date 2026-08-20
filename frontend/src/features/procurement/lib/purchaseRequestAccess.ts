import type { PurchaseRequestDTO, PurchaseRequestStatus, UserRole } from '@ti-assistant/contracts';

export const SC_PAGE_ROLES: UserRole[] = ['COORDINATOR', 'MANAGER', 'ADMIN'];

type AccessUser = { id: string; role: string };
type AccessDto = Pick<PurchaseRequestDTO, 'created_by'>;

export function canMutatePurchaseRequest(user: AccessUser, dto: AccessDto): boolean {
  return user.id === dto.created_by.id || user.role === 'ADMIN';
}

export function isWizardEditableStatus(status: PurchaseRequestStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

export function canSetPriorityInWizard(role: UserRole | string): boolean {
  return role === 'MANAGER' || role === 'ADMIN';
}

export function creatorLocksQueuePriority(dto: AccessDto): boolean {
  const role = dto.created_by.role;
  return role === 'MANAGER' || role === 'ADMIN';
}
