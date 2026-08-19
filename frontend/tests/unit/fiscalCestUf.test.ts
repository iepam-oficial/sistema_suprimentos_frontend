import {
  BRAZIL_UFS,
  CEST_UF_FILTER_OPTIONS,
  CEST_UF_NATIONAL_FILTER,
  formatCestUfLabel,
  formatNcmRowUfColumn,
} from '@/features/financeiro/lib/cestUf';

describe('formatCestUfLabel', () => {
  it('retorna Nacional para lista vazia, undefined ou null', () => {
    expect(formatCestUfLabel([])).toBe('Nacional');
    expect(formatCestUfLabel(undefined)).toBe('Nacional');
    expect(formatCestUfLabel(null)).toBe('Nacional');
  });

  it('ordena siglas A–Z, deduplica e junta com vírgula e espaço', () => {
    expect(formatCestUfLabel(['SP', 'RJ'])).toBe('RJ, SP');
    expect(formatCestUfLabel(['SP', 'SP', 'RJ'])).toBe('RJ, SP');
  });
});

describe('formatNcmRowUfColumn', () => {
  it('retorna hífen quando não há CESTs', () => {
    expect(formatNcmRowUfColumn(undefined)).toBe('-');
    expect(formatNcmRowUfColumn(null)).toBe('-');
    expect(formatNcmRowUfColumn([])).toBe('-');
  });

  it('retorna Nacional quando todos os CESTs são nacionais', () => {
    expect(formatNcmRowUfColumn([{ ufs: [] }])).toBe('Nacional');
    expect(formatNcmRowUfColumn([{}])).toBe('Nacional');
  });

  it('une UFs de vários CESTs e ordena A–Z', () => {
    expect(formatNcmRowUfColumn([{ ufs: ['SP'] }, { ufs: ['RJ', 'SP'] }])).toBe(
      'RJ, SP',
    );
  });

  it('coloca Nacional na frente quando há CEST nacional misturado com estadual', () => {
    expect(
      formatNcmRowUfColumn([{ ufs: [] }, { ufs: ['SP', 'RJ'] }]),
    ).toBe('Nacional, RJ, SP');
  });
});

describe('CEST_UF_FILTER_OPTIONS', () => {
  it('tem 29 opções: Todos, Nacional e 27 UFs', () => {
    expect(CEST_UF_FILTER_OPTIONS).toHaveLength(29);
    expect(CEST_UF_FILTER_OPTIONS[0]).toEqual({ value: '', label: 'Todos' });
    expect(CEST_UF_FILTER_OPTIONS[1]).toEqual({
      value: CEST_UF_NATIONAL_FILTER,
      label: 'Nacional',
    });
    expect(CEST_UF_NATIONAL_FILTER).toBe('NACIONAL');
    expect(BRAZIL_UFS).toHaveLength(27);
    expect([...BRAZIL_UFS]).toEqual([...BRAZIL_UFS].sort());
    expect(CEST_UF_FILTER_OPTIONS.slice(2).map((opt) => opt.value)).toEqual([
      ...BRAZIL_UFS,
    ]);
  });
});
