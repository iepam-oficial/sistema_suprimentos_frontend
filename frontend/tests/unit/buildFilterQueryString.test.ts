import {
  buildFilterQueryString,
  isStockReportSlug,
} from '@/features/reports/api/reportApi'

describe('isStockReportSlug', () => {
  it('identifica slugs de estoque', () => {
    expect(isStockReportSlug('supplies-stock')).toBe(true)
    expect(isStockReportSlug('inventory-overview')).toBe(true)
  })

  it('retorna false para demais slugs', () => {
    expect(isStockReportSlug('executive-summary')).toBe(false)
    expect(isStockReportSlug('consumption-by-sector')).toBe(false)
  })
})

describe('buildFilterQueryString', () => {
  it('omite timeRange em slugs de estoque', () => {
    const qs = buildFilterQueryString(
      { timeRange: '30', categoryId: 'cat-1' },
      'supplies-stock'
    )
    expect(qs).not.toContain('timeRange')
    expect(qs).toContain('categoryId=cat-1')
  })

  it('omite timeRange em inventory-overview', () => {
    const qs = buildFilterQueryString({ timeRange: '90' }, 'inventory-overview')
    expect(qs).toBe('')
  })

  it('envia timeRange (default 30) para outros slugs', () => {
    expect(buildFilterQueryString({}, 'executive-summary')).toBe('?timeRange=30')
    expect(buildFilterQueryString({ timeRange: '90' }, 'alerts-by-level')).toBe(
      '?timeRange=90'
    )
  })

  it('serializa ncmIds e cestCodes como CSV', () => {
    const qs = buildFilterQueryString(
      {
        ncmIds: ['ncm-1', 'ncm-2'],
        cestCodes: ['01.001.00', '02.002.00'],
        subcategoryId: 'sub-1',
      },
      'supplies-stock'
    )
    const params = new URLSearchParams(qs.slice(1))
    expect(params.get('ncmIds')).toBe('ncm-1,ncm-2')
    expect(params.get('cestCodes')).toBe('01.001.00,02.002.00')
    expect(params.get('subcategoryId')).toBe('sub-1')
  })

  it('não anexa arrays vazios', () => {
    const qs = buildFilterQueryString(
      { ncmIds: [], cestCodes: [] },
      'supplies-stock'
    )
    expect(qs).toBe('')
  })
})
