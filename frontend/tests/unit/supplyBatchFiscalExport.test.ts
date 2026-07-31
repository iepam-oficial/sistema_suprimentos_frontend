import type { SupplyBatchFiscalLineDTO } from '@ti-assistant/contracts';
import {
  FISCAL_EXPORT_HEADERS,
  buildFiscalExportRows,
} from '@/app/(dashboard)/supplies/components/supplyBatchFiscalExport';

function createFiscalLine(
  overrides: Partial<SupplyBatchFiscalLineDTO> = {},
): SupplyBatchFiscalLineDTO {
  return {
    line_number: 1,
    description: 'Caneta azul',
    quantity: 10,
    unit_price: 1.5,
    total_price: 15,
    commercial_unit: 'UN',
    cfop: '5102',
    cst: '00',
    discount_value: null,
    icms_base: null,
    icms_value: null,
    icms_rate: null,
    icms_st_base: null,
    icms_st_value: null,
    ipi_value: null,
    ipi_rate: null,
    ibs_value: null,
    cbs_value: null,
    is_value: null,
    ncm_from_invoice: '96081000',
    ...overrides,
  };
}

describe('buildFiscalExportRows', () => {
  it('returns empty body when there are no fiscal lines', () => {
    expect(buildFiscalExportRows(undefined)).toEqual([]);
    expect(buildFiscalExportRows(null)).toEqual([]);
    expect(buildFiscalExportRows([])).toEqual([]);
  });

  it('includes CFOP and closed fiscal columns per line', () => {
    const rows = buildFiscalExportRows([
      createFiscalLine({
        cfop: '5102',
        cst: '00',
        discount_value: 0.5,
        icms_rate: 18,
      }),
    ]);

    expect(FISCAL_EXPORT_HEADERS).toContain('CFOP');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(FISCAL_EXPORT_HEADERS.length);
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('CFOP')]).toBe('5102');
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('CST')]).toBe('00');
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('Descrição')]).toBe('Caneta azul');
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('Desconto')]).toBe(0.5);
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('Alíquota ICMS')]).toBe(18);
  });

  it('serializes null fiscal fields as empty cells', () => {
    const rows = buildFiscalExportRows([
      createFiscalLine({
        commercial_unit: null,
        cfop: null,
        cst: null,
        ncm_from_invoice: null,
      }),
    ]);

    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('Unidade')]).toBe('');
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('CFOP')]).toBe('');
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('CST')]).toBe('');
    expect(rows[0][FISCAL_EXPORT_HEADERS.indexOf('NCM (NF)')]).toBe('');
  });
});
