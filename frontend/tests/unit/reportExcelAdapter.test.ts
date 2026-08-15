import {
  toExcelSheetsFromExecutive,
  toExcelSheetsFromReportPayload,
  toExcelSheetsFromTabbedReport,
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

  it('append sheets de detalhe por sections e Detalhes quando há rowDetails', () => {
    const sheets = toExcelSheetsFromExecutive({
      ...executiveBase,
      sections: [
        {
          id: 'operations',
          label: 'Operações',
          tableHeaders: ['OS', 'Status'],
          tableRows: [
            ['OS-1', 'OPEN'],
            ['OS-2', 'DONE'],
          ],
          detailHeaders: ['Item'],
          detailColumnKeys: ['item'],
          rowDetails: [
            { headers: ['Item'], rows: [['Notebook']] },
            null,
          ],
        },
        {
          id: 'consumption',
          label: 'Consumo',
          tableHeaders: ['Produto', 'Qtd'],
          tableRows: [['Parafuso', 3]],
        },
        {
          id: 'alerts',
          label: 'Alertas',
          tableHeaders: ['Nível', 'Msg'],
          tableRows: [['Alto', 'Estoque baixo']],
          rowDetails: [
            { headers: ['Local'], rows: [['Norte']] },
          ],
        },
      ],
    })

    expect(sheets.map((s) => s.name)).toEqual([
      'KPIs',
      'OS por mês',
      'Inventário tipo',
      'Alertas',
      'Operações detalhe',
      'Detalhes',
      'Consumo detalhe',
      'Alertas detalhe',
      'Detalhes (2)',
    ])

    expect(sheets.find((s) => s.name === 'Operações detalhe')).toMatchObject({
      head: ['OS', 'Status'],
      body: [
        ['OS-1', 'OPEN'],
        ['OS-2', 'DONE'],
      ],
    })

    expect(sheets.find((s) => s.name === 'Detalhes')).toMatchObject({
      head: ['OS', 'Status', 'Item'],
      body: [
        ['OS-1', 'OPEN', 'Notebook'],
        ['OS-2', 'DONE', ''],
      ],
    })

    expect(sheets.find((s) => s.name === 'Consumo detalhe')).toMatchObject({
      head: ['Produto', 'Qtd'],
      body: [['Parafuso', 3]],
    })

    expect(sheets.find((s) => s.name === 'Alertas detalhe')).toMatchObject({
      head: ['Nível', 'Msg'],
      body: [['Alto', 'Estoque baixo']],
    })
  })

  it('não adiciona sheets de detalhe quando sections é omitido', () => {
    const sheets = toExcelSheetsFromExecutive(executiveBase)

    expect(sheets.map((s) => s.name)).toEqual([
      'KPIs',
      'OS por mês',
      'Inventário tipo',
      'Alertas',
    ])
  })
})

const tabbedPayload: ReportPayload = {
  slug: 'supply-requests',
  title: 'Requisições',
  description: 'Por status',
  kpis: [{ label: 'Total', value: 4 }],
  chartData: [],
  tableHeaders: ['ID', 'Status', 'Qtd'],
  tableRows: [
    ['r1', 'PENDING', 2],
    ['r2', 'APPROVED', 1],
    ['r3', 'PENDING', 5],
  ],
  chartType: 'bar',
  columnKeys: ['id', 'status_code', 'qty'],
  tabDimensionKey: 'status_code',
  tabValues: [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'APPROVED', label: 'Aprovado' },
  ],
  summaryHeaders: ['Status', 'Qtd'],
  summaryRows: [
    ['Pendente', 2],
    ['Aprovado', 1],
  ],
  detailHeaders: ['Item'],
  detailColumnKeys: ['item'],
  rowDetails: [
    { headers: ['Item'], rows: [['Parafuso']] },
    null,
    { headers: ['Item'], rows: [['Porca'], ['Arruela']] },
  ],
}

const tabbedMainTable = {
  headers: ['ID', 'Status', 'Qtd'],
  rows: [
    ['r1', 'PENDING', 2],
    ['r2', 'APPROVED', 1],
    ['r3', 'PENDING', 5],
  ] as (string | number)[][],
}

describe('toExcelSheetsFromTabbedReport', () => {
  it('produz Resumo + Todas + uma sheet por tabValue + Detalhes', () => {
    const sheets = toExcelSheetsFromTabbedReport(tabbedPayload, tabbedMainTable)

    expect(sheets).toHaveLength(5)
    expect(sheets.map((s) => s.name)).toEqual([
      'Resumo',
      'Todas',
      'Pendente',
      'Aprovado',
      'Detalhes',
    ])

    expect(sheets[0]).toMatchObject({
      name: 'Resumo',
      title: 'Requisições',
      kpis: [{ label: 'Total', value: 4 }],
      head: ['Status', 'Qtd'],
      body: [
        ['Pendente', 2],
        ['Aprovado', 1],
      ],
    })

    expect(sheets[1]).toMatchObject({
      name: 'Todas',
      head: tabbedMainTable.headers,
      body: tabbedMainTable.rows,
    })

    expect(sheets[2]).toMatchObject({
      name: 'Pendente',
      body: [
        ['r1', 'PENDING', 2],
        ['r3', 'PENDING', 5],
      ],
    })

    expect(sheets[3]).toMatchObject({
      name: 'Aprovado',
      body: [['r2', 'APPROVED', 1]],
    })
  })

  it('inclui planilha Detalhes com flatten row↔rowDetails', () => {
    const sheets = toExcelSheetsFromTabbedReport(tabbedPayload, tabbedMainTable)
    const detalhes = sheets.find((s) => s.name === 'Detalhes')

    expect(detalhes).toBeDefined()
    expect(detalhes).toMatchObject({
      name: 'Detalhes',
      title: 'Requisições',
      head: ['ID', 'Status', 'Qtd', 'Item'],
      body: [
        ['r1', 'PENDING', 2, 'Parafuso'],
        ['r2', 'APPROVED', 1, ''],
        ['r3', 'PENDING', 5, 'Porca'],
        ['r3', 'PENDING', 5, 'Arruela'],
      ],
    })

    const withoutDetails = toExcelSheetsFromTabbedReport(
      { ...tabbedPayload, rowDetails: undefined, detailColumnKeys: undefined, detailHeaders: undefined },
      tabbedMainTable,
    )
    expect(withoutDetails.map((s) => s.name)).toEqual([
      'Resumo',
      'Todas',
      'Pendente',
      'Aprovado',
    ])
  })

  it('sanitiza nomes de aba para no máximo 31 caracteres', () => {
    const longLabel =
      'Status muito longo que ultrapassa o limite de trinta e um caracteres do Excel'
    const sheets = toExcelSheetsFromTabbedReport(
      {
        ...tabbedPayload,
        tabValues: [{ value: 'PENDING', label: longLabel }],
        rowDetails: undefined,
        detailColumnKeys: undefined,
        detailHeaders: undefined,
      },
      tabbedMainTable,
    )

    expect(sheets.map((s) => s.name)).toEqual([
      'Resumo',
      'Todas',
      longLabel.slice(0, 31),
    ])
    for (const sheet of sheets) {
      expect(sheet.name.length).toBeLessThanOrEqual(31)
    }
  })
})
