jest.mock('@/utils/money', () => ({
  formatBRL: (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
}));

import type { StockMovement } from '@/features/catalog/types';
import {
  buildStockMovementPdfRow,
  formatBatchSupplier,
  formatMovementTotalCost,
  formatMovementTypeLabel,
  formatMovementUnitCost,
  getMovementPolo,
} from '@/app/(dashboard)/supply-requests/admin/utils/stockMovementFormatters';

function createMovement(overrides: Partial<StockMovement> = {}): StockMovement {
  return {
    id: 'mov-1',
    supply_id: 'supply-1',
    batch_id: 'batch-1',
    supply_request_id: 'req-1',
    movement_type: 'ENTRADA',
    quantity: 5,
    unit_cost: 10,
    total_cost: 50,
    justification: null,
    notes: null,
    from_user_id: 'user-1',
    to_user_id: 'user-2',
    sector_id: 'sector-1',
    reversed_movement_id: null,
    created_at: '2024-06-15T10:00:00.000Z',
    supply: {
      id: 'supply-1',
      name: 'Papel A4',
      available_quantity: 100,
      unit: { id: 'u1', name: 'Pacote', symbol: 'pct' },
    },
    from_user: {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao@example.com',
      role: 'ADMIN',
    },
    to_user: {
      id: 'user-2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      role: 'USER',
    },
    sector: {
      id: 'sector-1',
      name: 'TI',
      location: { id: 'loc-1', name: 'Sede', branch: 'Campus Norte' },
    },
    batch: {
      id: 'batch-1',
      supply_id: 'supply-1',
      supplier_id: 'supplier-1',
      purchased_quantity: 100,
      computed_balance: 95,
      unit_price: 10,
      freight: 0,
      total_price: 1000,
      purchased_at: '2024-05-01T00:00:00.000Z',
      expires_at: null,
      notes: null,
      invoice_url: null,
      supplier: { id: 'supplier-1', name: 'Fornecedor ABC' },
    },
    ...overrides,
  };
}

describe('stockMovementFormatters', () => {
  describe('formatMovementTypeLabel', () => {
    it.each([
      ['ENTRADA', 'Entrada'],
      ['SAIDA', 'Saída'],
      ['DEVOLUCAO', 'Devolução'],
      ['PERDA', 'Perda'],
    ] as const)('maps %s to %s', (movementType, expected) => {
      expect(formatMovementTypeLabel(movementType)).toBe(expected);
    });

    it('returns unknown types unchanged', () => {
      expect(formatMovementTypeLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('formatMovementUnitCost', () => {
    it('formats unit cost with formatBRL', () => {
      expect(formatMovementUnitCost(12.5)).toBe('R$\u00a012,50');
    });

    it('formats zero unit cost as valid currency', () => {
      expect(formatMovementUnitCost(0)).toBe('R$\u00a00,00');
    });
  });

  describe('formatMovementTotalCost', () => {
    it('formats total cost with formatBRL', () => {
      expect(formatMovementTotalCost(50)).toBe('R$\u00a050,00');
    });

    it('formats zero total cost as valid currency', () => {
      expect(formatMovementTotalCost(0)).toBe('R$\u00a00,00');
    });
  });

  describe('getMovementPolo', () => {
    it('returns polo from sector location branch', () => {
      expect(
        getMovementPolo({
          sector: {
            id: '1',
            name: 'TI',
            location: { id: 'l1', name: 'Sede', branch: 'Campus Norte' },
          },
        }),
      ).toBe('Campus Norte');
    });

    it('returns N/A when polo is missing', () => {
      expect(getMovementPolo({ sector: undefined })).toBe('N/A');
      expect(getMovementPolo({ sector: null })).toBe('N/A');
      expect(
        getMovementPolo({
          sector: {
            id: '1',
            name: 'TI',
            location: { id: 'l1', name: 'Sede', branch: '' },
          },
        }),
      ).toBe('N/A');
    });
  });

  describe('formatBatchSupplier', () => {
    it('formats purchased_at date and supplier name', () => {
      expect(
        formatBatchSupplier({
          id: 'batch-1',
          supply_id: 'supply-1',
          supplier_id: 'supplier-1',
          purchased_quantity: 100,
          computed_balance: 95,
          unit_price: 10,
          freight: 0,
          total_price: 1000,
          purchased_at: '2024-05-01T00:00:00.000Z',
          expires_at: null,
          notes: null,
          invoice_url: null,
          supplier: { id: 'supplier-1', name: 'Fornecedor ABC' },
        }),
      ).toBe('01/05/2024 - Fornecedor ABC');
    });

    it('returns N/A when batch is missing', () => {
      expect(formatBatchSupplier(undefined)).toBe('N/A');
      expect(formatBatchSupplier(null)).toBe('N/A');
    });

    it('returns N/A when supplier is missing', () => {
      expect(
        formatBatchSupplier({
          id: 'batch-1',
          supply_id: 'supply-1',
          supplier_id: 'supplier-1',
          purchased_quantity: 100,
          computed_balance: 95,
          unit_price: 10,
          freight: 0,
          total_price: 1000,
          purchased_at: '2024-05-01T00:00:00.000Z',
          expires_at: null,
          notes: null,
          invoice_url: null,
        }),
      ).toBe('N/A');
    });
  });

  describe('buildStockMovementPdfRow', () => {
    it('builds PDF row with all columns', () => {
      const movement = createMovement();
      expect(buildStockMovementPdfRow(movement)).toEqual([
        'Papel A4',
        'Entrada',
        'João Silva',
        'Maria Santos',
        '5 pct',
        'R$\u00a010,00',
        'R$\u00a050,00',
        '01/05/2024 - Fornecedor ABC',
        'req-1',
        'TI',
        'Campus Norte',
        new Date('2024-06-15T10:00:00.000Z').toLocaleDateString('pt-BR'),
      ]);
    });

    it('uses fallbacks for missing optional fields', () => {
      const movement = createMovement({
        supply_request_id: null,
        sector: null,
        batch: undefined,
        unit_cost: 0,
        total_cost: 0,
      });

      const row = buildStockMovementPdfRow(movement);
      expect(row[6]).toBe('R$\u00a00,00');
      expect(row[7]).toBe('N/A');
      expect(row[8]).toBe('—');
      expect(row[9]).toBe('N/A');
      expect(row[10]).toBe('N/A');
    });
  });
});
