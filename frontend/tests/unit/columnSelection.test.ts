import {
  buildStockExportTable,
  canExport,
  columnKeysMatchSelection,
  columnSelectionStorageKey,
  defaultColumnSelection,
  filterTableByKeys,
  flattenSupplyExport,
  loadColumnSelection,
  saveColumnSelection,
  selectedKeys,
} from '@/features/reports/columnSelection';

describe('defaultColumnSelection', () => {
  it('marks every key as true', () => {
    expect(defaultColumnSelection(['a', 'b', 'c'])).toEqual({
      a: true,
      b: true,
      c: true,
    });
  });
});

describe('column selection persistence', () => {
  function createMemoryStorage(initial: Record<string, string> = {}) {
    const store = { ...initial };
    return {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      _store: store,
    };
  }

  it('builds storage key per slug', () => {
    expect(columnSelectionStorageKey('supplies-stock')).toBe(
      'reports:columns:supplies-stock',
    );
  });

  it('columnKeysMatchSelection requires the same key set', () => {
    expect(columnKeysMatchSelection(['a', 'b'], { a: true, b: false })).toBe(true);
    expect(columnKeysMatchSelection(['a', 'b'], { a: true })).toBe(false);
    expect(columnKeysMatchSelection(['a'], { a: true, b: false })).toBe(false);
  });

  it('saveColumnSelection writes JSON under the slug key', () => {
    const storage = createMemoryStorage();
    const selection = { name: true, qty: false };
    saveColumnSelection('inventory-overview', selection, storage);
    expect(storage._store['reports:columns:inventory-overview']).toBe(
      JSON.stringify(selection),
    );
  });

  it('loadColumnSelection restores when keys match', () => {
    const selection = { name: false, batch: true };
    const storage = createMemoryStorage({
      'reports:columns:supplies-stock': JSON.stringify(selection),
    });
    expect(
      loadColumnSelection('supplies-stock', ['name', 'batch'], storage),
    ).toEqual(selection);
  });

  it('loadColumnSelection defaults all true when keys mismatch', () => {
    const storage = createMemoryStorage({
      'reports:columns:supplies-stock': JSON.stringify({ name: false }),
    });
    expect(
      loadColumnSelection('supplies-stock', ['name', 'batch'], storage),
    ).toEqual({ name: true, batch: true });
  });

  it('loadColumnSelection defaults when storage is empty or invalid', () => {
    const empty = createMemoryStorage();
    expect(loadColumnSelection('supplies-stock', ['a'], empty)).toEqual({
      a: true,
    });

    const invalid = createMemoryStorage({
      'reports:columns:supplies-stock': '{not-json',
    });
    expect(loadColumnSelection('supplies-stock', ['a'], invalid)).toEqual({
      a: true,
    });
  });

  it('isolates selection per slug', () => {
    const storage = createMemoryStorage();
    saveColumnSelection('supplies-stock', { a: false }, storage);
    saveColumnSelection('inventory-overview', { b: true }, storage);
    expect(loadColumnSelection('supplies-stock', ['a'], storage)).toEqual({
      a: false,
    });
    expect(loadColumnSelection('inventory-overview', ['b'], storage)).toEqual({
      b: true,
    });
  });

  /**
   * Detail-enriched reports reuse the same `reports:columns:${slug}` helpers
   * as stock (via useReportColumnSelection → load/saveColumnSelection).
   */
  describe('detail-enriched slugs', () => {
    const supplyRequestsKeys = [
      'protocol',
      'status',
      'requester',
      'item_name',
      'qty',
    ];
    const consumptionKeys = ['sector', 'item', 'qty'];

    it('builds storage key for detail-enriched slugs', () => {
      expect(columnSelectionStorageKey('supply-requests')).toBe(
        'reports:columns:supply-requests',
      );
      expect(columnSelectionStorageKey('consumption-by-sector')).toBe(
        'reports:columns:consumption-by-sector',
      );
    });

    it('persists and restores selection including detail column keys', () => {
      const selection = {
        protocol: true,
        status: false,
        requester: true,
        item_name: false,
        qty: true,
      };
      const storage = createMemoryStorage();
      saveColumnSelection('supply-requests', selection, storage);
      expect(storage._store['reports:columns:supply-requests']).toBe(
        JSON.stringify(selection),
      );
      expect(
        loadColumnSelection('supply-requests', supplyRequestsKeys, storage),
      ).toEqual(selection);
    });

    it('defaults all true when no preference for a detail-enriched slug', () => {
      const storage = createMemoryStorage();
      expect(
        loadColumnSelection('purchases-by-batch', ['batch', 'supplier'], storage),
      ).toEqual({ batch: true, supplier: true });
    });

    it('restores prior selection after switching away and back', () => {
      const storage = createMemoryStorage();
      const requestsSelection = {
        protocol: false,
        status: true,
        requester: true,
        item_name: true,
        qty: false,
      };
      const consumptionSelection = {
        sector: true,
        item: false,
        qty: true,
      };

      saveColumnSelection('supply-requests', requestsSelection, storage);
      saveColumnSelection('consumption-by-sector', consumptionSelection, storage);

      // Simulate viewing another slug, then returning
      expect(
        loadColumnSelection('consumption-by-sector', consumptionKeys, storage),
      ).toEqual(consumptionSelection);
      expect(
        loadColumnSelection('supply-requests', supplyRequestsKeys, storage),
      ).toEqual(requestsSelection);
    });
  });
});

describe('selectedKeys', () => {
  it('returns only selected keys in the given order', () => {
    const selection = { a: true, b: false, c: true };
    expect(selectedKeys(selection, ['c', 'a', 'b'])).toEqual(['c', 'a']);
  });
});

describe('filterTableByKeys', () => {
  it('keeps only selected columns in headers and rows', () => {
    const headers = ['Nome', 'Qtd', 'Valor'];
    const columnKeys = ['name', 'qty', 'value'];
    const rows: (string | number)[][] = [
      ['A', 1, 10],
      ['B', 2, 20],
    ];
    const selection = { name: true, qty: false, value: true };

    expect(filterTableByKeys(headers, columnKeys, rows, selection)).toEqual({
      headers: ['Nome', 'Valor'],
      rows: [
        ['A', 10],
        ['B', 20],
      ],
    });
  });
});

describe('flattenSupplyExport', () => {
  const columnKeys = ['name', 'total'];
  const tableHeaders = ['Nome', 'Total'];
  const detailColumnKeys = ['batch', 'qty'];
  const detailHeaders = ['Lote', 'Qtd'];
  const selection = {
    name: true,
    total: true,
    batch: true,
    qty: true,
  };

  it('emits one row per batch when details exist', () => {
    const result = flattenSupplyExport(
      columnKeys,
      tableHeaders,
      [['Item A', 5]],
      detailColumnKeys,
      detailHeaders,
      [{ headers: detailHeaders, rows: [['L1', 2], ['L2', 3]] }],
      selection,
    );

    expect(result).toEqual({
      headers: ['Nome', 'Total', 'Lote', 'Qtd'],
      rows: [
        ['Item A', 5, 'L1', 2],
        ['Item A', 5, 'L2', 3],
      ],
    });
  });

  it('emits one row with empty detail cols when there are no batches', () => {
    const result = flattenSupplyExport(
      columnKeys,
      tableHeaders,
      [['Item B', 0]],
      detailColumnKeys,
      detailHeaders,
      [null],
      selection,
    );

    expect(result).toEqual({
      headers: ['Nome', 'Total', 'Lote', 'Qtd'],
      rows: [['Item B', 0, '', '']],
    });
  });

  it('respects selection for summary and detail columns', () => {
    const result = flattenSupplyExport(
      columnKeys,
      tableHeaders,
      [['Item C', 9]],
      detailColumnKeys,
      detailHeaders,
      [{ headers: detailHeaders, rows: [['L9', 9]] }],
      { name: true, total: false, batch: false, qty: true },
    );

    expect(result).toEqual({
      headers: ['Nome', 'Qtd'],
      rows: [['Item C', 9]],
    });
  });
});

describe('canExport', () => {
  it('returns false when every column is deselected', () => {
    expect(canExport({ a: false, b: false })).toBe(false);
  });

  it('returns true when at least one column is selected', () => {
    expect(canExport({ a: false, b: true })).toBe(true);
  });
});

describe('buildStockExportTable', () => {
  it('flattens supplies-stock with selection', () => {
    const result = buildStockExportTable(
      {
        slug: 'supplies-stock',
        columnKeys: ['name'],
        tableHeaders: ['Nome'],
        tableRows: [['Item']],
        detailColumnKeys: ['batch'],
        detailHeaders: ['Lote'],
        rowDetails: [{ headers: ['Lote'], rows: [['L1']] }],
      },
      { name: true, batch: true },
    );
    expect(result).toEqual({
      headers: ['Nome', 'Lote'],
      rows: [['Item', 'L1']],
    });
  });

  it('filters inventory-overview summary columns', () => {
    const result = buildStockExportTable(
      {
        slug: 'inventory-overview',
        columnKeys: ['a', 'b'],
        tableHeaders: ['A', 'B'],
        tableRows: [[1, 2]],
      },
      { a: false, b: true },
    );
    expect(result).toEqual({ headers: ['B'], rows: [[2]] });
  });

  it('returns full table when columnKeys are absent', () => {
    const result = buildStockExportTable(
      {
        slug: 'consumption-by-sector',
        tableHeaders: ['X'],
        tableRows: [['y']],
      },
      {},
    );
    expect(result).toEqual({ headers: ['X'], rows: [['y']] });
  });
});
