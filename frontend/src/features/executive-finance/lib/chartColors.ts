/** Categorical palette shared by donut/treemap widgets (order matters for visual consistency). */
export const CATEGORICAL_PALETTE = [
  '#1D4ED8',
  '#0EA5E9',
  '#059669',
  '#D97706',
  '#DB2777',
  '#7C3AED',
  '#0891B2',
  '#65A30D',
  '#DC2626',
  '#4B5563',
];

export function colorForIndex(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}
