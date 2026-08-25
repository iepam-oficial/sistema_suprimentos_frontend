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

/** Highest → lowest priority (home / post-login). Locked for multi-role. */
export const ROLE_PRIORITY: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.DIRECTOR,
  UserRole.MANAGER,
  UserRole.COORDINATOR,
  UserRole.TECHNICIAN,
  UserRole.SUPPORT,
  UserRole.ORGANIZER,
  UserRole.EMPLOYEE,
] as const;

const VALID_ROLES = new Set<string>(Object.values(UserRole));

/**
 * Dedupe + validate. Rejects empty arrays and unknown role strings.
 */
export function normalizeRoles(roles: string[]): UserRole[] {
  if (!roles.length) {
    throw new Error('At least one role is required');
  }
  const seen = new Set<UserRole>();
  const result: UserRole[] = [];
  for (const role of roles) {
    if (!VALID_ROLES.has(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    const typed = role as UserRole;
    if (!seen.has(typed)) {
      seen.add(typed);
      result.push(typed);
    }
  }
  return result;
}

/** True if the user has at least one of the allowed roles (union / intersection non-empty). */
export function hasAnyRole(
  userRoles: readonly string[],
  ...allowed: string[]
): boolean {
  if (!userRoles.length || !allowed.length) return false;
  const set = new Set(userRoles);
  return allowed.some((role) => set.has(role));
}

export function isAdmin(userRoles: readonly string[]): boolean {
  return userRoles.includes(UserRole.ADMIN);
}

/**
 * First role on the locked priority scale present in the user's set.
 * Throws if none of the user's roles appear on the scale.
 */
export function getHighestPriorityRole(
  userRoles: readonly string[],
): UserRole {
  for (const role of ROLE_PRIORITY) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  throw new Error('No valid role in priority scale');
}

export function hasEmployeeSelfServiceAccess(
  roles: readonly string[],
): boolean {
  return roles.some((role) =>
    (ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR as readonly string[]).includes(
      role,
    ),
  );
}
