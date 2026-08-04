import { filterItems } from '@/app/(dashboard)/inventory/utils/filterUtils'
import type { InventoryItem } from '@/features/inventory/types'

const makeItem = (overrides: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>): InventoryItem =>
  ({
    item: '',
    model: 'Modelo X',
    serial_number: 'SN-001',
    finality: 'Uso interno',
    acquisition_price: 1000,
    freight: 0,
    residual_value: 0,
    depreciated_value: 0,
    service_life: 5,
    acquisition_date: '2024-01-01',
    location_id: 'loc-1',
    user_id: 'user-1',
    created_at: '2024-01-01',
    category_id: 'cat-a',
    subcategory_id: 'sub-a',
    status: 'AVAILABLE',
    location: { id: 'loc-1', name: 'Sede', address: 'Rua 1', branch: 'Matriz', user_id: 'user-1', created_at: '2024-01-01' },
    category: { id: 'cat-a', value: 'cat-a', label: 'Categoria A', created_at: '2024-01-01', updated_at: '2024-01-01' },
    subcategory: { id: 'sub-a', value: 'sub-a', label: 'Sub A', category_id: 'cat-a', created_at: '2024-01-01', updated_at: '2024-01-01' },
    ...overrides,
  }) as InventoryItem

const items: InventoryItem[] = [
  makeItem({ id: '1', name: 'Notebook Dell', model: 'Latitude 5420', serial_number: 'NB-001', internal_code: 'INV-001', category: { id: 'cat-a', value: 'informatica', label: 'Informática', created_at: '2024-01-01', updated_at: '2024-01-01' }, subcategory: { id: 'sub-a', value: 'notebook', label: 'Notebook', category_id: 'cat-a', created_at: '2024-01-01', updated_at: '2024-01-01' } }),
  makeItem({ id: '2', name: 'Monitor LG', model: '27UL500', serial_number: 'MON-002', internal_code: null, category: { id: 'cat-b', value: 'informatica', label: 'Informática', created_at: '2024-01-01', updated_at: '2024-01-01' }, subcategory: { id: 'sub-b', value: 'monitor', label: 'Monitor', category_id: 'cat-b', created_at: '2024-01-01', updated_at: '2024-01-01' } }),
  makeItem({ id: '3', name: 'Cadeira Ergonômica', model: 'FlexChair', serial_number: 'CAD-003', category: { id: 'cat-c', value: 'mobiliario', label: 'Mobiliário', created_at: '2024-01-01', updated_at: '2024-01-01' }, subcategory: { id: 'sub-c', value: 'cadeira', label: 'Cadeira', category_id: 'cat-c', created_at: '2024-01-01', updated_at: '2024-01-01' } }),
]

describe('filterItems', () => {
  it('returns empty array when items is not an array', () => {
    expect(filterItems(null as unknown as InventoryItem[], '', '', '')).toEqual([])
  })

  it('filters by search term on name, model and serial_number (case-insensitive)', () => {
    expect(filterItems(items, 'notebook', '', '')).toHaveLength(1)
    expect(filterItems(items, '27UL500', '', '')).toHaveLength(1)
    expect(filterItems(items, 'mon-002', '', '')).toHaveLength(1)
    expect(filterItems(items, 'xyz', '', '')).toHaveLength(0)
  })

  it('filters by search term on internal_code (case-insensitive)', () => {
    expect(filterItems(items, 'inv-001', '', '')).toHaveLength(1)
    expect(filterItems(items, 'INV-001', '', '')[0].name).toBe('Notebook Dell')
  })

  it('does not crash when internal_code is null or undefined', () => {
    expect(() => filterItems(items, 'monitor', '', '')).not.toThrow()
    expect(filterItems(items, 'monitor', '', '')).toHaveLength(1)
  })

  it('filters by category when selected', () => {
    expect(filterItems(items, '', 'cat-b', '')).toHaveLength(1)
    expect(filterItems(items, '', 'cat-a', '')).toHaveLength(1)
    expect(filterItems(items, '', '', '')).toHaveLength(3)
  })

  it('filters by subcategory when selected', () => {
    expect(filterItems(items, '', '', 'sub-c')).toHaveLength(1)
    expect(filterItems(items, '', '', 'sub-a')).toHaveLength(1)
    expect(filterItems(items, '', '', '')).toHaveLength(3)
  })

  it('combines search, category and subcategory with AND logic', () => {
    const result = filterItems(items, 'notebook', 'cat-a', 'sub-a')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Notebook Dell')
  })
})
