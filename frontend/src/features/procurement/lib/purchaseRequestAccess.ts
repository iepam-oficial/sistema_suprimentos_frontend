import type { PurchaseRequestDTO, PurchaseRequestStatus, UserRole } from '@ti-assistant/contracts';
import { hasAnyRole, isAdmin } from '@ti-assistant/contracts/dist/roles';
import { resolveUserRoles } from '@/utils/pageAccess';

export const SC_PAGE_ROLES: UserRole[] = ['COORDINATOR', 'MANAGER', 'ADMIN'];

type AccessUser = { id: string; roles: readonly string[] };
type AccessDto = Pick<PurchaseRequestDTO, 'created_by'>;

export function canMutatePurchaseRequest(user: AccessUser, dto: AccessDto): boolean {
  return user.id === dto.created_by.id || isAdmin(user.roles);
}

export function isWizardEditableStatus(status: PurchaseRequestStatus): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

export function canSetPriorityInWizard(roles: readonly string[]): boolean {
  return hasAnyRole(roles, 'MANAGER', 'ADMIN');
}

export function creatorLocksQueuePriority(dto: AccessDto): boolean {
  return hasAnyRole(resolveUserRoles(dto.created_by), 'MANAGER', 'ADMIN');
}
