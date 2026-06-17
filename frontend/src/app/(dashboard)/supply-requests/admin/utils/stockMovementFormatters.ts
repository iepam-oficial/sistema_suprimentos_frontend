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

export function formatBatchSupplier(
  batch: SupplyBatchDTO | undefined | null,
): string {
  const supplierName = batch?.supplier?.name?.trim();
  const purchasedAt = batch?.purchased_at;
  if (!batch || !supplierName || !purchasedAt) return 'N/A';

  const [year, month, day] = purchasedAt.slice(0, 10).split('-').map(Number);
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('pt-BR');
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
    movement.supply_request_id ?? '—',
    movement.sector?.name ?? 'N/A',
    getMovementPolo(movement),
    new Date(movement.created_at).toLocaleDateString('pt-BR'),
  ];
}
