import type { SupplyDTO } from '@/features/catalog/types';
import {
  clampCartQuantity,
  filterAvailableSupplies,
  reconcileCartItems,
  type CartStockItem,
} from '@/features/supply-requests/utils/cartStockUtils';

function createSupply(id: string, available_quantity: number): SupplyDTO {
  return {
    id,
    name: `Supply ${id}`,
    available_quantity,
    minimum_quantity: 0,
    visible_to_requesters: true,
    unit: { id: 'u1', name: 'Unidade', symbol: 'un' },
    category: { id: 'c1', label: 'Categoria' },
  } as SupplyDTO;
}

function createCartItem(id: string, quantity: number, available: number): CartStockItem {
  return { id, quantity, supply: createSupply(id, available) };
}

describe('filterAvailableSupplies', () => {
  it('keeps only supplies with available_quantity > 0', () => {
    const supplies = [createSupply('1', 5), createSupply('2', 0), createSupply('3', 1)];
    expect(filterAvailableSupplies(supplies).map((s) => s.id)).toEqual(['1', '3']);
  });
});

describe('clampCartQuantity', () => {
  it('clamps value between 1 and available', () => {
    expect(clampCartQuantity(5, 3)).toBe(3);
    expect(clampCartQuantity(0, 3)).toBe(1);
    expect(clampCartQuantity(2, 3)).toBe(2);
  });

  it('returns 0 when available is zero or negative', () => {
    expect(clampCartQuantity(5, 0)).toBe(0);
    expect(clampCartQuantity(1, -1)).toBe(0);
  });
});

describe('reconcileCartItems', () => {
  it('removes items with zero stock', () => {
    const cart = [createCartItem('1', 2, 0), createCartItem('2', 1, 5)];
    const supplies = [createSupply('1', 0), createSupply('2', 5)];
    const { cart: result, changed } = reconcileCartItems(cart, supplies);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
    expect(changed).toBe(true);
  });

  it('caps quantity to available stock', () => {
    const cart = [createCartItem('1', 5, 3)];
    const supplies = [createSupply('1', 2)];
    const { cart: result, changed } = reconcileCartItems(cart, supplies);
    expect(result[0].quantity).toBe(2);
    expect(result[0].supply.available_quantity).toBe(2);
    expect(changed).toBe(true);
  });

  it('updates embedded supply with fresh data', () => {
    const cart = [createCartItem('1', 2, 5)];
    const freshSupply = createSupply('1', 5);
    freshSupply.name = 'Updated name';
    const { cart: result, changed } = reconcileCartItems(cart, [freshSupply]);
    expect(result[0].supply.name).toBe('Updated name');
    expect(changed).toBe(false);
  });

  it('reports changed=false when nothing needs adjustment', () => {
    const cart = [createCartItem('1', 2, 5)];
    const supplies = [createSupply('1', 5)];
    const { changed } = reconcileCartItems(cart, supplies);
    expect(changed).toBe(false);
  });
});
