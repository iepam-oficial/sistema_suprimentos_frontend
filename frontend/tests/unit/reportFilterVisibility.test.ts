import {
  buildFilterQueryString,
  isDetailEnrichedSlug,
} from '@/features/reports/api/reportApi'
import {
  getFilterFieldVisibility,
  toReportFiltersQuery,
  type ReportFiltersState,
} from '@/features/reports/reportFilterVisibility'

const FULL_FILTERS: ReportFiltersState = {
  timeRange: '90',
  locationId: 'loc-1',
  sectorId: 'sec-1',
  supplierId: 'sup-1',
  categoryId: 'cat-1',
  subcategoryId: 'sub-1',
  ncmIds: ['ncm-1'],
  cestCodes: ['01.001.00'],
}

describe('isDetailEnrichedSlug', () => {
  it('identifica slugs enriquecidos', () => {
    expect(isDetailEnrichedSlug('supply-requests')).toBe(true)
    expect(isDetailEnrichedSlug('consumption-by-sector')).toBe(true)
    expect(isDetailEnrichedSlug('purchases-by-batch')).toBe(true)
    expect(isDetailEnrichedSlug('service-orders')).toBe(true)
    expect(isDetailEnrichedSlug('alerts-by-level')).toBe(true)
    expect(isDetailEnrichedSlug('executive-summary')).toBe(true)
  })

  it('retorna false para slugs de estoque', () => {
    expect(isDetailEnrichedSlug('supplies-stock')).toBe(false)
    expect(isDetailEnrichedSlug('inventory-overview')).toBe(false)
  })
})

describe('getFilterFieldVisibility', () => {
  it('mantém comportamento de estoque em supplies-stock', () => {
    expect(getFilterFieldVisibility('supplies-stock')).toEqual({
      period: false,
      location: false,
      sector: false,
      supplier: true,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('mantém comportamento de estoque em inventory-overview', () => {
    expect(getFilterFieldVisibility('inventory-overview')).toEqual({
      period: false,
      location: true,
      sector: true,
      supplier: true,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('supply-requests: período/local/setor + catálogo; sem fornecedor', () => {
    expect(getFilterFieldVisibility('supply-requests')).toEqual({
      period: true,
      location: true,
      sector: true,
      supplier: false,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('consumption-by-sector: período/local/setor + catálogo; sem fornecedor', () => {
    expect(getFilterFieldVisibility('consumption-by-sector')).toEqual({
      period: true,
      location: true,
      sector: true,
      supplier: false,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('purchases-by-batch: período/fornecedor + catálogo; sem local/setor', () => {
    expect(getFilterFieldVisibility('purchases-by-batch')).toEqual({
      period: true,
      location: false,
      sector: false,
      supplier: true,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('service-orders: período/fornecedor + catálogo; sem local/setor', () => {
    expect(getFilterFieldVisibility('service-orders')).toEqual({
      period: true,
      location: false,
      sector: false,
      supplier: true,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('alerts-by-level: sem período; local/setor + catálogo; sem fornecedor', () => {
    expect(getFilterFieldVisibility('alerts-by-level')).toEqual({
      period: false,
      location: true,
      sector: true,
      supplier: false,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })

  it('executive-summary: todos os campos visíveis', () => {
    expect(getFilterFieldVisibility('executive-summary')).toEqual({
      period: true,
      location: true,
      sector: true,
      supplier: true,
      category: true,
      subcategory: true,
      ncm: true,
      cest: true,
    })
  })
})

describe('toReportFiltersQuery + buildFilterQueryString (enriched)', () => {
  it('envia catálogo/NCM/CEST para slug enriquecido', () => {
    const q = toReportFiltersQuery('supply-requests', FULL_FILTERS)
    expect(q.categoryId).toBe('cat-1')
    expect(q.subcategoryId).toBe('sub-1')
    expect(q.ncmIds).toEqual(['ncm-1'])
    expect(q.cestCodes).toEqual(['01.001.00'])
    expect(q.supplierId).toBeUndefined()

    const qs = buildFilterQueryString(q, 'supply-requests')
    expect(qs).toContain('categoryId=cat-1')
    expect(qs).toContain('ncmIds=ncm-1')
    expect(qs).toContain('cestCodes=01.001.00')
    expect(qs).toContain('timeRange=90')
  })

  it('omite timeRange em alerts-by-level', () => {
    const q = toReportFiltersQuery('alerts-by-level', FULL_FILTERS)
    expect(q.timeRange).toBeUndefined()

    const qs = buildFilterQueryString(q, 'alerts-by-level')
    expect(qs).not.toContain('timeRange')
    expect(qs).toContain('locationId=loc-1')
  })

  it('omite local/setor em purchases-by-batch na query', () => {
    const q = toReportFiltersQuery('purchases-by-batch', FULL_FILTERS)
    expect(q.locationId).toBeUndefined()
    expect(q.sectorId).toBeUndefined()
    expect(q.supplierId).toBe('sup-1')
    expect(q.timeRange).toBe('90')
  })
})
