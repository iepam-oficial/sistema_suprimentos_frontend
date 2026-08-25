import { UserRole } from './enums';
/** Self-service roles: catalog supply requests, own support tickets, quotes, events. */
export declare const ROLES_EMPLOYEE_SELF_SERVICE: readonly ["EMPLOYEE", "ORGANIZER", "TECHNICIAN"];
/**
 * COORDINATOR inherits all employee self-service access plus procurement SC (solicitações de compra).
 */
export declare const ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR: readonly ["EMPLOYEE", "ORGANIZER", "TECHNICIAN", "COORDINATOR"];
/** Highest → lowest priority (home / post-login). Locked for multi-role. */
export declare const ROLE_PRIORITY: readonly UserRole[];
/**
 * Dedupe + validate. Rejects empty arrays and unknown role strings.
 */
export declare function normalizeRoles(roles: string[]): UserRole[];
/** True if the user has at least one of the allowed roles (union / intersection non-empty). */
export declare function hasAnyRole(userRoles: readonly string[], ...allowed: string[]): boolean;
export declare function isAdmin(userRoles: readonly string[]): boolean;
/**
 * First role on the locked priority scale present in the user's set.
 * Throws if none of the user's roles appear on the scale.
 */
export declare function getHighestPriorityRole(userRoles: readonly string[]): UserRole;
export declare function hasEmployeeSelfServiceAccess(roles: readonly string[]): boolean;
//# sourceMappingURL=roles.d.ts.map