export function isDottedHierarchicalInternalCode(code: string): boolean {
  return /^[^.]+(\.[^.]+){3}$/.test(code)
}

export function normalizeInternalCodeForSearch(value: string): string {
  return value.replace(/\./g, '')
}
