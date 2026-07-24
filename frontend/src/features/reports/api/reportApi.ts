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
  timeRange: string;
  locationId?: string;
  sectorId?: string;
  supplierId?: string;
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

export function buildFilterQueryString(filters: ReportFiltersQuery): string {
  const params = new URLSearchParams({ timeRange: filters.timeRange });
  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.sectorId) params.set('sectorId', filters.sectorId);
  if (filters.supplierId) params.set('supplierId', filters.supplierId);
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
  const qs = buildFilterQueryString(filters);
  const response = await fetch(`/api/reports/${slug}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ReportPayload | ExecutiveSummaryPayload>(response);
}
