import {
  formatAggregateStatusLabel,
  formatApprovalReportId,
  formatDemandSupplyCode,
} from '@/features/supply-requests/utils/formatDemandSupply';

describe('formatDemandSupply', () => {
  describe('formatDemandSupplyCode', () => {
    it('pads code to 4 digits with DS prefix', () => {
      expect(formatDemandSupplyCode(42)).toBe('DS-0042');
    });

    it('pads single-digit codes', () => {
      expect(formatDemandSupplyCode(1)).toBe('DS-0001');
    });

    it('does not truncate codes longer than 4 digits', () => {
      expect(formatDemandSupplyCode(12345)).toBe('DS-12345');
    });
  });

  describe('formatApprovalReportId', () => {
    it('combines demand supply code and padded sequence', () => {
      expect(formatApprovalReportId(42, 1)).toBe('DS-0042-001');
    });

    it('pads sequence to 3 digits', () => {
      expect(formatApprovalReportId(42, 12)).toBe('DS-0042-012');
    });
  });

  describe('formatAggregateStatusLabel', () => {
    it.each([
      ['PENDING', 'Pendente'],
      ['PARTIAL', 'Parcial'],
      ['APPROVED', 'Aprovado'],
      ['REJECTED', 'Reprovado'],
      ['DELIVERED', 'Entregue'],
      ['MIXED', 'Parcial/Encerrado'],
    ] as const)('maps %s to %s', (status, expected) => {
      expect(formatAggregateStatusLabel(status)).toBe(expected);
    });

    it('returns unknown statuses unchanged', () => {
      expect(formatAggregateStatusLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
