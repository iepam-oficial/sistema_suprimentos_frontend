import { filterItems } from '@/app/(dashboard)/inventory/utils/filterUtils'
import { filterSupplies } from '@/app/(dashboard)/supplies/utils/filterUtils'
import type { InventoryItem } from '@/features/inventory/types'
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

const dottedSupply = makeSupply({
  id: 'dotted',
  name: 'Limpeza geral',
  description: 'Material de limpeza',
  internal_code: 'SUP.MAT.LIM.000001',
})

const dottedItem = makeItem({
  id: 'dotted',
  name: 'Item patrimonial',
  internal_code: 'SUP.MAT.LIM.000001',
})

describe('internal code search in filterSupplies', () => {
  const supplies = [
    dottedSupply,
    makeSupply({ id: 'other', name: 'Outro item', internal_code: 'SUP.MAT.PAP.000002' }),
  ]

  it('finds dotted code by normalized term without dots', () => {
    expect(filterSupplies(supplies, 'SUPMATLIM000001', '', '')).toHaveLength(1)
    expect(filterSupplies(supplies, 'SUPMATLIM000001', '', '')[0].id).toBe('dotted')
  })

  it('finds dotted code by partial dotted prefix', () => {
    expect(filterSupplies(supplies, 'SUP.MAT', '', '')).toHaveLength(2)
    expect(filterSupplies(supplies, 'SUP.MAT.LIM', '', '')).toHaveLength(1)
  })

  it('does not spuriously match all items by internal_code when search is only dots', () => {
    expect(filterSupplies(supplies, '.', '', '')).toHaveLength(0)
    expect(filterSupplies(supplies, '...', '', '')).toHaveLength(0)
  })

  it('still matches name and description without normalization', () => {
    expect(filterSupplies(supplies, 'limpeza', '', '')).toHaveLength(1)
    expect(filterSupplies(supplies, 'Material de limpeza', '', '')).toHaveLength(1)
  })
})

describe('internal code search in filterItems', () => {
  const items = [
    dottedItem,
    makeItem({ id: 'other', name: 'Outro patrimônio', internal_code: 'SUP.MAT.PAP.000002' }),
  ]

  it('finds dotted code by normalized term without dots', () => {
    expect(filterItems(items, 'SUPMATLIM000001', '', '')).toHaveLength(1)
    expect(filterItems(items, 'SUPMATLIM000001', '', '')[0].id).toBe('dotted')
  })

  it('finds dotted code by partial dotted prefix', () => {
    expect(filterItems(items, 'SUP.MAT', '', '')).toHaveLength(2)
    expect(filterItems(items, 'SUP.MAT.LIM', '', '')).toHaveLength(1)
  })

  it('does not spuriously match all items by internal_code when search is only dots', () => {
    expect(filterItems(items, '.', '', '')).toHaveLength(0)
    expect(filterItems(items, '...', '', '')).toHaveLength(0)
  })

  it('still matches name, model and serial_number without normalization', () => {
    expect(filterItems(items, 'patrimonial', '', '')).toHaveLength(1)
    expect(filterItems(items, 'Modelo X', '', '')).toHaveLength(2)
    expect(filterItems(items, 'SN-001', '', '')).toHaveLength(2)
  })
})
