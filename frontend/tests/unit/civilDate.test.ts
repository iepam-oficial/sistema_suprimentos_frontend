import {
  civilDateKeyFromIso,
  parseCivilDateOnlyToIso,
  todayLocalIsoDate,
} from '@/utils/civilDate'

describe('civilDate — todayLocalIsoDate', () => {
  it('retorna YYYY-MM-DD do dia civil local', () => {
    expect(todayLocalIsoDate(new Date(2026, 7, 12, 23, 30))).toBe('2026-08-12')
    expect(todayLocalIsoDate(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05')
  })

  it('usa a data atual quando nenhum instante é informado', () => {
    expect(todayLocalIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('civilDate — parseCivilDateOnlyToIso', () => {
  it('interpreta o date-only como início do dia civil em America/Sao_Paulo', () => {
    expect(parseCivilDateOnlyToIso('2026-08-12')).toBe('2026-08-12T03:00:00.000Z')
  })

  it('rejeita formatos fora de YYYY-MM-DD', () => {
    expect(() => parseCivilDateOnlyToIso('12/08/2026')).toThrow()
    expect(() => parseCivilDateOnlyToIso('2026-08-12T00:00:00Z')).toThrow()
    expect(() => parseCivilDateOnlyToIso('')).toThrow()
  })

  it('rejeita datas inexistentes', () => {
    expect(() => parseCivilDateOnlyToIso('2026-13-45')).toThrow()
  })
})

describe('civilDate — civilDateKeyFromIso', () => {
  it('faz round-trip com parseCivilDateOnlyToIso', () => {
    const iso = parseCivilDateOnlyToIso('2026-08-12')
    expect(civilDateKeyFromIso(iso)).toBe('2026-08-12')
  })

  it('mantém o dia civil de SP para instantes UTC do dia seguinte', () => {
    // 2026-08-13T02:59Z ainda é 12/08 em America/Sao_Paulo (-03:00)
    expect(civilDateKeyFromIso('2026-08-13T02:59:00.000Z')).toBe('2026-08-12')
    expect(civilDateKeyFromIso('2026-08-13T03:00:00.000Z')).toBe('2026-08-13')
  })

  it('rejeita instantes inválidos', () => {
    expect(() => civilDateKeyFromIso('não-é-data')).toThrow()
  })
})
