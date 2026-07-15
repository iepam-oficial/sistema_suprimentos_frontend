import type { SupplyRequestDTO } from '@ti-assistant/contracts';

function getItemName(item: SupplyRequestDTO): string {
  return item.supply?.name ?? '-';
}

function getItemUnit(item: SupplyRequestDTO): string {
  return item.supply?.unit?.symbol ?? item.supply?.unit?.name ?? '';
}

export function formatApprovalBatchItemLine(item: SupplyRequestDTO): string {
  const name = getItemName(item);
  const unit = getItemUnit(item);

  if (unit) {
    return `${name} — ${item.quantity} ${unit}`;
  }

  return `${name} — ${item.quantity}`;
}

export function formatApprovalBatchItemLines(items: SupplyRequestDTO[]): string[] {
  return items.map(formatApprovalBatchItemLine);
}
