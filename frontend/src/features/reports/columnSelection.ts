export function defaultColumnSelection(keys: string[]): Record<string, boolean> {
  return Object.fromEntries(keys.map((key) => [key, true]));
}

export function columnSelectionStorageKey(slug: string): string {
  return `reports:columns:${slug}`;
}

function isSelectionRecord(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((v) => typeof v === 'boolean');
}

/** True when stored selection keys match the current payload key set (order-independent). */
export function columnKeysMatchSelection(
  orderedKeys: string[],
  stored: Record<string, boolean>,
): boolean {
  const storedKeys = Object.keys(stored);
  if (storedKeys.length !== orderedKeys.length) {
    return false;
  }
  const keySet = new Set(orderedKeys);
  return storedKeys.every((key) => keySet.has(key));
}

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Restore column selection for a report slug.
 * Falls back to all-true defaults when missing, invalid, or keys no longer match.
 */
export function loadColumnSelection(
  slug: string,
  orderedKeys: string[],
  storage?: StorageReader | null,
): Record<string, boolean> {
  const defaults = defaultColumnSelection(orderedKeys);
  if (!slug || orderedKeys.length === 0) {
    return defaults;
  }

  try {
    const store = storage === undefined ? getLocalStorage() : storage;
    if (!store) {
      return defaults;
    }
    const raw = store.getItem(columnSelectionStorageKey(slug));
    if (!raw) {
      return defaults;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isSelectionRecord(parsed) || !columnKeysMatchSelection(orderedKeys, parsed)) {
      return defaults;
    }
    return Object.fromEntries(orderedKeys.map((key) => [key, parsed[key]]));
  } catch {
    return defaults;
  }
}

/** Persist column selection JSON under `reports:columns:${slug}`. */
export function saveColumnSelection(
  slug: string,
  selection: Record<string, boolean>,
  storage?: StorageWriter | null,
): void {
  if (!slug) {
    return;
  }
  try {
    const store = storage === undefined ? getLocalStorage() : storage;
    if (!store) {
      return;
    }
    store.setItem(columnSelectionStorageKey(slug), JSON.stringify(selection));
  } catch {
    // Ignore quota / private-mode failures
  }
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
