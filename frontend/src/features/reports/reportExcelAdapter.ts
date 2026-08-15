import type { ExcelSheetInput } from '@/utils/exportToExcel'
import { sanitizeSheetName } from '@/utils/exportToExcel'
import {
  defaultColumnSelection,
  filterTableByKeys,
  flattenSupplyExport,
} from '@/features/reports/columnSelection'
import {
  filterRowsByTab,
  getReportTabs,
  getSummaryTable,
} from '@/features/reports/reportTabs'
import type {
  ExecutiveDetailSection,
  ExecutiveSummaryPayload,
  ReportPayload,
} from '@/features/reports/types'

const EXECUTIVE_SECTION_SHEET_NAMES: Record<string, string> = {
  operations: 'Operações detalhe',
  consumption: 'Consumo detalhe',
  alerts: 'Alertas detalhe',
}

type ConsumptionItem = {
  label: string
  count?: number
  quantity?: number
}

export type ExecutiveExcelInput = ExecutiveSummaryPayload & {
  consumptionByPolo?: ConsumptionItem[]
  consumptionByCategory?: ConsumptionItem[]
}

export type TabbedExcelOptions = {
  columnSelection?: Record<string, boolean>
  detailHeaders?: string[]
  detailRows?: (string | number)[][]
}

function consumptionValue(item: ConsumptionItem): number {
  return item.quantity ?? item.count ?? 0
}

function sheetKpis(data: ReportPayload): ExcelSheetInput['kpis'] {
  return data.kpis.map((kpi) => ({ label: kpi.label, value: kpi.value }))
}

function applyColumnSelection(
  headers: string[],
  rows: (string | number)[][],
  columnKeys: string[] | undefined,
  selection: Record<string, boolean> | undefined,
): { headers: string[]; rows: (string | number)[][] } {
  if (!columnKeys?.length || !selection) {
    return { headers, rows }
  }
  return filterTableByKeys(headers, columnKeys, rows, selection)
}

function buildDetailsTable(
  data: ReportPayload,
  options?: TabbedExcelOptions,
): { headers: string[]; rows: (string | number)[][] } | null {
  if (options?.detailHeaders && options.detailRows) {
    return { headers: options.detailHeaders, rows: options.detailRows }
  }

  if (!data.rowDetails) {
    return null
  }

  const columnKeys = data.columnKeys
  const detailColumnKeys = data.detailColumnKeys ?? []
  const orderedKeys = [...(columnKeys ?? []), ...detailColumnKeys]
  const selection =
    options?.columnSelection ??
    (orderedKeys.length > 0 ? defaultColumnSelection(orderedKeys) : undefined)

  if (columnKeys?.length && selection) {
    return flattenSupplyExport(
      columnKeys,
      data.tableHeaders,
      data.tableRows,
      detailColumnKeys,
      data.detailHeaders ?? [],
      data.rowDetails,
      selection,
    )
  }

  const detailHeaders =
    data.detailHeaders ??
    data.rowDetails.find((block) => block)?.headers ??
    []
  const emptyDetail = detailHeaders.map(() => '' as string | number)
  const rows: (string | number)[][] = []

  data.tableRows.forEach((summaryRow, index) => {
    const detail = data.rowDetails![index]
    const detailRows = detail?.rows?.length ? detail.rows : null
    if (!detailRows) {
      rows.push([...summaryRow, ...emptyDetail])
      return
    }
    for (const detailRow of detailRows) {
      rows.push([...summaryRow, ...detailRow])
    }
  })

  return {
    headers: [...data.tableHeaders, ...detailHeaders],
    rows,
  }
}

export function toExcelSheetsFromReportPayload(
  data: ReportPayload,
  table: { headers: string[]; rows: (string | number)[][] },
): ExcelSheetInput[] {
  return [
    {
      name: data.slug,
      title: data.title,
      kpis: sheetKpis(data),
      head: table.headers,
      body: table.rows,
    },
  ]
}

/**
 * Multi-sheet Excel for tabbed reports: Resumo, Todas, each tabValues label, Detalhes.
 * Sheet names are sanitized to Excel's ≤31 char limit.
 */
export function toExcelSheetsFromTabbedReport(
  data: ReportPayload,
  table: { headers: string[]; rows: (string | number)[][] },
  options?: TabbedExcelOptions,
): ExcelSheetInput[] {
  const usedNames = new Set<string>()
  const name = (raw: string) => sanitizeSheetName(raw, usedNames)
  const sheets: ExcelSheetInput[] = []

  const summary = getSummaryTable(data)
  sheets.push({
    name: name('Resumo'),
    title: data.title,
    kpis: sheetKpis(data),
    head: summary?.headers ?? [],
    body: summary?.rows ?? [],
  })

  sheets.push({
    name: name('Todas'),
    title: data.title,
    head: table.headers,
    body: table.rows,
  })

  const tabs = getReportTabs(data)
  for (const tab of tabs) {
    if (tab.id === 'summary' || tab.id === 'all') continue

    const filtered = filterRowsByTab({
      tabId: tab.id,
      tabDimensionKey: data.tabDimensionKey,
      columnKeys: data.columnKeys,
      tableRows: data.tableRows,
      rowDetails: data.rowDetails,
    })
    const selected = applyColumnSelection(
      data.tableHeaders,
      filtered.tableRows,
      data.columnKeys,
      options?.columnSelection,
    )

    sheets.push({
      name: name(tab.label),
      title: data.title,
      head: selected.headers,
      body: selected.rows,
    })
  }

  const details = buildDetailsTable(data, options)
  if (details) {
    sheets.push({
      name: name('Detalhes'),
      title: data.title,
      head: details.headers,
      body: details.rows,
    })
  }

  return sheets
}

function buildExecutiveSectionDetailsTable(
  section: ExecutiveDetailSection,
): { headers: string[]; rows: (string | number)[][] } | null {
  if (!section.rowDetails) {
    return null
  }

  return buildDetailsTable({
    slug: 'executive-summary',
    title: section.label,
    description: '',
    kpis: [],
    chartData: [],
    chartType: 'bar',
    tableHeaders: section.tableHeaders,
    tableRows: section.tableRows,
    columnKeys: section.columnKeys,
    rowDetails: section.rowDetails,
    detailHeaders: section.detailHeaders,
    detailColumnKeys: section.detailColumnKeys,
  })
}

export function toExcelSheetsFromExecutive(data: ExecutiveExcelInput): ExcelSheetInput[] {
  const usedNames = new Set<string>()
  const name = (raw: string) => sanitizeSheetName(raw, usedNames)

  const sheets: ExcelSheetInput[] = [
    {
      name: name('KPIs'),
      title: data.title,
      head: ['Indicador', 'Valor'],
      body: data.kpis.map((kpi) => [kpi.label, kpi.value]),
    },
    {
      name: name('OS por mês'),
      title: data.title,
      head: ['Mês', 'Quantidade'],
      body: data.serviceOrdersByMonth.map((row) => [row.month, row.count]),
    },
    {
      name: name('Inventário tipo'),
      title: data.title,
      head: ['Tipo', 'Quantidade'],
      body: data.inventoryByType.map((row) => [row.type, row.count]),
    },
    {
      name: name('Alertas'),
      title: data.title,
      head: ['Nível', 'Quantidade'],
      body: data.alertsByLevel.map((row) => [row.level, row.count]),
    },
  ]

  const consumptionByPolo = data.consumptionByPolo ?? []
  if (consumptionByPolo.length > 0) {
    sheets.push({
      name: name('Consumo polo'),
      title: data.title,
      head: ['Polo', 'Quantidade'],
      body: consumptionByPolo.map((item) => [item.label, consumptionValue(item)]),
    })
  }

  const consumptionByCategory = data.consumptionByCategory ?? []
  if (consumptionByCategory.length > 0) {
    sheets.push({
      name: name('Consumo categoria'),
      title: data.title,
      head: ['Categoria', 'Quantidade'],
      body: consumptionByCategory.map((item) => [item.label, consumptionValue(item)]),
    })
  }

  for (const section of data.sections ?? []) {
    const detailSheetName =
      EXECUTIVE_SECTION_SHEET_NAMES[section.id] ?? `${section.label} detalhe`
    sheets.push({
      name: name(detailSheetName),
      title: data.title,
      head: section.tableHeaders,
      body: section.tableRows,
    })

    const details = buildExecutiveSectionDetailsTable(section)
    if (details) {
      sheets.push({
        name: name('Detalhes'),
        title: data.title,
        head: details.headers,
        body: details.rows,
      })
    }
  }

  return sheets
}
