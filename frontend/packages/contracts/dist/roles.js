"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PRIORITY = exports.ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR = exports.ROLES_EMPLOYEE_SELF_SERVICE = void 0;
exports.normalizeRoles = normalizeRoles;
exports.hasAnyRole = hasAnyRole;
exports.isAdmin = isAdmin;
exports.getHighestPriorityRole = getHighestPriorityRole;
exports.hasEmployeeSelfServiceAccess = hasEmployeeSelfServiceAccess;
const enums_1 = require("./enums");
/** Self-service roles: catalog supply requests, own support tickets, quotes, events. */
exports.ROLES_EMPLOYEE_SELF_SERVICE = [
    enums_1.UserRole.EMPLOYEE,
    enums_1.UserRole.ORGANIZER,
    enums_1.UserRole.TECHNICIAN,
];
/**
 * COORDINATOR inherits all employee self-service access plus procurement SC (solicitações de compra).
 */
exports.ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR = [
    ...exports.ROLES_EMPLOYEE_SELF_SERVICE,
    enums_1.UserRole.COORDINATOR,
];
/** Highest → lowest priority (home / post-login). Locked for multi-role. */
exports.ROLE_PRIORITY = [
    enums_1.UserRole.ADMIN,
    enums_1.UserRole.DIRECTOR,
    enums_1.UserRole.MANAGER,
    enums_1.UserRole.COORDINATOR,
    enums_1.UserRole.TECHNICIAN,
    enums_1.UserRole.SUPPORT,
    enums_1.UserRole.ORGANIZER,
    enums_1.UserRole.EMPLOYEE,
];
const VALID_ROLES = new Set(Object.values(enums_1.UserRole));
/**
 * Dedupe + validate. Rejects empty arrays and unknown role strings.
 */
function normalizeRoles(roles) {
    if (!roles.length) {
        throw new Error('At least one role is required');
    }
    const seen = new Set();
    const result = [];
    for (const role of roles) {
        if (!VALID_ROLES.has(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
        const typed = role;
        if (!seen.has(typed)) {
            seen.add(typed);
            result.push(typed);
        }
    }
    return result;
}
/** True if the user has at least one of the allowed roles (union / intersection non-empty). */
function hasAnyRole(userRoles, ...allowed) {
    if (!userRoles.length || !allowed.length)
        return false;
    const set = new Set(userRoles);
    return allowed.some((role) => set.has(role));
}
function isAdmin(userRoles) {
    return userRoles.includes(enums_1.UserRole.ADMIN);
}
/**
 * First role on the locked priority scale present in the user's set.
 * Throws if none of the user's roles appear on the scale.
 */
function getHighestPriorityRole(userRoles) {
    for (const role of exports.ROLE_PRIORITY) {
        if (userRoles.includes(role)) {
            return role;
        }
    }
    throw new Error('No valid role in priority scale');
}
function hasEmployeeSelfServiceAccess(roles) {
    return roles.some((role) => exports.ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR.includes(role));
}
