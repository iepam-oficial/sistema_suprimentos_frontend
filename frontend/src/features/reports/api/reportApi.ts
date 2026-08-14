import type {
  ExecutiveSummaryPayload,
  FilterOptions,
  ReportPayload,
  ReportSlug,
} from '../types';

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export interface ReportFiltersQuery {
  timeRange?: string;
  locationId?: string;
  sectorId?: string;
  supplierId?: string;
  categoryId?: string;
  subcategoryId?: string;
  ncmIds?: string[];
  cestCodes?: string[];
}

const STOCK_REPORT_SLUGS: ReadonlySet<ReportSlug> = new Set([
  'supplies-stock',
  'inventory-overview',
]);

export function isStockReportSlug(slug: ReportSlug): boolean {
  return STOCK_REPORT_SLUGS.has(slug);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de relatórios'
    );
  }
  return response.json();
}

export function buildFilterQueryString(
  filters: ReportFiltersQuery,
  slug?: ReportSlug
): string {
  const params = new URLSearchParams();

  if (!slug || !isStockReportSlug(slug)) {
    params.set('timeRange', filters.timeRange ?? '30');
  }

  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.sectorId) params.set('sectorId', filters.sectorId);
  if (filters.supplierId) params.set('supplierId', filters.supplierId);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.subcategoryId) params.set('subcategoryId', filters.subcategoryId);
  if (filters.ncmIds?.length) params.set('ncmIds', filters.ncmIds.join(','));
  if (filters.cestCodes?.length) {
    params.set('cestCodes', filters.cestCodes.join(','));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchReportFilters(token: string): Promise<FilterOptions> {
  const response = await fetch('/api/reports/filters', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<FilterOptions>(response);
}

export async function fetchReport(
  token: string,
  slug: ReportSlug,
  filters: ReportFiltersQuery
): Promise<ReportPayload | ExecutiveSummaryPayload> {
  const qs = buildFilterQueryString(filters, slug);
  const response = await fetch(`/api/reports/${slug}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ReportPayload | ExecutiveSummaryPayload>(response);
}
