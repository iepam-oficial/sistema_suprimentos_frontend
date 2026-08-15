import { reportExportFileName } from '@/features/reports/reportExportFileName'

describe('reportExportFileName', () => {
  it('monta {slug}-{YYYY-MM-DD}.xlsx com data local injetada', () => {
    expect(reportExportFileName('supplies-stock', 'xlsx', new Date(2026, 7, 15, 23, 30))).toBe(
      'supplies-stock-2026-08-15.xlsx',
    )
  })

  it('monta {slug}-{YYYY-MM-DD}.pdf com mês e dia zero-padded', () => {
    expect(reportExportFileName('executive', 'pdf', new Date(2026, 0, 5, 0, 0))).toBe(
      'executive-2026-01-05.pdf',
    )
  })

  it('usa a data atual quando now não é informado', () => {
    expect(reportExportFileName('supplies-stock', 'xlsx')).toMatch(
      /^supplies-stock-\d{4}-\d{2}-\d{2}\.xlsx$/,
    )
  })
})
