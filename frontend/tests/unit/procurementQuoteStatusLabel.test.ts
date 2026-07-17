import {
  procurementQuoteStatusColor,
  procurementQuoteStatusLabel,
} from '@/features/procurement/types';

describe('procurementQuoteStatusLabel', () => {
  it('labels AWAITING_APPROVAL as awaiting director approval', () => {
    expect(procurementQuoteStatusLabel('AWAITING_APPROVAL')).toBe(
      'Aguardando aprovação da diretoria',
    );
  });

  it('colors AWAITING_APPROVAL as purple', () => {
    expect(procurementQuoteStatusColor('AWAITING_APPROVAL')).toBe('purple');
  });
});
