import { formatBRL, mulMoney } from '@/utils/money';
import type { SupplyTransaction } from '@/features/catalog/types';

export function formatTransactionUnitPrice(unitPrice: number | null | undefined): string {
  if (unitPrice == null) return '—';
  return formatBRL(unitPrice);
}

export function formatTransactionTotalPrice(
  unitPrice: number | null | undefined,
  quantity: number,
): string {
  if (unitPrice == null) return '—';
  return formatBRL(mulMoney(unitPrice, quantity));
}

export function getTransactionPolo(
  transaction: Pick<SupplyTransaction, 'sector'>,
): string {
  const branch = transaction.sector?.location?.branch?.trim();
  if (!branch) return 'N/A';
  return branch;
}

export function formatTransactionTypeLabel(transactionType: string): string {
  switch (transactionType) {
    case 'DELIVERY':
      return 'Entrega';
    case 'RETURN':
      return 'Devolução';
    case 'PURCHASE':
      return 'Compra';
    case 'ADJUSTMENT':
      return 'Ajuste';
    default:
      return transactionType;
  }
}

export function buildSupplyTransactionPdfRow(
  transaction: SupplyTransaction,
): (string | number)[] {
  return [
    transaction.supply.name,
    formatTransactionTypeLabel(transaction.transaction_type),
    transaction.movement_type === 'IN' ? 'Entrada' : 'Saída',
    transaction.from_user.name,
    transaction.to_user.name,
    `${transaction.quantity} ${transaction.supply.unit?.symbol ?? ''}`,
    formatTransactionUnitPrice(transaction.supply.unit_price),
    formatTransactionTotalPrice(transaction.supply.unit_price, transaction.quantity),
    transaction.sector?.name ?? 'N/A',
    getTransactionPolo(transaction),
    new Date(transaction.created_at).toLocaleDateString('pt-BR'),
  ];
}
