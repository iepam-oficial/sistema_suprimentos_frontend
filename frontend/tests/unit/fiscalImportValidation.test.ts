import {
  FISCAL_IMPORT_CEST_SNIPPET,
  invalidImportMessage,
  validateFiscalImportRoot,
} from '@/features/financeiro/lib/fiscalImportValidation';

describe('validateFiscalImportRoot', () => {
  it('aceita NCM com Nomenclaturas array', () => {
    expect(validateFiscalImportRoot('ncm', { Nomenclaturas: [] })).toBe(true);
  });

  it('rejeita NCM sem Nomenclaturas array', () => {
    expect(validateFiscalImportRoot('ncm', {})).toBe(false);
    expect(validateFiscalImportRoot('ncm', { Nomenclaturas: {} })).toBe(false);
    expect(validateFiscalImportRoot('ncm', [])).toBe(false);
  });

  it('aceita CEST como array raiz', () => {
    expect(validateFiscalImportRoot('cest', [])).toBe(true);
    expect(validateFiscalImportRoot('cest', [{ cest: '01.001.00' }])).toBe(true);
  });

  it('rejeita CEST que não é array', () => {
    expect(validateFiscalImportRoot('cest', {})).toBe(false);
    expect(validateFiscalImportRoot('cest', null)).toBe(false);
  });

  it('mensagens de erro são uma linha', () => {
    expect(invalidImportMessage('ncm')).toBe('JSON NCM inválido');
    expect(invalidImportMessage('cest')).toBe('JSON CEST inválido');
  });
});

describe('FISCAL_IMPORT_CEST_SNIPPET', () => {
  it('inclui exemplo com campo uf', () => {
    expect(FISCAL_IMPORT_CEST_SNIPPET).toContain('"uf"');
  });
});
