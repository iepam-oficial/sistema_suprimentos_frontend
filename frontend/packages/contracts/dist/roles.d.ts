/** Self-service roles: catalog supply requests, own support tickets, quotes, events. */
export declare const ROLES_EMPLOYEE_SELF_SERVICE: readonly ["EMPLOYEE", "ORGANIZER", "TECHNICIAN"];
/**
 * COORDINATOR inherits all employee self-service access plus procurement SC (solicitações de compra).
 */
export declare const ROLES_EMPLOYEE_SELF_SERVICE_OR_COORDINATOR: readonly ["EMPLOYEE", "ORGANIZER", "TECHNICIAN", "COORDINATOR"];
export declare function hasEmployeeSelfServiceAccess(role: string): boolean;
//# sourceMappingURL=roles.d.ts.map