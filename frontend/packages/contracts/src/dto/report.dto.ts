export type ReportSlug =
  | 'executive-summary'
  | 'inventory-overview'
  | 'supplies-stock'
  | 'consumption-by-sector'
  | 'purchases-by-batch'
  | 'service-orders'
  | 'alerts-by-level'
  | 'supply-requests';

export const VALID_REPORT_SLUGS: ReportSlug[] = [
  'executive-summary',
  'inventory-overview',
  'supplies-stock',
  'consumption-by-sector',
  'purchases-by-batch',
  'service-orders',
  'alerts-by-level',
  'supply-requests',
];

export interface ReportFilters {
  timeRange: string;
  locationId?: string;
  sectorId?: string;
  supplierId?: string;
  categoryId?: string;
}

export interface ChartRow {
  label: string;
  count: number;
  value?: number;
}

export interface ReportKpi {
  label: string;
  value: string | number;
}

export type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'bar-horizontal'
  | 'pie'
  | 'donut';

export interface ReportPayload {
  slug: ReportSlug;
  title: string;
  description: string;
  kpis: ReportKpi[];
  chartData: ChartRow[];
  chartLabelKey?: 'label' | 'month';
  chartValueKey?: 'count' | 'value';
  tableHeaders: string[];
  tableRows: (string | number)[][];
  chartType: ChartType;
}

export interface ConsumptionByDimension {
  label: string;
  count: number;
  value: number;
}

export interface ExecutiveSummaryPayload {
  slug: 'executive-summary';
  title: string;
  kpis: ReportKpi[];
  serviceOrdersByMonth: { month: string; count: number }[];
  inventoryByType: { type: string; count: number }[];
  alertsByLevel: { level: string; count: number }[];
  consumptionByPolo: ConsumptionByDimension[];
  consumptionByCategory: ConsumptionByDimension[];
}

export interface FilterOptions {
  locations: { id: string; name: string }[];
  sectors: { id: string; name: string; location_id?: string }[];
  suppliers: { id: string; name: string }[];
}

export type ReportResponse = ReportPayload | ExecutiveSummaryPayload | FilterOptions;

export function parseReportFilters(query: Record<string, unknown>): ReportFilters {
  return {
    timeRange: String(query.timeRange ?? '30'),
    locationId: query.locationId ? String(query.locationId) : undefined,
    sectorId: query.sectorId ? String(query.sectorId) : undefined,
    supplierId: query.supplierId ? String(query.supplierId) : undefined,
    categoryId: query.categoryId ? String(query.categoryId) : undefined,
  };
}

export function parseTimeRangeDays(timeRange: string): number {
  const n = parseInt(timeRange, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function dateRangeFromDays(days: number): { gte?: Date } | undefined {
  if (days <= 0) return undefined;
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { gte: start };
}
