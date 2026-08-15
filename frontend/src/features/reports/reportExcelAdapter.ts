import type { ExcelSheetInput } from '@/utils/exportToExcel'
import type { ExecutiveSummaryPayload, ReportPayload } from '@/features/reports/types'

type ConsumptionItem = {
  label: string
  count?: number
  quantity?: number
}

export type ExecutiveExcelInput = ExecutiveSummaryPayload & {
  consumptionByPolo?: ConsumptionItem[]
  consumptionByCategory?: ConsumptionItem[]
}

function consumptionValue(item: ConsumptionItem): number {
  return item.quantity ?? item.count ?? 0
}

export function toExcelSheetsFromReportPayload(
  data: ReportPayload,
  table: { headers: string[]; rows: (string | number)[][] },
): ExcelSheetInput[] {
  return [
    {
      name: data.slug,
      title: data.title,
      kpis: data.kpis.map((kpi) => ({ label: kpi.label, value: kpi.value })),
      head: table.headers,
      body: table.rows,
    },
  ]
}

export function toExcelSheetsFromExecutive(data: ExecutiveExcelInput): ExcelSheetInput[] {
  const sheets: ExcelSheetInput[] = [
    {
      name: 'KPIs',
      title: data.title,
      head: ['Indicador', 'Valor'],
      body: data.kpis.map((kpi) => [kpi.label, kpi.value]),
    },
    {
      name: 'OS por mês',
      title: data.title,
      head: ['Mês', 'Quantidade'],
      body: data.serviceOrdersByMonth.map((row) => [row.month, row.count]),
    },
    {
      name: 'Inventário tipo',
      title: data.title,
      head: ['Tipo', 'Quantidade'],
      body: data.inventoryByType.map((row) => [row.type, row.count]),
    },
    {
      name: 'Alertas',
      title: data.title,
      head: ['Nível', 'Quantidade'],
      body: data.alertsByLevel.map((row) => [row.level, row.count]),
    },
  ]

  const consumptionByPolo = data.consumptionByPolo ?? []
  if (consumptionByPolo.length > 0) {
    sheets.push({
      name: 'Consumo polo',
      title: data.title,
      head: ['Polo', 'Quantidade'],
      body: consumptionByPolo.map((item) => [item.label, consumptionValue(item)]),
    })
  }

  const consumptionByCategory = data.consumptionByCategory ?? []
  if (consumptionByCategory.length > 0) {
    sheets.push({
      name: 'Consumo categoria',
      title: data.title,
      head: ['Categoria', 'Quantidade'],
      body: consumptionByCategory.map((item) => [item.label, consumptionValue(item)]),
    })
  }

  return sheets
}
