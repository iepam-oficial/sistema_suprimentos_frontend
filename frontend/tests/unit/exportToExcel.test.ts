import {
  buildSheetAoa,
  exportToExcel,
  sanitizeSheetName,
} from '@/utils/exportToExcel'

describe('sanitizeSheetName', () => {
  it('remove caracteres inválidos \\ / ? * [ ]', () => {
    expect(sanitizeSheetName('A\\B/C?D*E[F]G')).toBe('ABCDEFG')
  })

  it('trunca nomes longos em 31 caracteres', () => {
    const long = 'abcdefghijklmnopqrstuvwxyz0123456789'
    expect(sanitizeSheetName(long)).toBe('abcdefghijklmnopqrstuvwxyz01234')
    expect(sanitizeSheetName(long).length).toBe(31)
  })

  it('desambigua com (2) quando o nome já está em used', () => {
    const used = new Set(['Relatorio'])
    expect(sanitizeSheetName('Relatorio', used)).toBe('Relatorio (2)')
  })

  it('incrementa sufixo até achar nome livre e atualiza used', () => {
    const used = new Set(['Aba', 'Aba (2)'])
    expect(sanitizeSheetName('Aba', used)).toBe('Aba (3)')
    expect(used.has('Aba (3)')).toBe(true)
  })
})

describe('buildSheetAoa', () => {
  it('monta título, KPIs, linha em branco, head e body', () => {
    const aoa = buildSheetAoa({
      name: 'Sheet1',
      title: 'Estoque',
      kpis: [
        { label: 'Total', value: 10 },
        { label: 'Status', value: 'OK' },
      ],
      head: ['Nome', 'Qtd'],
      body: [
        ['Parafuso', 5],
        ['Porca', 3],
      ],
    })

    expect(aoa).toEqual([
      ['Estoque'],
      ['Total', 10],
      ['Status', 'OK'],
      [''],
      ['Nome', 'Qtd'],
      ['Parafuso', 5],
      ['Porca', 3],
    ])
  })

  it('insere Sem dados após head quando body está vazio', () => {
    const aoa = buildSheetAoa({
      name: 'Vazio',
      title: 'Relatório',
      head: ['Col'],
      body: [],
    })

    expect(aoa).toEqual([['Relatório'], [''], ['Col'], ['Sem dados']])
  })

  it('não inclui linha em branco quando não há title nem kpis', () => {
    const aoa = buildSheetAoa({
      name: 'Simples',
      head: ['A', 'B'],
      body: [[1, 2]],
    })

    expect(aoa).toEqual([
      ['A', 'B'],
      [1, 2],
    ])
  })
})

describe('exportToExcel', () => {
  it('lança erro quando sheets está vazio', async () => {
    await expect(exportToExcel({ fileName: 'x.xlsx', sheets: [] })).rejects.toThrow()
  })
})
