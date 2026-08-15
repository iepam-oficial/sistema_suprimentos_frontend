export type ReportSlug = 'executive-summary' | 'inventory-overview' | 'supplies-stock' | 'consumption-by-sector' | 'purchases-by-batch' | 'service-orders' | 'alerts-by-level' | 'supply-requests';
export declare const VALID_REPORT_SLUGS: ReportSlug[];
export interface ReportFilters {
    timeRange?: string;
    locationId?: string;
    sectorId?: string;
    supplierId?: string;
    categoryId?: string;
    subcategoryId?: string;
    ncmIds?: string[];
    cestCodes?: string[];
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
export type ChartType = 'line' | 'area' | 'bar' | 'bar-horizontal' | 'pie' | 'donut';
export interface ReportDetailBlock {
    headers: string[];
    rows: (string | number)[][];
}
/** Valor de aba de dimensão (ex.: status PENDING → Pendente). */
export interface ReportTabValue {
    value: string;
    label: string;
}
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
    columnKeys?: string[];
    rowDetails?: (ReportDetailBlock | null)[];
    detailColumnKeys?: string[];
    detailHeaders?: string[];
    /** Headers/rows da aba Resumo (agregado). */
    summaryHeaders?: string[];
    summaryRows?: (string | number)[][];
    /** columnKey da dimensão das abas (ex.: status_code). */
    tabDimensionKey?: string;
    /** Abas de dimensão ordenadas. */
    tabValues?: ReportTabValue[];
}
export interface ConsumptionByDimension {
    label: string;
    count: number;
    value: number;
}
export interface ExecutiveDetailSection {
    id: string;
    label: string;
    tableHeaders: string[];
    tableRows: (string | number)[][];
    columnKeys?: string[];
    rowDetails?: (ReportDetailBlock | null)[];
    detailHeaders?: string[];
    detailColumnKeys?: string[];
}
export interface ExecutiveSummaryPayload {
    slug: 'executive-summary';
    title: string;
    kpis: ReportKpi[];
    serviceOrdersByMonth: {
        month: string;
        count: number;
    }[];
    inventoryByType: {
        type: string;
        count: number;
    }[];
    alertsByLevel: {
        level: string;
        count: number;
    }[];
    consumptionByPolo: ConsumptionByDimension[];
    consumptionByCategory: ConsumptionByDimension[];
    sections?: ExecutiveDetailSection[];
}
export interface FilterOptions {
    locations: {
        id: string;
        name: string;
    }[];
    sectors: {
        id: string;
        name: string;
        location_id?: string;
    }[];
    suppliers: {
        id: string;
        name: string;
    }[];
}
export type ReportResponse = ReportPayload | ExecutiveSummaryPayload | FilterOptions;
export declare function parseReportFilters(query: Record<string, unknown>): ReportFilters;
export declare function parseTimeRangeDays(timeRange: string): number;
export declare function dateRangeFromDays(days: number): {
    gte?: Date;
} | undefined;
//# sourceMappingURL=report.dto.d.ts.map