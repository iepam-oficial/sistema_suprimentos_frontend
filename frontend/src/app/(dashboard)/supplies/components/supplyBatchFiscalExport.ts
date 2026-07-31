import type { SupplyBatchFiscalLineDTO } from '@ti-assistant/contracts';

/** Colunas fiscais fechadas + identificação da linha (BNFS-06). */
export const FISCAL_EXPORT_HEADERS = [
  'Linha',
  'Descrição',
  'Quantidade',
  'Unidade',
  'CFOP',
  'CST',
  'Preço unitário',
  'Valor total',
  'NCM (NF)',
  'Desconto',
  'BC ICMS',
  'Valor ICMS',
  'Alíquota ICMS',
  'BC ICMS ST',
  'Valor ICMS ST',
  'Valor IPI',
  'Alíquota IPI',
  'IBS',
  'CBS',
  'IS',
] as const;

function cell(value: string | number | null | undefined): string | number {
  if (value == null || value === '') return '';
  return value;
}

/** Monta linhas para CSV/PDF; array vazio é válido (export sem falha). */
export function buildFiscalExportRows(
  fiscalLines: SupplyBatchFiscalLineDTO[] | null | undefined,
): (string | number)[][] {
  if (!fiscalLines || fiscalLines.length === 0) {
    return [];
  }

  return fiscalLines.map((line) => [
    line.line_number,
    cell(line.description),
    line.quantity,
    cell(line.commercial_unit),
    cell(line.cfop),
    cell(line.cst),
    line.unit_price,
    line.total_price,
    cell(line.ncm_from_invoice),
    cell(line.discount_value),
    cell(line.icms_base),
    cell(line.icms_value),
    cell(line.icms_rate),
    cell(line.icms_st_base),
    cell(line.icms_st_value),
    cell(line.ipi_value),
    cell(line.ipi_rate),
    cell(line.ibs_value),
    cell(line.cbs_value),
    cell(line.is_value),
  ]);
}
