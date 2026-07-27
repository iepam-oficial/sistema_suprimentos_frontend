export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  SUPPORT: 'SUPPORT',
  TECHNICIAN: 'TECHNICIAN',
  ORGANIZER: 'ORGANIZER',
  COORDINATOR: 'COORDINATOR',
  DIRECTOR: 'DIRECTOR',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const SupplyRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type SupplyRequestStatus =
  (typeof SupplyRequestStatus)[keyof typeof SupplyRequestStatus];

export const AllocationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  LOST: 'LOST',
} as const;

export type AllocationStatus =
  (typeof AllocationStatus)[keyof typeof AllocationStatus];

export const InventoryStatus = {
  STANDBY: 'STANDBY',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  DISCARDED: 'DISCARDED',
  LOST: 'LOST',
} as const;

export type InventoryStatus =
  (typeof InventoryStatus)[keyof typeof InventoryStatus];

export const SupplyTransactionType = {
  DELIVERY: 'DELIVERY',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
  PURCHASE: 'PURCHASE',
} as const;

export type SupplyTransactionType =
  (typeof SupplyTransactionType)[keyof typeof SupplyTransactionType];

export const MovementType = {
  IN: 'IN',
  OUT: 'OUT',
} as const;

export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export const SupplyMovementType = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
  DEVOLUCAO: 'DEVOLUCAO',
  PERDA: 'PERDA',
} as const;

export type SupplyMovementType =
  (typeof SupplyMovementType)[keyof typeof SupplyMovementType];

export const DemandSupplyApprovalAction = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type DemandSupplyApprovalAction =
  (typeof DemandSupplyApprovalAction)[keyof typeof DemandSupplyApprovalAction];

/** Status agregado derivado dos itens — não persistido no banco */
export const DemandSupplyAggregateStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELIVERED: 'DELIVERED',
  MIXED: 'MIXED',
} as const;

export type DemandSupplyAggregateStatus =
  (typeof DemandSupplyAggregateStatus)[keyof typeof DemandSupplyAggregateStatus];

export const PurchaseRequestStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type PurchaseRequestStatus =
  (typeof PurchaseRequestStatus)[keyof typeof PurchaseRequestStatus];

export const PurchaseRequestPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type PurchaseRequestPriority =
  (typeof PurchaseRequestPriority)[keyof typeof PurchaseRequestPriority];

export const ProcurementQuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProcurementQuoteStatus =
  (typeof ProcurementQuoteStatus)[keyof typeof ProcurementQuoteStatus];

export const QuoteInviteStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  RESPONDED: 'RESPONDED',
  CORRECTION_REQUESTED: 'CORRECTION_REQUESTED',
  EXPIRED: 'EXPIRED',
} as const;

export type QuoteInviteStatus =
  (typeof QuoteInviteStatus)[keyof typeof QuoteInviteStatus];

export const ProposalReviewStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEW_OK: 'REVIEW_OK',
} as const;

export type ProposalReviewStatus =
  (typeof ProposalReviewStatus)[keyof typeof ProposalReviewStatus];

export const ProposalReviewAction = {
  REVIEW_OK: 'REVIEW_OK',
  CORRECTION_REQUESTED: 'CORRECTION_REQUESTED',
} as const;

export type ProposalReviewAction =
  (typeof ProposalReviewAction)[keyof typeof ProposalReviewAction];

export const ProcurementQuoteEventType = {
  EMAIL_SENT: 'EMAIL_SENT',
  EMAIL_DELIVERED: 'EMAIL_DELIVERED',
  EMAIL_OPENED: 'EMAIL_OPENED',
  PORTAL_ACCESSED: 'PORTAL_ACCESSED',
  PROPOSAL_SUBMITTED: 'PROPOSAL_SUBMITTED',
  INVITE_DECLINED: 'INVITE_DECLINED',
  QUOTE_CLOSED: 'QUOTE_CLOSED',
  QUOTE_APPROVED: 'QUOTE_APPROVED',
} as const;

export type ProcurementQuoteEventType =
  (typeof ProcurementQuoteEventType)[keyof typeof ProcurementQuoteEventType];

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const GoodsReceiptStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  PHYSICAL_DONE: 'PHYSICAL_DONE',
  DOCUMENTAL_REVIEW: 'DOCUMENTAL_REVIEW',
  PENDING_DIRECTOR: 'PENDING_DIRECTOR',
  APPROVED: 'APPROVED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
} as const;

export type GoodsReceiptStatus =
  (typeof GoodsReceiptStatus)[keyof typeof GoodsReceiptStatus];

export const DiscrepancySeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

export type DiscrepancySeverity =
  (typeof DiscrepancySeverity)[keyof typeof DiscrepancySeverity];

export const ReceiptLineDestination = {
  UNCLASSIFIED: 'UNCLASSIFIED',
  SUPPLY: 'SUPPLY',
  INVENTORY: 'INVENTORY',
} as const;

export type ReceiptLineDestination =
  (typeof ReceiptLineDestination)[keyof typeof ReceiptLineDestination];

export {
  TicketStatus,
  PriorityLevel,
  SupportTicketKind,
} from './dto/support-ticket.dto';
export { EventType, EventStatus } from './dto/event.dto';
export { ChartOfAccountType } from './dto/finance.dto';
export { DepreciationMethod } from './dto/depreciation-rate.dto';
export { ServiceType, TaskStatus } from './dto/operations.dto';
export { QuoteStatus } from './dto/quote.dto';
export type {
  TicketStatus as TicketStatusType,
  PriorityLevel as PriorityLevelType,
  SupportTicketKind as SupportTicketKindType,
} from './dto/support-ticket.dto';
export type {
  EventType as EventTypeEnum,
  EventStatus as EventStatusEnum,
} from './dto/event.dto';
export type { ChartOfAccountType as ChartOfAccountTypeEnum } from './dto/finance.dto';
export type { DepreciationMethod as DepreciationMethodEnum } from './dto/depreciation-rate.dto';
export type {
  ServiceType as ServiceTypeEnum,
  TaskStatus as TaskStatusEnum,
} from './dto/operations.dto';
export type { QuoteStatus as QuoteStatusEnum } from './dto/quote.dto';
