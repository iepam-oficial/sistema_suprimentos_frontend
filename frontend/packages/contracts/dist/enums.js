"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = exports.ServiceType = exports.DepreciationMethod = exports.ChartOfAccountType = exports.EventStatus = exports.EventType = exports.SupportTicketKind = exports.PriorityLevel = exports.TicketStatus = exports.SupplyBatchOrigin = exports.ReceiptLineDestination = exports.DiscrepancySeverity = exports.GoodsReceiptStatus = exports.PurchaseOrderStatus = exports.ProcurementQuoteEventType = exports.ProposalReviewAction = exports.ProposalReviewStatus = exports.QuoteInviteStatus = exports.ProcurementQuoteStatus = exports.PurchaseRequestPriority = exports.PurchaseRequestStatus = exports.DemandSupplyAggregateStatus = exports.DemandSupplyApprovalAction = exports.SupplyMovementType = exports.MovementType = exports.SupplyTransactionType = exports.InventoryStatus = exports.AllocationStatus = exports.SupplyRequestStatus = exports.UserRole = void 0;
exports.UserRole = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    SUPPORT: 'SUPPORT',
    TECHNICIAN: 'TECHNICIAN',
    ORGANIZER: 'ORGANIZER',
    COORDINATOR: 'COORDINATOR',
    DIRECTOR: 'DIRECTOR',
};
exports.SupplyRequestStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
};
exports.AllocationStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    LOST: 'LOST',
};
exports.InventoryStatus = {
    STANDBY: 'STANDBY',
    IN_USE: 'IN_USE',
    MAINTENANCE: 'MAINTENANCE',
    DISCARDED: 'DISCARDED',
    LOST: 'LOST',
};
exports.SupplyTransactionType = {
    DELIVERY: 'DELIVERY',
    RETURN: 'RETURN',
    ADJUSTMENT: 'ADJUSTMENT',
    PURCHASE: 'PURCHASE',
};
exports.MovementType = {
    IN: 'IN',
    OUT: 'OUT',
};
exports.SupplyMovementType = {
    ENTRADA: 'ENTRADA',
    SAIDA: 'SAIDA',
    DEVOLUCAO: 'DEVOLUCAO',
    PERDA: 'PERDA',
};
exports.DemandSupplyApprovalAction = {
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};
/** Status agregado derivado dos itens — não persistido no banco */
exports.DemandSupplyAggregateStatus = {
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    DELIVERED: 'DELIVERED',
    MIXED: 'MIXED',
};
exports.PurchaseRequestStatus = {
    DRAFT: 'DRAFT',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
};
exports.PurchaseRequestPriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
exports.ProcurementQuoteStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    AWAITING_APPROVAL: 'AWAITING_APPROVAL',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
};
exports.QuoteInviteStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED',
    RESPONDED: 'RESPONDED',
    CORRECTION_REQUESTED: 'CORRECTION_REQUESTED',
    EXPIRED: 'EXPIRED',
};
exports.ProposalReviewStatus = {
    PENDING_REVIEW: 'PENDING_REVIEW',
    REVIEW_OK: 'REVIEW_OK',
};
exports.ProposalReviewAction = {
    REVIEW_OK: 'REVIEW_OK',
    CORRECTION_REQUESTED: 'CORRECTION_REQUESTED',
};
exports.ProcurementQuoteEventType = {
    EMAIL_SENT: 'EMAIL_SENT',
    EMAIL_DELIVERED: 'EMAIL_DELIVERED',
    EMAIL_OPENED: 'EMAIL_OPENED',
    PORTAL_ACCESSED: 'PORTAL_ACCESSED',
    PROPOSAL_SUBMITTED: 'PROPOSAL_SUBMITTED',
    INVITE_DECLINED: 'INVITE_DECLINED',
    QUOTE_CLOSED: 'QUOTE_CLOSED',
    QUOTE_APPROVED: 'QUOTE_APPROVED',
};
exports.PurchaseOrderStatus = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED',
    CANCELLED: 'CANCELLED',
};
exports.GoodsReceiptStatus = {
    IN_PROGRESS: 'IN_PROGRESS',
    PHYSICAL_DONE: 'PHYSICAL_DONE',
    DOCUMENTAL_REVIEW: 'DOCUMENTAL_REVIEW',
    PENDING_DIRECTOR: 'PENDING_DIRECTOR',
    APPROVED: 'APPROVED',
    BLOCKED: 'BLOCKED',
    CANCELLED: 'CANCELLED',
};
exports.DiscrepancySeverity = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
};
exports.ReceiptLineDestination = {
    UNCLASSIFIED: 'UNCLASSIFIED',
    SUPPLY: 'SUPPLY',
    INVENTORY: 'INVENTORY',
};
exports.SupplyBatchOrigin = {
    MANUAL: 'MANUAL',
    PROCUREMENT: 'PROCUREMENT',
};
var support_ticket_dto_1 = require("./dto/support-ticket.dto");
Object.defineProperty(exports, "TicketStatus", { enumerable: true, get: function () { return support_ticket_dto_1.TicketStatus; } });
Object.defineProperty(exports, "PriorityLevel", { enumerable: true, get: function () { return support_ticket_dto_1.PriorityLevel; } });
Object.defineProperty(exports, "SupportTicketKind", { enumerable: true, get: function () { return support_ticket_dto_1.SupportTicketKind; } });
var event_dto_1 = require("./dto/event.dto");
Object.defineProperty(exports, "EventType", { enumerable: true, get: function () { return event_dto_1.EventType; } });
Object.defineProperty(exports, "EventStatus", { enumerable: true, get: function () { return event_dto_1.EventStatus; } });
var finance_dto_1 = require("./dto/finance.dto");
Object.defineProperty(exports, "ChartOfAccountType", { enumerable: true, get: function () { return finance_dto_1.ChartOfAccountType; } });
var depreciation_rate_dto_1 = require("./dto/depreciation-rate.dto");
Object.defineProperty(exports, "DepreciationMethod", { enumerable: true, get: function () { return depreciation_rate_dto_1.DepreciationMethod; } });
var operations_dto_1 = require("./dto/operations.dto");
Object.defineProperty(exports, "ServiceType", { enumerable: true, get: function () { return operations_dto_1.ServiceType; } });
Object.defineProperty(exports, "TaskStatus", { enumerable: true, get: function () { return operations_dto_1.TaskStatus; } });
