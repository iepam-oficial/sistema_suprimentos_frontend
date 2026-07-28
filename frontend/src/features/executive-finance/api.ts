import type {
  ExecutiveFinanceDashboardDTO,
  ExecutiveFinanceFilters,
} from '@ti-assistant/contracts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição do dashboard executivo financeiro'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function buildDashboardQuery(filters: ExecutiveFinanceFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.companyLocationId) params.set('companyLocationId', filters.companyLocationId);
  if (filters.chartOfAccountId) params.set('chartOfAccountId', filters.chartOfAccountId);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.sectorId) params.set('sectorId', filters.sectorId);
  if (filters.supplierId) params.set('supplierId', filters.supplierId);
  if (filters.poloMetric) params.set('poloMetric', filters.poloMetric);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchExecutiveFinanceDashboard(
  token: string,
  filters: ExecutiveFinanceFilters = {},
  options?: { polling?: boolean }
): Promise<ExecutiveFinanceDashboardDTO> {
  const headers: HeadersInit = {
    ...authHeaders(token),
    ...(options?.polling === true ? { 'X-Polling': '1' } : {}),
  };
  const response = await fetch(`/api/executive-finance/dashboard${buildDashboardQuery(filters)}`, {
    headers,
  });
  return handleResponse<ExecutiveFinanceDashboardDTO>(response);
}
