import * as XLSX from 'xlsx'

export interface ExcelKpi {
  label: string
  value: string | number
}

export interface ExcelSheetInput {
  name: string
  title?: string
  kpis?: ExcelKpi[]
  head: string[]
  body: (string | number)[][]
}

export interface ExportToExcelOptions {
  fileName: string
  sheets: ExcelSheetInput[]
}

const INVALID_SHEET_CHARS = /[\\/?*[\]]/g
const MAX_SHEET_NAME = 31

export function sanitizeSheetName(name: string, used?: Set<string>): string {
  let base = name.replace(INVALID_SHEET_CHARS, '').slice(0, MAX_SHEET_NAME)
  if (!base) base = 'Sheet'

  let candidate = base
  let n = 2
  while (used?.has(candidate)) {
    const suffix = ` (${n})`
    candidate = `${base.slice(0, MAX_SHEET_NAME - suffix.length)}${suffix}`
    n += 1
  }

  used?.add(candidate)
  return candidate
}

export function buildSheetAoa(sheet: ExcelSheetInput): (string | number)[][] {
  const rows: (string | number)[][] = []
  const hasPreamble = Boolean(sheet.title) || Boolean(sheet.kpis?.length)

  if (sheet.title) {
    rows.push([sheet.title])
  }

  if (sheet.kpis?.length) {
    for (const kpi of sheet.kpis) {
      rows.push([kpi.label, kpi.value])
    }
  }

  if (hasPreamble) {
    rows.push([''])
  }

  rows.push([...sheet.head])

  if (sheet.body.length === 0) {
    rows.push(['Sem dados'])
  } else {
    for (const row of sheet.body) {
      rows.push([...row])
    }
  }

  return rows
}

function ensureXlsxExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
}

export async function exportToExcel(options: ExportToExcelOptions): Promise<void> {
  if (!options.sheets.length) {
    throw new Error('exportToExcel requires at least one sheet')
  }

  const workbook = XLSX.utils.book_new()
  const usedNames = new Set<string>()

  for (const sheet of options.sheets) {
    const aoa = buildSheetAoa(sheet)
    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const sheetName = sanitizeSheetName(sheet.name, usedNames)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  }

  const arrayBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = ensureXlsxExtension(options.fileName)
  link.click()
  URL.revokeObjectURL(url)
}
