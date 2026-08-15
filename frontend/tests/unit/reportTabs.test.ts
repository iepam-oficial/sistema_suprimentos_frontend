import {
  columnKeyIndex,
  filterRowsByTab,
  getReportTabs,
  getSummaryTable,
} from '@/features/reports/reportTabs';
import type { ReportDetailBlock } from '@/features/reports/types';

const columnKeys = ['id', 'status_code', 'qty'];

const tableRows: (string | number)[][] = [
  ['r1', 'PENDING', 2],
  ['r2', 'APPROVED', 1],
  ['r3', 'PENDING', 5],
  ['r4', 'DELIVERED', 3],
];

const rowDetails: (ReportDetailBlock | null)[] = [
  { headers: ['item'], rows: [['a']] },
  null,
  { headers: ['item'], rows: [['b']] },
  { headers: ['item'], rows: [['c']] },
];

describe('getReportTabs', () => {
  it('always includes Resumo and Todas before dimension tabs', () => {
    expect(
      getReportTabs({
        tabValues: [
          { value: 'PENDING', label: 'Pendente' },
          { value: 'APPROVED', label: 'Aprovado' },
        ],
      }),
    ).toEqual([
      { id: 'summary', label: 'Resumo' },
      { id: 'all', label: 'Todas' },
      { id: 'PENDING', label: 'Pendente' },
      { id: 'APPROVED', label: 'Aprovado' },
    ]);
  });

  it('returns only Resumo and Todas when tabValues is empty or absent', () => {
    expect(getReportTabs({})).toEqual([
      { id: 'summary', label: 'Resumo' },
      { id: 'all', label: 'Todas' },
    ]);
    expect(getReportTabs({ tabValues: [] })).toEqual([
      { id: 'summary', label: 'Resumo' },
      { id: 'all', label: 'Todas' },
    ]);
  });
});

describe('columnKeyIndex', () => {
  it('returns the index of a known key', () => {
    expect(columnKeyIndex(columnKeys, 'status_code')).toBe(1);
  });

  it('returns -1 for missing key or undefined columnKeys', () => {
    expect(columnKeyIndex(columnKeys, 'missing')).toBe(-1);
    expect(columnKeyIndex(undefined, 'status_code')).toBe(-1);
    expect(columnKeyIndex([], 'status_code')).toBe(-1);
  });
});

describe('filterRowsByTab', () => {
  it('returns all rows and details for tab "all"', () => {
    expect(
      filterRowsByTab({
        tabId: 'all',
        tabDimensionKey: 'status_code',
        columnKeys,
        tableRows,
        rowDetails,
      }),
    ).toEqual({ tableRows, rowDetails });
  });

  it('filters rows and aligned rowDetails by dimension value (status)', () => {
    expect(
      filterRowsByTab({
        tabId: 'PENDING',
        tabDimensionKey: 'status_code',
        columnKeys,
        tableRows,
        rowDetails,
      }),
    ).toEqual({
      tableRows: [
        ['r1', 'PENDING', 2],
        ['r3', 'PENDING', 5],
      ],
      rowDetails: [
        { headers: ['item'], rows: [['a']] },
        { headers: ['item'], rows: [['b']] },
      ],
    });
  });

  it('returns empty arrays when no row matches the dimension tab', () => {
    expect(
      filterRowsByTab({
        tabId: 'CANCELLED',
        tabDimensionKey: 'status_code',
        columnKeys,
        tableRows,
        rowDetails,
      }),
    ).toEqual({ tableRows: [], rowDetails: [] });
  });

  it('returns empty result when dimension index is invalid', () => {
    expect(
      filterRowsByTab({
        tabId: 'PENDING',
        tabDimensionKey: 'status_code',
        columnKeys: ['id', 'qty'],
        tableRows,
        rowDetails,
      }),
    ).toEqual({ tableRows: [], rowDetails: [] });

    expect(
      filterRowsByTab({
        tabId: 'PENDING',
        tabDimensionKey: undefined,
        columnKeys,
        tableRows,
        rowDetails,
      }),
    ).toEqual({ tableRows: [], rowDetails: [] });
  });

  it('does not use detail table for summary tab (caller uses summaryRows)', () => {
    expect(
      filterRowsByTab({
        tabId: 'summary',
        tabDimensionKey: 'status_code',
        columnKeys,
        tableRows,
        rowDetails,
      }),
    ).toEqual({ tableRows: [], rowDetails: [] });
  });

  it('omits rowDetails when input has none', () => {
    expect(
      filterRowsByTab({
        tabId: 'APPROVED',
        tabDimensionKey: 'status_code',
        columnKeys,
        tableRows,
      }),
    ).toEqual({
      tableRows: [['r2', 'APPROVED', 1]],
    });
  });
});

describe('getSummaryTable', () => {
  it('returns summary headers and rows when present', () => {
    expect(
      getSummaryTable({
        summaryHeaders: ['Status', 'Qtd'],
        summaryRows: [['Pendente', 2], ['Aprovado', 1]],
      }),
    ).toEqual({
      headers: ['Status', 'Qtd'],
      rows: [['Pendente', 2], ['Aprovado', 1]],
    });
  });

  it('returns null when summary table is incomplete', () => {
    expect(getSummaryTable({})).toBeNull();
    expect(getSummaryTable({ summaryHeaders: ['Status'] })).toBeNull();
    expect(getSummaryTable({ summaryRows: [['x', 1]] })).toBeNull();
  });
});
