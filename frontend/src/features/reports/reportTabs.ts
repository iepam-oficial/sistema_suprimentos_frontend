import type {
  ReportDetailBlock,
  ReportPayload,
  ReportTabValue,
} from '@/features/reports/types';

export type ReportTabId = 'summary' | 'all' | string;

export type ReportTab = { id: ReportTabId; label: string };

const FIXED_TABS: ReportTab[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'all', label: 'Todas' },
];

/** Abas fixas (Resumo/Todas) + dimensões de `tabValues`. */
export function getReportTabs(
  payload: Pick<ReportPayload, 'tabValues'>,
): ReportTab[] {
  const values: ReportTabValue[] = payload.tabValues ?? [];
  return [
    ...FIXED_TABS,
    ...values.map((tab) => ({ id: tab.value, label: tab.label })),
  ];
}

/** Índice de `key` em `columnKeys`, ou -1 se ausente. */
export function columnKeyIndex(
  columnKeys: string[] | undefined,
  key: string,
): number {
  if (!columnKeys?.length) return -1;
  return columnKeys.indexOf(key);
}

type FilterRowsArgs = {
  tabId: ReportTabId;
  tabDimensionKey?: string;
  columnKeys?: string[];
  tableRows: (string | number)[][];
  rowDetails?: (ReportDetailBlock | null)[];
};

type FilterRowsResult = {
  tableRows: (string | number)[][];
  rowDetails?: (ReportDetailBlock | null)[];
};

function emptyResult(hasRowDetails: boolean): FilterRowsResult {
  return hasRowDetails
    ? { tableRows: [], rowDetails: [] }
    : { tableRows: [] };
}

/**
 * Filtra linhas da tabela de detalhe pela aba ativa.
 * - `summary`: não usa tableRows (caller usa summaryRows) → vazio
 * - `all`: retorna tudo
 * - dimensão: `row[idx] === tabId` onde idx = columnKeyIndex(tabDimensionKey)
 */
export function filterRowsByTab(args: FilterRowsArgs): FilterRowsResult {
  const { tabId, tabDimensionKey, columnKeys, tableRows, rowDetails } = args;
  const hasRowDetails = rowDetails !== undefined;

  if (tabId === 'summary') {
    return emptyResult(hasRowDetails);
  }

  if (tabId === 'all') {
    return hasRowDetails
      ? { tableRows, rowDetails }
      : { tableRows };
  }

  if (!tabDimensionKey) {
    return emptyResult(hasRowDetails);
  }

  const idx = columnKeyIndex(columnKeys, tabDimensionKey);
  if (idx < 0) {
    return emptyResult(hasRowDetails);
  }

  const keep: number[] = [];
  for (let i = 0; i < tableRows.length; i++) {
    if (String(tableRows[i][idx]) === String(tabId)) {
      keep.push(i);
    }
  }

  const filteredRows = keep.map((i) => tableRows[i]);
  if (!hasRowDetails) {
    return { tableRows: filteredRows };
  }

  return {
    tableRows: filteredRows,
    rowDetails: keep.map((i) => rowDetails![i] ?? null),
  };
}

/** Tabela agregada da aba Resumo, ou null se incompleta. */
export function getSummaryTable(
  payload: Pick<ReportPayload, 'summaryHeaders' | 'summaryRows'>,
): { headers: string[]; rows: (string | number)[][] } | null {
  const { summaryHeaders, summaryRows } = payload;
  if (!summaryHeaders?.length || !summaryRows) {
    return null;
  }
  return { headers: summaryHeaders, rows: summaryRows };
}
