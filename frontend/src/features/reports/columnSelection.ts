export function defaultColumnSelection(keys: string[]): Record<string, boolean> {
  return Object.fromEntries(keys.map((key) => [key, true]));
}

export function selectedKeys(
  selection: Record<string, boolean>,
  orderedKeys: string[],
): string[] {
  return orderedKeys.filter((key) => selection[key]);
}

export function filterTableByKeys(
  headers: string[],
  columnKeys: string[],
  rows: (string | number)[][],
  selection: Record<string, boolean>,
): { headers: string[]; rows: (string | number)[][] } {
  const indices = columnKeys
    .map((key, index) => (selection[key] ? index : -1))
    .filter((index) => index >= 0);

  return {
    headers: indices.map((i) => headers[i] ?? ''),
    rows: rows.map((row) => indices.map((i) => row[i] ?? '')),
  };
}

/**
 * Flatten supply report: one row per batch; if no batches, one row with empty detail cols.
 */
export function flattenSupplyExport(
  columnKeys: string[],
  tableHeaders: string[],
  tableRows: (string | number)[][],
  detailColumnKeys: string[],
  detailHeaders: string[],
  rowDetails: ({ headers: string[]; rows: (string | number)[][] } | null)[],
  selection: Record<string, boolean>,
): { headers: string[]; rows: (string | number)[][] } {
  const summaryIndices = columnKeys
    .map((key, index) => (selection[key] ? index : -1))
    .filter((index) => index >= 0);
  const detailIndices = detailColumnKeys
    .map((key, index) => (selection[key] ? index : -1))
    .filter((index) => index >= 0);

  const headers = [
    ...summaryIndices.map((i) => tableHeaders[i] ?? ''),
    ...detailIndices.map((i) => detailHeaders[i] ?? ''),
  ];

  const emptyDetailCells = detailIndices.map(() => '' as string | number);
  const rows: (string | number)[][] = [];

  tableRows.forEach((summaryRow, rowIndex) => {
    const summaryCells = summaryIndices.map((i) => summaryRow[i] ?? '');
    const detail = rowDetails[rowIndex];
    const detailRows = detail?.rows?.length ? detail.rows : null;

    if (!detailRows) {
      rows.push([...summaryCells, ...emptyDetailCells]);
      return;
    }

    for (const detailRow of detailRows) {
      rows.push([
        ...summaryCells,
        ...detailIndices.map((i) => detailRow[i] ?? ''),
      ]);
    }
  });

  return { headers, rows };
}

export function canExport(selection: Record<string, boolean>): boolean {
  return Object.values(selection).some(Boolean);
}

type StockExportPayload = {
  slug: string;
  columnKeys?: string[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  detailColumnKeys?: string[];
  detailHeaders?: string[];
  rowDetails?: ({ headers: string[]; rows: (string | number)[][] } | null)[];
};

/**
 * Export table for stock reports: flatten supplies-stock; filter inventory-overview.
 * When columnKeys is absent, returns the full summary table unchanged.
 */
export function buildStockExportTable(
  data: StockExportPayload,
  selection: Record<string, boolean>,
): { headers: string[]; rows: (string | number)[][] } {
  const columnKeys = data.columnKeys;
  if (!columnKeys?.length) {
    return { headers: data.tableHeaders, rows: data.tableRows };
  }

  if (data.slug === 'supplies-stock') {
    return flattenSupplyExport(
      columnKeys,
      data.tableHeaders,
      data.tableRows,
      data.detailColumnKeys ?? [],
      data.detailHeaders ?? [],
      data.rowDetails ?? data.tableRows.map(() => null),
      selection,
    );
  }

  return filterTableByKeys(
    data.tableHeaders,
    columnKeys,
    data.tableRows,
    selection,
  );
}
