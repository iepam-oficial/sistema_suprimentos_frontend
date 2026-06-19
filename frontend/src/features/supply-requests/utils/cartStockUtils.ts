import type { SupplyDTO } from '@/features/catalog/types';

export interface CartStockItem {
  id: string;
  quantity: number;
  supply: SupplyDTO;
}

export function filterAvailableSupplies<T extends { available_quantity: number }>(
  supplies: T[],
): T[] {
  return supplies.filter((supply) => supply.available_quantity > 0);
}

export function clampCartQuantity(value: number, available: number): number {
  if (available <= 0) return 0;
  return Math.min(Math.max(value, 1), available);
}

export function reconcileCartItems(
  cart: CartStockItem[],
  supplies: SupplyDTO[],
): { cart: CartStockItem[]; changed: boolean } {
  const supplyMap = new Map(supplies.map((supply) => [supply.id, supply]));
  let changed = false;
  const nextCart: CartStockItem[] = [];

  for (const item of cart) {
    const freshSupply = supplyMap.get(item.id);
    if (!freshSupply || freshSupply.available_quantity <= 0) {
      changed = true;
      continue;
    }

    const quantity = clampCartQuantity(item.quantity, freshSupply.available_quantity);
    if (quantity !== item.quantity) {
      changed = true;
    }

    nextCart.push({ id: item.id, quantity, supply: freshSupply });
  }

  return { cart: nextCart, changed };
}
