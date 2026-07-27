import type { SubmitProcurementProposalItemInput } from '@ti-assistant/contracts';

jest.mock('@/utils/money', () => ({
  sumMoney: (values: number[]) => values.reduce((acc, current) => acc + current, 0),
  formatBRL: (value: number) => String(value),
}));

import { sumProposalItemsTotal } from '@/app/portal/cotacao/components/portalQuoteUtils';

describe('sumProposalItemsTotal', () => {
  it('sums total_price of multiple lines', () => {
    const items: SubmitProcurementProposalItemInput[] = [
      {
        description: 'Parafuso sextavado M8',
        quantity: 10,
        unit_price: 25.5,
        total_price: 255,
      },
      {
        description: 'Chave de fenda isolada',
        quantity: 5,
        unit_price: 100,
        total_price: 500,
      },
    ];

    expect(sumProposalItemsTotal(items)).toBe(755);
  });

  it('returns 0 when all line totals are zero', () => {
    const items: SubmitProcurementProposalItemInput[] = [
      { description: 'Item A', quantity: 1, unit_price: 0, total_price: 0 },
      { description: 'Item B', quantity: 2, unit_price: 0, total_price: 0 },
    ];

    expect(sumProposalItemsTotal(items)).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(sumProposalItemsTotal([])).toBe(0);
  });
});
