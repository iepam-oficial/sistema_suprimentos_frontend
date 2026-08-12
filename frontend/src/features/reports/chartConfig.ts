import type { ChartRow, ChartType, ReportSlug } from './types';

const COMPOSITION_SLUGS: ReportSlug[] = [
  'alerts-by-level',
  'supply-requests',
];

const HORIZONTAL_SLUGS: ReportSlug[] = [
  'inventory-overview',
  'supplies-stock',
  'consumption-by-sector',
  'purchases-by-batch',
];

const TOP_N_CHART = 10;

export function isCompositionSlug(slug: ReportSlug): boolean {
  return COMPOSITION_SLUGS.includes(slug);
}

export function resolveChartType(
  slug: ReportSlug,
  backendType: ChartType,
  chartData: ChartRow[]
): ChartType {
  const count = chartData.length;

  if (count > 8) {
    if (backendType === 'line' || backendType === 'area') return backendType;
    return 'bar-horizontal';
  }

  if (count <= 6 && isCompositionSlug(slug)) {
    return 'donut';
  }

  if (HORIZONTAL_SLUGS.includes(slug) && count > 6) {
    return 'bar-horizontal';
  }

  return backendType;
}

export function prepareChartDataForDisplay(
  chartData: ChartRow[],
  chartType: ChartType,
  dataKey: 'count' | 'value' = 'count'
): { displayData: ChartRow[]; truncated: boolean; totalHidden: number } {
  const sorted = [...chartData].sort(
    (a, b) => (b[dataKey] ?? b.count) - (a[dataKey] ?? a.count)
  );

  const needsTopN =
    (chartType === 'bar-horizontal' || chartType === 'bar') && sorted.length > TOP_N_CHART;

  if (!needsTopN) {
    return { displayData: sorted, truncated: false, totalHidden: 0 };
  }

  const top = sorted.slice(0, TOP_N_CHART);
  const rest = sorted.slice(TOP_N_CHART);
  const othersSum = rest.reduce((s, r) => s + (r[dataKey] ?? r.count), 0);

  return {
    displayData: [
      ...top,
      { label: 'Outros', count: othersSum, value: othersSum },
    ],
    truncated: true,
    totalHidden: rest.length,
  };
}

export function getExecutiveChartType(
  section:
    | 'service-orders'
    | 'inventory'
    | 'alerts'
    | 'consumption-polo'
    | 'consumption-category',
  dataLength: number
): ChartType {
  if (section === 'service-orders') return 'area';
  if (section === 'alerts') return 'donut';
  if (dataLength <= 6) return 'donut';
  return 'bar-horizontal';
}

export const CHART_PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

export const ALERT_COLOR_MAP: Record<string, string> = {
  crítico: '#DC2626',
  critico: '#DC2626',
  alto: '#EA580C',
  médio: '#CA8A04',
  medio: '#CA8A04',
  baixo: '#16A34A',
};

export function getSliceColor(label: string, index: number, colorByLabel?: boolean): string {
  if (colorByLabel) {
    const l = label.toLowerCase();
    for (const [key, color] of Object.entries(ALERT_COLOR_MAP)) {
      if (l.includes(key)) return color;
    }
  }
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Default chart height when `height` prop is omitted (donut/pie shorter than bars/area/line). */
export function getDefaultChartHeight(
  type: ChartType,
  rowCount = 0
): number {
  if (type === 'donut' || type === 'pie') return 220;
  if (type === 'bar-horizontal') return Math.max(280, rowCount * 36);
  return 280;
}
