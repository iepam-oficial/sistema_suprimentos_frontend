import {
  isDottedHierarchicalInternalCode,
  normalizeInternalCodeForSearch,
} from '@/utils/internalCode'

describe('isDottedHierarchicalInternalCode', () => {
  it('returns true for dotted hierarchical codes', () => {
    expect(isDottedHierarchicalInternalCode('SUP.MAT.LIM.000001')).toBe(true)
  })

  it('returns false for legacy concatenated codes', () => {
    expect(isDottedHierarchicalInternalCode('SUPMATLIM000001')).toBe(false)
  })

  it('returns false for hyphenated legacy codes', () => {
    expect(isDottedHierarchicalInternalCode('SUP-000001')).toBe(false)
  })
})

describe('normalizeInternalCodeForSearch', () => {
  it('removes dot separators', () => {
    expect(normalizeInternalCodeForSearch('SUP.MAT.PAP.000001')).toBe(
      'SUPMATPAP000001',
    )
  })

  it('is stable when value has no dots', () => {
    expect(normalizeInternalCodeForSearch('SUPMATPAP000001')).toBe(
      'SUPMATPAP000001',
    )
  })
})
