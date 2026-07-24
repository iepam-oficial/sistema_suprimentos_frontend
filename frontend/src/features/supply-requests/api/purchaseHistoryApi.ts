import type {
  BestSupplierSummaryDTO,
  CreatePurchaseInput,
  PurchaseDTO,
} from '@ti-assistant/contracts';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de histórico de compras'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchPurchaseHistory(token: string): Promise<PurchaseDTO[]> {
  const response = await fetch('/api/purchase-history', {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseDTO[]>(response);
}

export async function fetchPurchaseById(token: string, id: string): Promise<PurchaseDTO> {
  const response = await fetch(`/api/purchase-history/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseDTO>(response);
}

export async function createPurchase(
  token: string,
  input: CreatePurchaseInput
): Promise<PurchaseDTO> {
  const response = await fetch('/api/purchase-history', {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleResponse<PurchaseDTO>(response);
}

export async function fetchPurchasesByItem(
  token: string,
  itemId: string,
  itemType: string
): Promise<PurchaseDTO[]> {
  const response = await fetch(
    `/api/purchase-history/item/${encodeURIComponent(itemId)}/${encodeURIComponent(itemType)}`,
    { headers: authHeaders(token) }
  );
  return handleResponse<PurchaseDTO[]>(response);
}

export async function fetchPurchasesBySupplier(
  token: string,
  supplierId: string
): Promise<PurchaseDTO[]> {
  const response = await fetch(`/api/purchase-history/supplier/${encodeURIComponent(supplierId)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<PurchaseDTO[]>(response);
}

export async function fetchBestSuppliers(
  token: string,
  itemId: string,
  itemType: string
): Promise<BestSupplierSummaryDTO[]> {
  const response = await fetch(
    `/api/purchase-history/best-suppliers/${encodeURIComponent(itemId)}/${encodeURIComponent(itemType)}`,
    { headers: authHeaders(token) }
  );
  return handleResponse<BestSupplierSummaryDTO[]>(response);
}
