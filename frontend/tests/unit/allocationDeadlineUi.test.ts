import {
  ALLOCATION_MODAL_FIELD_ORDER,
  addDaysIsoDate,
  canSubmitAllocationDates,
  defaultDeliveryDeadlineIso,
  extendDeadlineMinIso,
  getOverdueBadgeKind,
  isAllocationConfirmEnabled,
  isDeliveryDeadlineInBounds,
  isReturnDateAllowed,
  matchesOverdueFilter,
  shouldBlockReturnDateChange,
  shouldClearReturnDateOnDeadlineChange,
  todayIsoDate,
  validateExtendDeadline,
} from '@/features/inventory/utils/allocationDeadlineUi'

describe('allocationDeadlineUi — modal (IADD-01..03, 07..09)', () => {
  const fixedNow = new Date('2026-08-07T15:00:00.000Z')
  const today = todayIsoDate(fixedNow)

  it('IADD-01: ordem dos campos Prazo → Devolução → Destino → Obs', () => {
    expect(ALLOCATION_MODAL_FIELD_ORDER).toEqual([
      'delivery_deadline',
      'return_date',
      'destination',
      'notes',
    ])
  })

  it('IADD-02: default de prazo é hoje civil + 7', () => {
    expect(defaultDeliveryDeadlineIso(fixedNow)).toBe(addDaysIsoDate(7, fixedNow))
    expect(defaultDeliveryDeadlineIso(fixedNow)).toBe('2026-08-14')
  })

  it('IADD-03: confirmação exige prazo (e devolução + destino)', () => {
    expect(
      isAllocationConfirmEnabled({
        deliveryDeadline: '',
        returnDate: '2026-08-20',
        destination: 'loc-1',
      })
    ).toBe(false)
    expect(
      isAllocationConfirmEnabled({
        deliveryDeadline: '2026-08-14',
        returnDate: '2026-08-20',
        destination: 'loc-1',
      })
    ).toBe(true)
  })

  it('IADD-07: prazo ≥ hoje e ≤ devolução', () => {
    expect(isDeliveryDeadlineInBounds('2026-08-07', today, '2026-08-20')).toBe(true)
    expect(isDeliveryDeadlineInBounds('2026-08-06', today, '2026-08-20')).toBe(false)
    expect(isDeliveryDeadlineInBounds('2026-08-21', today, '2026-08-20')).toBe(false)
    // sem devolução: só piso hoje
    expect(isDeliveryDeadlineInBounds('2026-08-10', today)).toBe(true)
  })

  it('IADD-08: prazo > devolução bloqueia submit', () => {
    expect(
      canSubmitAllocationDates({
        deliveryDeadline: '2026-08-21',
        returnDate: '2026-08-20',
        today,
      })
    ).toBe(false)
    expect(isReturnDateAllowed('2026-08-20', '2026-08-21')).toBe(false)
  })

  it('IADD-09: antecipar devolução abaixo do prazo é bloqueado', () => {
    expect(shouldBlockReturnDateChange('2026-08-10', '2026-08-14')).toBe(true)
    expect(shouldBlockReturnDateChange('2026-08-14', '2026-08-14')).toBe(false)
    expect(shouldBlockReturnDateChange('2026-08-20', '2026-08-14')).toBe(false)
  })

  it('edge: default hoje+7 > devolução escolhida depois exige ajuste', () => {
    const deadline = defaultDeliveryDeadlineIso(fixedNow) // 2026-08-14
    const earlyReturn = '2026-08-10'
    expect(shouldClearReturnDateOnDeadlineChange(deadline, earlyReturn)).toBe(true)
    expect(isReturnDateAllowed(earlyReturn, deadline)).toBe(false)
    expect(
      canSubmitAllocationDates({
        deliveryDeadline: deadline,
        returnDate: earlyReturn,
        today,
      })
    ).toBe(false)
  })
})

describe('allocationDeadlineUi — badge e filtro (IADD-12..17)', () => {
  it('IADD-14: is_overdue → badge atrasado', () => {
    expect(getOverdueBadgeKind({ is_overdue: true, was_ever_overdue: false })).toBe('atrasado')
    expect(getOverdueBadgeKind({ is_overdue: true, was_ever_overdue: true })).toBe('atrasado')
  })

  it('IADD-15: was_ever_overdue + não overdue → já_atrasou', () => {
    expect(getOverdueBadgeKind({ is_overdue: false, was_ever_overdue: true })).toBe('ja_atrasou')
  })

  it('IADD-16: sem overdue ativo → sem badge atrasado (null ou já_atrasou)', () => {
    expect(getOverdueBadgeKind({ is_overdue: false, was_ever_overdue: false })).toBeNull()
    // terminal / não atrasada: is_overdue false → nunca 'atrasado'
    expect(getOverdueBadgeKind({ is_overdue: false, was_ever_overdue: true })).not.toBe('atrasado')
  })

  it('IADD-12/13: listagens usam o mesmo kind a partir dos flags do DTO', () => {
    // coluna/card exibe prazo sempre; badge deriva só dos flags
    const overdue = getOverdueBadgeKind({ is_overdue: true, was_ever_overdue: true })
    const historical = getOverdueBadgeKind({ is_overdue: false, was_ever_overdue: true })
    expect(overdue).toBe('atrasado')
    expect(historical).toBe('ja_atrasou')
  })

  it('IADD-17: filtro atrasadas restringe a is_overdue', () => {
    const rows = [
      { id: '1', is_overdue: true },
      { id: '2', is_overdue: false },
      { id: '3', is_overdue: true },
    ]
    const filtered = rows.filter((r) => matchesOverdueFilter(r.is_overdue, true))
    expect(filtered.map((r) => r.id)).toEqual(['1', '3'])
    expect(rows.filter((r) => matchesOverdueFilter(r.is_overdue, false))).toHaveLength(3)
  })
})

describe('allocationDeadlineUi — prorrogação UI (IADD-21)', () => {
  const today = '2026-08-07'

  it('rejeita novo prazo ≤ atual, < hoje ou > devolução', () => {
    expect(
      validateExtendDeadline({
        newDeadline: '2026-08-05',
        currentDeadline: '2026-08-05',
        today,
        returnDate: '2026-08-20',
      }).ok
    ).toBe(false)

    expect(
      validateExtendDeadline({
        newDeadline: '2026-08-06',
        currentDeadline: '2026-08-05',
        today,
        returnDate: '2026-08-20',
      })
    ).toEqual({ ok: false, reason: 'before_today' })

    expect(
      validateExtendDeadline({
        newDeadline: '2026-08-21',
        currentDeadline: '2026-08-05',
        today,
        returnDate: '2026-08-20',
      })
    ).toEqual({ ok: false, reason: 'after_return' })
  })

  it('aceita novo prazo > atual, ≥ hoje e ≤ devolução', () => {
    expect(
      validateExtendDeadline({
        newDeadline: '2026-08-10',
        currentDeadline: '2026-08-05',
        today,
        returnDate: '2026-08-20',
      })
    ).toEqual({ ok: true })
  })

  it('min do picker é max(hoje, current+1)', () => {
    expect(extendDeadlineMinIso('2026-08-05', today)).toBe(today)
    expect(extendDeadlineMinIso('2026-08-10', today)).toBe('2026-08-11')
  })
})
