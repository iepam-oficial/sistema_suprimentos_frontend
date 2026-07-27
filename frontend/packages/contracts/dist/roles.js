"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR = exports.ROLES_EMPLOYEE_SELF_SERVICE = void 0;
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
function hasEmployeeSelfServiceAccess(role) {
    return exports.ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR.includes(role);
}
