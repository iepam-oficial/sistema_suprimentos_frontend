import { formatBRL } from '@/utils/money';
import type { StockMovement, SupplyBatchDTO, SupplyMovementType } from '@/features/catalog/types';

export function formatMovementTypeLabel(movementType: SupplyMovementType | string): string {
  switch (movementType) {
    case 'ENTRADA':
      return 'Entrada';
    case 'SAIDA':
      return 'Saída';
    case 'DEVOLUCAO':
      return 'Devolução';
    case 'PERDA':
      return 'Perda';
    default:
      return movementType;
  }
}

export function formatMovementUnitCost(unitCost: number): string {
  return formatBRL(unitCost);
}

export function formatMovementTotalCost(totalCost: number): string {
  return formatBRL(totalCost);
}

export function getMovementPolo(
  movement: Pick<StockMovement, 'sector'>,
): string {
  const branch = movement.sector?.location?.branch?.trim();
  if (!branch) return 'N/A';
  return branch;
}

function formatPurchasedAtDate(purchasedAt: string): string | null {
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(purchasedAt);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]);
    const day = Number(isoDateMatch[3]);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
  }

  const date = new Date(purchasedAt);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatBatchSupplier(
  batch: SupplyBatchDTO | undefined | null,
): string {
  const supplierName = batch?.supplier?.name?.trim();
  const purchasedAt = batch?.purchased_at;
  if (!batch || !supplierName || !purchasedAt) return 'N/A';

  const formattedDate = formatPurchasedAtDate(purchasedAt);
  if (!formattedDate) return supplierName;

  return `${formattedDate} - ${supplierName}`;
}

export function buildStockMovementPdfRow(
  movement: StockMovement,
): (string | number)[] {
  return [
    movement.supply?.name ?? 'N/A',
    formatMovementTypeLabel(movement.movement_type),
    movement.from_user?.name ?? 'N/A',
    movement.to_user?.name ?? 'N/A',
    `${movement.quantity} ${movement.supply?.unit?.symbol ?? ''}`.trim(),
    formatMovementUnitCost(movement.unit_cost),
    formatMovementTotalCost(movement.total_cost),
    formatBatchSupplier(movement.batch),
    movement.sector?.name ?? 'N/A',
    getMovementPolo(movement),
    new Date(movement.created_at).toLocaleDateString('pt-BR'),
  ];
}
