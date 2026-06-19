import type { SupplyRequestDTO, SupplySummaryDTO } from '@ti-assistant/contracts';
import {
  formatApprovalBatchItemLine,
  formatApprovalBatchItemLines,
} from '@/features/supply-requests/utils/formatApprovalBatchItems';

function createSupplyRequest(overrides: Partial<SupplyRequestDTO> = {}): SupplyRequestDTO {
  return {
    id: 'req-1',
    quantity: 10,
    status: 'PENDING',
    notes: '',
    created_at: '2024-06-15T10:00:00.000Z',
    requester_confirmation: false,
    manager_delivery_confirmation: false,
    delivery_deadline: '2024-07-01',
    destination: 'TI',
    user: {
      id: 'user-1',
      name: 'João',
      email: 'joao@example.com',
      role: 'EMPLOYEE',
    },
    supply: {
      id: 'supply-1',
      name: 'Papel A4',
      description: '',
      quantity: 100,
      unit: { id: 'u1', name: 'Unidade', symbol: 'un' },
    },
    ...overrides,
  };
}

describe('formatApprovalBatchItems', () => {
  describe('formatApprovalBatchItemLine', () => {
    it('formats name, quantity and unit symbol', () => {
      expect(formatApprovalBatchItemLine(createSupplyRequest())).toBe('Papel A4 — 10 un');
    });

    it('falls back to unit name when symbol is missing', () => {
      const item = createSupplyRequest({
        supply: {
          id: 'supply-1',
          name: 'Toner',
          description: '',
          quantity: 100,
          unit: { id: 'u1', name: 'Unidade', symbol: undefined! },
        },
      });

      expect(formatApprovalBatchItemLine(item)).toBe('Toner — 10 Unidade');
    });

    it('omits unit suffix when unit is missing', () => {
      const supplyWithoutUnit = {
        id: 'supply-1',
        name: 'Caneta',
        description: '',
        quantity: 5,
      } as SupplySummaryDTO;

      expect(formatApprovalBatchItemLine(createSupplyRequest({ supply: supplyWithoutUnit, quantity: 5 }))).toBe(
        'Caneta — 5',
      );
    });

    it('uses dash as name when supply is missing', () => {
      expect(formatApprovalBatchItemLine(createSupplyRequest({ supply: undefined, quantity: 3 }))).toBe(
        '- — 3',
      );
    });

    it('uses dash as name when supply name is missing', () => {
      const supplyWithoutName = {
        id: 'supply-1',
        description: '',
        quantity: 2,
        unit: { id: 'u1', name: 'Unidade', symbol: 'un' },
      } as SupplySummaryDTO;

      expect(formatApprovalBatchItemLine(createSupplyRequest({ supply: supplyWithoutName, quantity: 2 }))).toBe(
        '- — 2 un',
      );
    });
  });

  describe('formatApprovalBatchItemLines', () => {
    it('returns one formatted line for a single item', () => {
      expect(formatApprovalBatchItemLines([createSupplyRequest()])).toEqual(['Papel A4 — 10 un']);
    });

    it('returns one line per item preserving order', () => {
      const items = [
        createSupplyRequest({ id: 'req-1', quantity: 10 }),
        createSupplyRequest({
          id: 'req-2',
          quantity: 3,
          supply: {
            id: 'supply-2',
            name: 'Toner',
            description: '',
            quantity: 50,
            unit: { id: 'u2', name: 'Caixa', symbol: 'cx' },
          },
        }),
        createSupplyRequest({ id: 'req-3', quantity: 1, supply: undefined }),
      ];

      expect(formatApprovalBatchItemLines(items)).toEqual([
        'Papel A4 — 10 un',
        'Toner — 3 cx',
        '- — 1',
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(formatApprovalBatchItemLines([])).toEqual([]);
    });
  });
});
