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

/** Lean PDF presets (~6 cols): id / date / entity / dimension / qty / value. */
const SUPPLY_REQUESTS_PDF_KEYS = [
  'id',
  'status',
  'created_at',
  'requester',
  'supply_name',
  'quantity',
] as const;

const CONSUMPTION_BY_SECTOR_PDF_KEYS = [
  'id',
  'created_at',
  'sector',
  'supply_name',
  'quantity',
  'unit_cost',
] as const;

const PURCHASES_BY_BATCH_PDF_KEYS = [
  'id',
  'purchased_at',
  'supplier',
  'supply_name',
  'purchased_quantity',
  'total_price',
] as const;

const SERVICE_ORDERS_PDF_KEYS = [
  'id',
  'order_number',
  'month',
  'entry_date',
  'equipment_description',
  'total_price',
] as const;

const ALERTS_BY_LEVEL_PDF_KEYS = [
  'id',
  'level',
  'about',
  'created_at',
  'inventory_name',
  'location',
] as const;

const PDF_PRESETS_BY_SLUG: Record<string, readonly string[]> = {
  'supplies-stock': SUPPLIES_STOCK_PDF_KEYS,
  'inventory-overview': INVENTORY_OVERVIEW_PDF_KEYS,
  'supply-requests': SUPPLY_REQUESTS_PDF_KEYS,
  'consumption-by-sector': CONSUMPTION_BY_SECTOR_PDF_KEYS,
  'purchases-by-batch': PURCHASES_BY_BATCH_PDF_KEYS,
  'service-orders': SERVICE_ORDERS_PDF_KEYS,
  'alerts-by-level': ALERTS_BY_LEVEL_PDF_KEYS,
};

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
 * Slim PDF export table: stock + detail-enriched presets by essential keys;
 * other reports (or missing columnKeys) fall back to the first 6 cols.
 * Summary presets only — no detail/lote columns.
 */
export function buildPdfExportTable(
  data: PdfExportPayload,
): { headers: string[]; rows: (string | number)[][] } {
  const columnKeys = data.columnKeys;
  const presetKeys = PDF_PRESETS_BY_SLUG[data.slug];

  if (presetKeys && columnKeys?.length) {
    return filterTableByKeys(
      data.tableHeaders,
      columnKeys,
      data.tableRows,
      selectionForPreset(columnKeys, presetKeys),
    );
  }

  return sliceFirstColumns(data.tableHeaders, data.tableRows, 6);
}
