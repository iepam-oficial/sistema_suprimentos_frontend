import type { DemandSupplyAggregateStatus } from '@ti-assistant/contracts';

export function formatDemandSupplyCode(code: number): string {
  return `DS-${String(code).padStart(4, '0')}`;
}

export function formatApprovalReportId(code: number, sequence: number): string {
  return `${formatDemandSupplyCode(code)}-${String(sequence).padStart(3, '0')}`;
}

export function formatAggregateStatusLabel(
  status: DemandSupplyAggregateStatus | string,
): string {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'PARTIAL':
      return 'Parcial';
    case 'APPROVED':
      return 'Aprovado';
    case 'REJECTED':
      return 'Reprovado';
    case 'DELIVERED':
      return 'Entregue';
    case 'MIXED':
      return 'Parcial/Encerrado';
    default:
      return status;
  }
}
