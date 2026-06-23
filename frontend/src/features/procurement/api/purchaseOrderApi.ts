import type {
  CreatePurchaseOrderInput,
  PurchaseOrderDTO,
  PurchaseOrderListResult,
  PurchaseOrderStatus,
} from '@ti-assistant/contracts';

export interface PurchaseOrderListFilters {
  status?: PurchaseOrderStatus;
  page?: number;
  limit?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de pedidos de compra'
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

function buildListQuery(filters: PurchaseOrderListFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchPurchaseOrders(
  token: string,
  filters: PurchaseOrderListFilters = {}
): Promise<PurchaseOrderListResult> {
  const response = await fetch(`/api/purchase-orders${buildListQuery(filters)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseOrderListResult>(response);
}

export async function fetchPurchaseOrderById(
  token: string,
  id: string
): Promise<PurchaseOrderDTO> {
  const response = await fetch(`/api/purchase-orders/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseOrderDTO>(response);
}

export async function createPurchaseOrder(
  token: string,
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrderDTO> {
  const response = await fetch('/api/purchase-orders', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<PurchaseOrderDTO>(response);
}

export async function sendPurchaseOrder(
  token: string,
  id: string
): Promise<PurchaseOrderDTO> {
  const response = await fetch(`/api/purchase-orders/${encodeURIComponent(id)}/send`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseOrderDTO>(response);
}
