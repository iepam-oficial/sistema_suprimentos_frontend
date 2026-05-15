export type ReportSlug =
  | 'executive-summary'
  | 'inventory-overview'
  | 'supplies-stock'
  | 'consumption-by-sector'
  | 'purchases-by-batch'
  | 'service-orders'
  | 'alerts-by-level'
  | 'supply-requests'
  | 'quotes-by-status';

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

export interface TableRow {
  [key: string]: string | number;
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

export interface ExecutiveSummaryPayload {
  slug: 'executive-summary';
  title: string;
  kpis: ReportKpi[];
  serviceOrdersByMonth: { month: string; count: number }[];
  inventoryByType: { type: string; count: number }[];
  alertsByLevel: { level: string; count: number }[];
}

export interface FilterOptions {
  locations: { id: string; name: string }[];
  sectors: { id: string; name: string; location_id?: string }[];
  suppliers: { id: string; name: string }[];
}

export type ReportResponse = ReportPayload | ExecutiveSummaryPayload | FilterOptions;
