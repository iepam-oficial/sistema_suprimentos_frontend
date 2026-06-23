import type {
  ApprovePurchaseRequestInput,
  CatalogSearchResultDTO,
  CreatePurchaseRequestInput,
  ProcurementSettingsDTO,
  PurchaseRequestDTO,
  PurchaseRequestStatus,
  RejectPurchaseRequestInput,
  UpdateProcurementSettingsInput,
  UpdatePurchaseRequestInput,
} from '@ti-assistant/contracts';

export interface PurchaseRequestListFilters {
  status?: PurchaseRequestStatus;
  created_by_id?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseRequestListResult {
  items: PurchaseRequestDTO[];
  total: number;
  page: number;
  limit: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de solicitações de compra'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function jsonHeaders(token: string): HeadersInit {
  return {
    ...authHeaders(token),
    'Content-Type': 'application/json',
  };
}

function buildListQuery(filters: PurchaseRequestListFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);
  if (filters.created_by_id) params.set('created_by_id', filters.created_by_id);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchPurchaseRequests(
  token: string,
  filters: PurchaseRequestListFilters = {}
): Promise<PurchaseRequestListResult> {
  const response = await fetch(`/api/purchase-requests${buildListQuery(filters)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseRequestListResult>(response);
}

export async function fetchPurchaseRequestById(
  token: string,
  id: string
): Promise<PurchaseRequestDTO> {
  const response = await fetch(`/api/purchase-requests/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseRequestDTO>(response);
}

export async function createPurchaseRequest(
  token: string,
  input: CreatePurchaseRequestInput
): Promise<PurchaseRequestDTO> {
  const response = await fetch('/api/purchase-requests', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<PurchaseRequestDTO>(response);
}

export async function updatePurchaseRequest(
  token: string,
  id: string,
  input: UpdatePurchaseRequestInput
): Promise<PurchaseRequestDTO> {
  const response = await fetch(`/api/purchase-requests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<PurchaseRequestDTO>(response);
}

export async function submitPurchaseRequest(
  token: string,
  id: string
): Promise<PurchaseRequestDTO> {
  const response = await fetch(`/api/purchase-requests/${encodeURIComponent(id)}/submit`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseRequestDTO>(response);
}

export async function approvePurchaseRequest(
  token: string,
  id: string,
  input?: ApprovePurchaseRequestInput
): Promise<PurchaseRequestDTO> {
  const response = await fetch(`/api/purchase-requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input ?? {}),
  });
  return handleResponse<PurchaseRequestDTO>(response);
}

export async function rejectPurchaseRequest(
  token: string,
  id: string,
  input: RejectPurchaseRequestInput
): Promise<PurchaseRequestDTO> {
  const response = await fetch(`/api/purchase-requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<PurchaseRequestDTO>(response);
}

export async function fetchProcurementSettings(
  token: string
): Promise<ProcurementSettingsDTO> {
  const response = await fetch('/api/procurement/settings', {
    headers: authHeaders(token),
  });
  return handleResponse<ProcurementSettingsDTO>(response);
}

export async function updateProcurementSettings(
  token: string,
  input: UpdateProcurementSettingsInput
): Promise<ProcurementSettingsDTO> {
  const response = await fetch('/api/procurement/settings', {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<ProcurementSettingsDTO>(response);
}

export async function searchCatalog(
  token: string,
  query: string
): Promise<CatalogSearchResultDTO[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/procurement/catalog-search?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return handleResponse<CatalogSearchResultDTO[]>(response);
}
