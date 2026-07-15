import { UserRole } from './enums';

/** Self-service roles: catalog supply requests, own support tickets, quotes, events. */
export const ROLES_EMPLOYEE_SELF_SERVICE = [
  UserRole.EMPLOYEE,
  UserRole.ORGANIZER,
  UserRole.TECHNICIAN,
] as const;

/**
 * COORDINATOR inherits all employee self-service access plus procurement SC (solicitações de compra).
 */
export const ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR = [
  ...ROLES_EMPLOYEE_SELF_SERVICE,
  UserRole.COORDINATOR,
] as const;

export function hasEmployeeSelfServiceAccess(role: string): boolean {
  return (ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR as readonly string[]).includes(
    role,
  );
}
