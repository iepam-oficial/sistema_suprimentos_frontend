import type { AbcClass } from '@ti-assistant/contracts'

export type AbcFilterValue = '' | AbcClass | 'UNCLASSIFIED'

export function abcBadgeLabel(classification: AbcClass | null | undefined): string | null {
  if (classification == null) return null
  return `Classe ${classification}`
}

/** Chakra colorScheme: A highlighted, B intermediate, C neutral. */
export function abcBadgeColorScheme(classification: AbcClass): string {
  switch (classification) {
    case 'A':
      return 'orange'
    case 'B':
      return 'yellow'
    case 'C':
      return 'gray'
  }
}

export function formatAbcDisplay(classification: AbcClass | null | undefined): string {
  return abcBadgeLabel(classification) ?? '—'
}

export function matchesAbcFilter(
  classification: AbcClass | null | undefined,
  filter: AbcFilterValue
): boolean {
  if (filter === '') return true
  if (filter === 'UNCLASSIFIED') return classification == null
  return classification === filter
}
