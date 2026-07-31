import type {
  ManagerOpsDashboardDTO,
  ManagerOpsFilters,
} from '@ti-assistant/contracts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição do dashboard operacional do gestor'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function buildDashboardQuery(filters: ManagerOpsFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.consumptionPeriod) params.set('consumptionPeriod', filters.consumptionPeriod);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.sectorId) params.set('sectorId', filters.sectorId);
  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.supplierId) params.set('supplierId', filters.supplierId);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchManagerOpsDashboard(
  token: string,
  filters: ManagerOpsFilters = {},
  options?: { polling?: boolean }
): Promise<ManagerOpsDashboardDTO> {
  const headers: HeadersInit = {
    ...authHeaders(token),
    ...(options?.polling === true ? { 'X-Polling': '1' } : {}),
  };
  const response = await fetch(`/api/manager-ops/dashboard${buildDashboardQuery(filters)}`, {
    headers,
  });
  return handleResponse<ManagerOpsDashboardDTO>(response);
}
