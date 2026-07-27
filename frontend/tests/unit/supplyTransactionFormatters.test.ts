jest.mock('@/utils/money', () => ({
  formatBRL: (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
  mulMoney: (value: number, multiplier: number) => value * multiplier,
}));

import {
  formatTransactionTotalPrice,
  formatTransactionUnitPrice,
  getTransactionPolo,
} from '@/app/(dashboard)/supply-requests/admin/utils/supplyTransactionFormatters';

describe('supplyTransactionFormatters', () => {
  it('formats unit price when present', () => {
    expect(formatTransactionUnitPrice(12.5)).toBe('R$\u00a012,50');
  });

  it('shows dash when unit price is absent', () => {
    expect(formatTransactionUnitPrice(null)).toBe('—');
    expect(formatTransactionUnitPrice(undefined)).toBe('—');
  });

  it('formats zero unit price as valid currency', () => {
    expect(formatTransactionUnitPrice(0)).toBe('R$\u00a00,00');
  });

  it('calculates total price from unit price and quantity', () => {
    expect(formatTransactionTotalPrice(10, 3)).toBe('R$\u00a030,00');
  });

  it('shows dash for total when unit price is absent', () => {
    expect(formatTransactionTotalPrice(null, 5)).toBe('—');
  });

  it('returns polo from sector location branch', () => {
    expect(
      getTransactionPolo({
        sector: {
          id: '1',
          name: 'TI',
          location: { id: 'l1', name: 'Sede', branch: 'Campus Norte' },
        },
      }),
    ).toBe('Campus Norte');
  });

  it('returns N/A when polo is missing', () => {
    expect(getTransactionPolo({ sector: undefined })).toBe('N/A');
    expect(
      getTransactionPolo({
        sector: {
          id: '1',
          name: 'TI',
          location: { id: 'l1', name: 'Sede', branch: '' },
        },
      }),
    ).toBe('N/A');
  });
});
