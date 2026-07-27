import { filterSupplies } from '@/app/(dashboard)/supplies/utils/filterUtils'
import type { Supply } from '@/app/(dashboard)/supplies/utils/types'

const makeSupply = (overrides: Partial<Supply> & Pick<Supply, 'id' | 'name'>): Supply =>
  ({
    description: '',
    available_quantity: 10,
    minimum_quantity: 1,
    visible_to_requesters: true,
    category: { id: 'cat-a', value: 'cat-a', label: 'Categoria A' } as Supply['category'],
    ...overrides,
  }) as Supply

const supplies: Supply[] = [
  makeSupply({ id: '1', name: 'Papel A4', description: 'Resma branca', internal_code: 'MAT-001', visible_to_requesters: true, category: { id: 'cat-a', value: 'papel', label: 'Papel' } as Supply['category'] }),
  makeSupply({ id: '2', name: 'Caneta Azul', description: 'Tinta permanente', internal_code: null, visible_to_requesters: false, category: { id: 'cat-b', value: 'escrita', label: 'Escrita' } as Supply['category'] }),
  makeSupply({ id: '3', name: 'Grampeador', description: 'Metal resistente', visible_to_requesters: true, category: { id: 'cat-b', value: 'escrita', label: 'Escrita' } as Supply['category'] }),
]

describe('filterSupplies', () => {
  it('returns empty array when supplies is not an array', () => {
    expect(filterSupplies(null as unknown as Supply[], '', '', '')).toEqual([])
  })

  it('filters by search term on name and description (case-insensitive)', () => {
    expect(filterSupplies(supplies, 'papel', '', '')).toHaveLength(1)
    expect(filterSupplies(supplies, 'METAL', '', '')).toHaveLength(1)
    expect(filterSupplies(supplies, 'xyz', '', '')).toHaveLength(0)
  })

  it('filters by search term on internal_code (case-insensitive)', () => {
    expect(filterSupplies(supplies, 'mat-001', '', '')).toHaveLength(1)
    expect(filterSupplies(supplies, 'MAT-001', '', '')[0].name).toBe('Papel A4')
  })

  it('does not crash when internal_code is null or undefined', () => {
    expect(() => filterSupplies(supplies, 'caneta', '', '')).not.toThrow()
    expect(filterSupplies(supplies, 'caneta', '', '')).toHaveLength(1)
  })

  it('filters by category when selected', () => {
    expect(filterSupplies(supplies, '', 'cat-b', '')).toHaveLength(2)
    expect(filterSupplies(supplies, '', 'cat-a', '')).toHaveLength(1)
    expect(filterSupplies(supplies, '', '', '')).toHaveLength(3)
  })

  it('does not restrict by visibility when visibility is empty', () => {
    expect(filterSupplies(supplies, '', '', '')).toHaveLength(3)
  })

  it('filters visible supplies when visibility is "visible"', () => {
    const result = filterSupplies(supplies, '', '', 'visible')
    expect(result).toHaveLength(2)
    expect(result.every((s) => s.visible_to_requesters === true)).toBe(true)
  })

  it('filters hidden supplies when visibility is "hidden"', () => {
    const result = filterSupplies(supplies, '', '', 'hidden')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Caneta Azul')
  })

  it('combines search, category and visibility with AND logic', () => {
    const result = filterSupplies(supplies, 'grampeador', 'cat-b', 'visible')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Grampeador')
  })
})
