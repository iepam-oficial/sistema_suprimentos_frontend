import { formatCnpjMask } from '@/utils/formatCnpjMask'

describe('formatCnpjMask', () => {
  it('returns empty string for empty input', () => {
    expect(formatCnpjMask('')).toBe('')
  })

  it('formats digits only progressively', () => {
    expect(formatCnpjMask('12')).toBe('12')
    expect(formatCnpjMask('12345')).toBe('12.345')
    expect(formatCnpjMask('12345678')).toBe('12.345.678')
    expect(formatCnpjMask('123456780001')).toBe('12.345.678/0001')
    expect(formatCnpjMask('12345678000190')).toBe('12.345.678/0001-90')
  })

  it('re-normalizes already formatted input', () => {
    expect(formatCnpjMask('12.345.678/0001-90')).toBe('12.345.678/0001-90')
    expect(formatCnpjMask('12.345.678/0001')).toBe('12.345.678/0001')
  })

  it('truncates input longer than 14 digits', () => {
    expect(formatCnpjMask('123456780001901234')).toBe('12.345.678/0001-90')
  })
})
