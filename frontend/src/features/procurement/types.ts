import type {
  ProcurementQuoteStatus,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
} from '@ti-assistant/contracts';

export type {
  ApprovePurchaseRequestInput,
  CatalogSearchResultDTO,
  CreatePurchaseRequestInput,
  CreatePurchaseRequestItemInput,
  PurchaseRequestApprovalDTO,
  PurchaseRequestDTO,
  PurchaseRequestItemDTO,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
  RejectPurchaseRequestInput,
  UpdatePurchaseRequestInput,
} from '@ti-assistant/contracts';

export function purchaseRequestStatusLabel(status: PurchaseRequestStatus | string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING_APPROVAL: 'Aguardando aprovação',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    CANCELLED: 'Cancelada',
  };
  return labels[status] ?? status;
}

export function purchaseRequestStatusColor(status: PurchaseRequestStatus | string): string {
  const colors: Record<string, string> = {
    DRAFT: 'gray',
    PENDING_APPROVAL: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELLED: 'orange',
  };
  return colors[status] ?? 'gray';
}

export function purchaseRequestPriorityLabel(priority: PurchaseRequestPriority | string): string {
  const labels: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return labels[priority] ?? priority;
}

export function purchaseRequestPriorityColor(priority: PurchaseRequestPriority | string): string {
  const colors: Record<string, string> = {
    LOW: 'gray',
    MEDIUM: 'blue',
    HIGH: 'orange',
    URGENT: 'red',
  };
  return colors[priority] ?? 'gray';
}

export function procurementQuoteStatusLabel(status: ProcurementQuoteStatus | string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviada',
    AWAITING_APPROVAL: 'Aguardando aprovação da diretoria',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    CANCELLED: 'Cancelada',
  };
  return labels[status] ?? status;
}

export function procurementQuoteStatusColor(status: ProcurementQuoteStatus | string): string {
  const colors: Record<string, string> = {
    DRAFT: 'gray',
    SENT: 'blue',
    AWAITING_APPROVAL: 'purple',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELLED: 'orange',
  };
  return colors[status] ?? 'gray';
}

export function purchaseOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    ACCEPTED: 'Aceito',
    DECLINED: 'Recusado',
    CANCELLED: 'Cancelado',
  };
  return labels[status] ?? status;
}

export function purchaseOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'gray',
    SENT: 'blue',
    ACCEPTED: 'green',
    DECLINED: 'red',
    CANCELLED: 'orange',
  };
  return colors[status] ?? 'gray';
}
