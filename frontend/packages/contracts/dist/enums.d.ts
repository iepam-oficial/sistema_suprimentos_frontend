export declare const UserRole: {
    readonly ADMIN: "ADMIN";
    readonly MANAGER: "MANAGER";
    readonly EMPLOYEE: "EMPLOYEE";
    readonly SUPPORT: "SUPPORT";
    readonly TECHNICIAN: "TECHNICIAN";
    readonly ORGANIZER: "ORGANIZER";
    readonly COORDINATOR: "COORDINATOR";
    readonly DIRECTOR: "DIRECTOR";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const SupplyRequestStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly DELIVERED: "DELIVERED";
    readonly CANCELLED: "CANCELLED";
};
export type SupplyRequestStatus = (typeof SupplyRequestStatus)[keyof typeof SupplyRequestStatus];
export declare const AllocationStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly DELIVERED: "DELIVERED";
    readonly RETURNED: "RETURNED";
    readonly LOST: "LOST";
};
export type AllocationStatus = (typeof AllocationStatus)[keyof typeof AllocationStatus];
export declare const InventoryStatus: {
    readonly STANDBY: "STANDBY";
    readonly IN_USE: "IN_USE";
    readonly MAINTENANCE: "MAINTENANCE";
    readonly DISCARDED: "DISCARDED";
    readonly LOST: "LOST";
};
export type InventoryStatus = (typeof InventoryStatus)[keyof typeof InventoryStatus];
export declare const SupplyTransactionType: {
    readonly DELIVERY: "DELIVERY";
    readonly RETURN: "RETURN";
    readonly ADJUSTMENT: "ADJUSTMENT";
    readonly PURCHASE: "PURCHASE";
};
export type SupplyTransactionType = (typeof SupplyTransactionType)[keyof typeof SupplyTransactionType];
export declare const MovementType: {
    readonly IN: "IN";
    readonly OUT: "OUT";
};
export type MovementType = (typeof MovementType)[keyof typeof MovementType];
export declare const SupplyMovementType: {
    readonly ENTRADA: "ENTRADA";
    readonly SAIDA: "SAIDA";
    readonly DEVOLUCAO: "DEVOLUCAO";
    readonly PERDA: "PERDA";
};
export type SupplyMovementType = (typeof SupplyMovementType)[keyof typeof SupplyMovementType];
export declare const DemandSupplyApprovalAction: {
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
};
export type DemandSupplyApprovalAction = (typeof DemandSupplyApprovalAction)[keyof typeof DemandSupplyApprovalAction];
/** Status agregado derivado dos itens — não persistido no banco */
export declare const DemandSupplyAggregateStatus: {
    readonly PENDING: "PENDING";
    readonly PARTIAL: "PARTIAL";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly DELIVERED: "DELIVERED";
    readonly MIXED: "MIXED";
};
export type DemandSupplyAggregateStatus = (typeof DemandSupplyAggregateStatus)[keyof typeof DemandSupplyAggregateStatus];
export declare const PurchaseRequestStatus: {
    readonly DRAFT: "DRAFT";
    readonly PENDING_APPROVAL: "PENDING_APPROVAL";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly CANCELLED: "CANCELLED";
};
export type PurchaseRequestStatus = (typeof PurchaseRequestStatus)[keyof typeof PurchaseRequestStatus];
export declare const PurchaseRequestPriority: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export type PurchaseRequestPriority = (typeof PurchaseRequestPriority)[keyof typeof PurchaseRequestPriority];
export declare const ProcurementQuoteStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly AWAITING_APPROVAL: "AWAITING_APPROVAL";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly CANCELLED: "CANCELLED";
};
export type ProcurementQuoteStatus = (typeof ProcurementQuoteStatus)[keyof typeof ProcurementQuoteStatus];
export declare const QuoteInviteStatus: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly DECLINED: "DECLINED";
    readonly RESPONDED: "RESPONDED";
    readonly CORRECTION_REQUESTED: "CORRECTION_REQUESTED";
    readonly EXPIRED: "EXPIRED";
};
export type QuoteInviteStatus = (typeof QuoteInviteStatus)[keyof typeof QuoteInviteStatus];
export declare const ProposalReviewStatus: {
    readonly PENDING_REVIEW: "PENDING_REVIEW";
    readonly REVIEW_OK: "REVIEW_OK";
};
export type ProposalReviewStatus = (typeof ProposalReviewStatus)[keyof typeof ProposalReviewStatus];
export declare const ProposalReviewAction: {
    readonly REVIEW_OK: "REVIEW_OK";
    readonly CORRECTION_REQUESTED: "CORRECTION_REQUESTED";
};
export type ProposalReviewAction = (typeof ProposalReviewAction)[keyof typeof ProposalReviewAction];
export declare const ProcurementQuoteEventType: {
    readonly EMAIL_SENT: "EMAIL_SENT";
    readonly EMAIL_DELIVERED: "EMAIL_DELIVERED";
    readonly EMAIL_OPENED: "EMAIL_OPENED";
    readonly PORTAL_ACCESSED: "PORTAL_ACCESSED";
    readonly PROPOSAL_SUBMITTED: "PROPOSAL_SUBMITTED";
    readonly INVITE_DECLINED: "INVITE_DECLINED";
    readonly QUOTE_CLOSED: "QUOTE_CLOSED";
    readonly QUOTE_APPROVED: "QUOTE_APPROVED";
};
export type ProcurementQuoteEventType = (typeof ProcurementQuoteEventType)[keyof typeof ProcurementQuoteEventType];
export declare const PurchaseOrderStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly ACCEPTED: "ACCEPTED";
    readonly DECLINED: "DECLINED";
    readonly CANCELLED: "CANCELLED";
};
export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];
export declare const GoodsReceiptStatus: {
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly PHYSICAL_DONE: "PHYSICAL_DONE";
    readonly DOCUMENTAL_REVIEW: "DOCUMENTAL_REVIEW";
    readonly PENDING_DIRECTOR: "PENDING_DIRECTOR";
    readonly APPROVED: "APPROVED";
    readonly BLOCKED: "BLOCKED";
    readonly CANCELLED: "CANCELLED";
};
export type GoodsReceiptStatus = (typeof GoodsReceiptStatus)[keyof typeof GoodsReceiptStatus];
export declare const DiscrepancySeverity: {
    readonly CRITICAL: "CRITICAL";
    readonly HIGH: "HIGH";
    readonly MEDIUM: "MEDIUM";
    readonly LOW: "LOW";
};
export type DiscrepancySeverity = (typeof DiscrepancySeverity)[keyof typeof DiscrepancySeverity];
export declare const ReceiptLineDestination: {
    readonly UNCLASSIFIED: "UNCLASSIFIED";
    readonly SUPPLY: "SUPPLY";
    readonly INVENTORY: "INVENTORY";
};
export type ReceiptLineDestination = (typeof ReceiptLineDestination)[keyof typeof ReceiptLineDestination];
export { TicketStatus, PriorityLevel, SupportTicketKind, } from './dto/support-ticket.dto';
export { EventType, EventStatus } from './dto/event.dto';
export { ChartOfAccountType } from './dto/finance.dto';
export { DepreciationMethod } from './dto/depreciation-rate.dto';
export { ServiceType, TaskStatus } from './dto/operations.dto';
export { QuoteStatus } from './dto/quote.dto';
export type { TicketStatus as TicketStatusType, PriorityLevel as PriorityLevelType, SupportTicketKind as SupportTicketKindType, } from './dto/support-ticket.dto';
export type { EventType as EventTypeEnum, EventStatus as EventStatusEnum, } from './dto/event.dto';
export type { ChartOfAccountType as ChartOfAccountTypeEnum } from './dto/finance.dto';
export type { DepreciationMethod as DepreciationMethodEnum } from './dto/depreciation-rate.dto';
export type { ServiceType as ServiceTypeEnum, TaskStatus as TaskStatusEnum, } from './dto/operations.dto';
export type { QuoteStatus as QuoteStatusEnum } from './dto/quote.dto';
//# sourceMappingURL=enums.d.ts.map