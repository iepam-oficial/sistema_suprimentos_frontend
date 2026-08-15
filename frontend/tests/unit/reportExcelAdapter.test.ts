import {
  toExcelSheetsFromExecutive,
  toExcelSheetsFromReportPayload,
} from '@/features/reports/reportExcelAdapter'
import type { ExecutiveSummaryPayload, ReportPayload } from '@/features/reports/types'

const simplePayload: ReportPayload = {
  slug: 'supplies-stock',
  title: 'Estoque de suprimentos',
  description: 'Itens em estoque',
  kpis: [
    { label: 'Total', value: 10 },
    { label: 'Críticos', value: 2 },
  ],
  chartData: [],
  tableHeaders: ['Nome', 'Saldo'],
  tableRows: [
    ['Parafuso', 5],
    ['Porca', 3],
  ],
  chartType: 'bar',
}

const executiveBase: ExecutiveSummaryPayload = {
  slug: 'executive-summary',
  title: 'Resumo executivo',
  kpis: [
    { label: 'OS abertas', value: 12 },
    { label: 'Alertas', value: 3 },
  ],
  serviceOrdersByMonth: [
    { month: '2026-01', count: 4 },
    { month: '2026-02', count: 8 },
  ],
  inventoryByType: [
    { type: 'Notebook', count: 20 },
    { type: 'Monitor', count: 15 },
  ],
  alertsByLevel: [
    { level: 'Alto', count: 2 },
    { level: 'Baixo', count: 1 },
  ],
  consumptionByPolo: [],
  consumptionByCategory: [],
}

describe('toExcelSheetsFromReportPayload', () => {
  it('produz uma sheet com title, kpis e tabela resolvida', () => {
    const sheets = toExcelSheetsFromReportPayload(simplePayload, {
      headers: ['Nome', 'Saldo'],
      rows: [
        ['Parafuso', 5],
        ['Porca', 3],
      ],
    })

    expect(sheets).toHaveLength(1)
    expect(sheets[0]).toEqual({
      name: 'supplies-stock',
      title: 'Estoque de suprimentos',
      kpis: [
        { label: 'Total', value: 10 },
        { label: 'Críticos', value: 2 },
      ],
      head: ['Nome', 'Saldo'],
      body: [
        ['Parafuso', 5],
        ['Porca', 3],
      ],
    })
  })

  it('usa a tabela passada (não tableHeaders/tableRows do payload)', () => {
    const sheets = toExcelSheetsFromReportPayload(simplePayload, {
      headers: ['A'],
      rows: [['x']],
    })

    expect(sheets[0].head).toEqual(['A'])
    expect(sheets[0].body).toEqual([['x']])
  })
})

describe('toExcelSheetsFromExecutive', () => {
  it('produz abas fixas KPIs, OS, inventário e alertas', () => {
    const sheets = toExcelSheetsFromExecutive(executiveBase)

    expect(sheets.map((s) => s.name)).toEqual([
      'KPIs',
      'OS por mês',
      'Inventário tipo',
      'Alertas',
    ])

    expect(sheets[0]).toMatchObject({
      name: 'KPIs',
      title: 'Resumo executivo',
      head: ['Indicador', 'Valor'],
      body: [
        ['OS abertas', 12],
        ['Alertas', 3],
      ],
    })

    expect(sheets[1]).toMatchObject({
      name: 'OS por mês',
      head: ['Mês', 'Quantidade'],
      body: [
        ['2026-01', 4],
        ['2026-02', 8],
      ],
    })

    expect(sheets[2]).toMatchObject({
      name: 'Inventário tipo',
      head: ['Tipo', 'Quantidade'],
      body: [
        ['Notebook', 20],
        ['Monitor', 15],
      ],
    })

    expect(sheets[3]).toMatchObject({
      name: 'Alertas',
      head: ['Nível', 'Quantidade'],
      body: [
        ['Alto', 2],
        ['Baixo', 1],
      ],
    })
  })

  it('inclui consumo por polo/categoria só quando há dados e prioriza quantity', () => {
    const sheets = toExcelSheetsFromExecutive({
      ...executiveBase,
      consumptionByPolo: [
        { label: 'Norte', quantity: 100 },
        { label: 'Sul', count: 50 },
      ],
      consumptionByCategory: [{ label: 'TI', quantity: 7, count: 99 }],
    })

    expect(sheets.map((s) => s.name)).toEqual([
      'KPIs',
      'OS por mês',
      'Inventário tipo',
      'Alertas',
      'Consumo polo',
      'Consumo categoria',
    ])

    expect(sheets[4]).toMatchObject({
      name: 'Consumo polo',
      head: ['Polo', 'Quantidade'],
      body: [
        ['Norte', 100],
        ['Sul', 50],
      ],
    })

    expect(sheets[5]).toMatchObject({
      name: 'Consumo categoria',
      head: ['Categoria', 'Quantidade'],
      body: [['TI', 7]],
    })
  })

  it('omite abas de consumo quando arrays estão vazios', () => {
    const sheets = toExcelSheetsFromExecutive({
      ...executiveBase,
      consumptionByPolo: [],
      consumptionByCategory: [],
    })

    expect(sheets.some((s) => s.name.startsWith('Consumo'))).toBe(false)
  })
})
