import { filterTableByKeys } from '@/features/reports/columnSelection';

const SUPPLIES_STOCK_PDF_KEYS = [
  'name',
  'balance',
  'minimum_quantity',
  'status',
  'stock_value',
] as const;

const INVENTORY_OVERVIEW_PDF_KEYS = [
  'name',
  'serial_number',
  'location',
  'category',
  'status',
  'acquisition_price',
] as const;

type PdfExportPayload = {
  slug: string;
  columnKeys?: string[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  detailColumnKeys?: string[];
  detailHeaders?: string[];
  rowDetails?: ({ headers: string[]; rows: (string | number)[][] } | null)[];
};

function selectionForPreset(
  columnKeys: string[],
  presetKeys: readonly string[],
): Record<string, boolean> {
  const preset = new Set(presetKeys);
  return Object.fromEntries(columnKeys.map((key) => [key, preset.has(key)]));
}

function sliceFirstColumns(
  headers: string[],
  rows: (string | number)[][],
  maxColumns: number,
): { headers: string[]; rows: (string | number)[][] } {
  return {
    headers: headers.slice(0, maxColumns),
    rows: rows.map((row) => row.slice(0, maxColumns)),
  };
}

/**
 * Slim PDF export table: stock presets by essential keys; other reports first 6 cols.
 * Supplies-stock uses summary columns only (no detail/lote columns).
 */
export function buildPdfExportTable(
  data: PdfExportPayload,
): { headers: string[]; rows: (string | number)[][] } {
  const columnKeys = data.columnKeys;

  if (data.slug === 'supplies-stock' && columnKeys?.length) {
    return filterTableByKeys(
      data.tableHeaders,
      columnKeys,
      data.tableRows,
      selectionForPreset(columnKeys, SUPPLIES_STOCK_PDF_KEYS),
    );
  }

  if (data.slug === 'inventory-overview' && columnKeys?.length) {
    return filterTableByKeys(
      data.tableHeaders,
      columnKeys,
      data.tableRows,
      selectionForPreset(columnKeys, INVENTORY_OVERVIEW_PDF_KEYS),
    );
  }

  return sliceFirstColumns(data.tableHeaders, data.tableRows, 6);
}
