import {
  buildStockExportTable,
  canExport,
  defaultColumnSelection,
  filterTableByKeys,
  flattenSupplyExport,
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
