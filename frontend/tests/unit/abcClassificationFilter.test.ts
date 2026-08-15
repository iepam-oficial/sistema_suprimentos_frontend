import {
  abcBadgeColorScheme,
  abcBadgeLabel,
  formatAbcDisplay,
} from '@/features/catalog/abcClassification'
import { filterSupplies } from '@/app/(dashboard)/supplies/utils/filterUtils'
import type { Supply } from '@/app/(dashboard)/supplies/utils/types'

const makeSupply = (
  overrides: Partial<Supply> & Pick<Supply, 'id' | 'name'>
): Supply =>
  ({
    description: '',
    available_quantity: 10,
    minimum_quantity: 1,
    visible_to_requesters: true,
    abc_classification: null,
    category: { id: 'cat-a', value: 'cat-a', label: 'Categoria A' } as Supply['category'],
    ...overrides,
  }) as Supply

const supplies: Supply[] = [
  makeSupply({ id: '1', name: 'Item A', abc_classification: 'A' }),
  makeSupply({ id: '2', name: 'Item B', abc_classification: 'B' }),
  makeSupply({ id: '3', name: 'Item C', abc_classification: 'C' }),
  makeSupply({ id: '4', name: 'Sem classe', abc_classification: null }),
  makeSupply({ id: '5', name: 'Indefinido', abc_classification: undefined as unknown as null }),
]

describe('abcBadgeLabel', () => {
  it('returns labeled class for A/B/C', () => {
    expect(abcBadgeLabel('A')).toBe('Classe A')
    expect(abcBadgeLabel('B')).toBe('Classe B')
    expect(abcBadgeLabel('C')).toBe('Classe C')
  })

  it('returns null when classification is null or undefined', () => {
    expect(abcBadgeLabel(null)).toBeNull()
    expect(abcBadgeLabel(undefined)).toBeNull()
  })
})

describe('abcBadgeColorScheme', () => {
  it('maps A to orange/red highlight, B to yellow, C to gray', () => {
    expect(['orange', 'red']).toContain(abcBadgeColorScheme('A'))
    expect(abcBadgeColorScheme('B')).toBe('yellow')
    expect(abcBadgeColorScheme('C')).toBe('gray')
  })
})

describe('formatAbcDisplay', () => {
  it('returns em dash when unclassified', () => {
    expect(formatAbcDisplay(null)).toBe('—')
    expect(formatAbcDisplay(undefined)).toBe('—')
  })

  it('returns badge label when classified', () => {
    expect(formatAbcDisplay('A')).toBe('Classe A')
    expect(formatAbcDisplay('B')).toBe('Classe B')
    expect(formatAbcDisplay('C')).toBe('Classe C')
  })
})

describe('filterSupplies abc filter', () => {
  it('does not restrict by ABC when filter is empty', () => {
    expect(filterSupplies(supplies, '', '', '', '')).toHaveLength(5)
  })

  it('filters by class A/B/C', () => {
    expect(filterSupplies(supplies, '', '', '', 'A').map((s) => s.id)).toEqual(['1'])
    expect(filterSupplies(supplies, '', '', '', 'B').map((s) => s.id)).toEqual(['2'])
    expect(filterSupplies(supplies, '', '', '', 'C').map((s) => s.id)).toEqual(['3'])
  })

  it('filters UNCLASSIFIED as null/undefined abc_classification', () => {
    const result = filterSupplies(supplies, '', '', '', 'UNCLASSIFIED')
    expect(result.map((s) => s.id).sort()).toEqual(['4', '5'])
  })

  it('ANDs abc filter with search', () => {
    const mixed = [
      ...supplies,
      makeSupply({ id: '6', name: 'Papel Classe A', abc_classification: 'A' }),
    ]
    const result = filterSupplies(mixed, 'papel', '', '', 'A')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('6')
  })
})
