import type { SupplyRequest } from '../types';

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export async function fetchAllSupplyRequests(token: string): Promise<SupplyRequest[]> {
  const regularResponse = await fetch('/api/supply-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (regularResponse.status === 429) {
    throw new RateLimitError();
  }

  if (!regularResponse.ok) {
    throw new Error('Erro ao carregar requisições regulares');
  }

  const regularData = await regularResponse.json();

  const customResponse = await fetch('/api/custom-supply-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!customResponse.ok) {
    throw new Error('Erro ao carregar requisições customizadas');
  }

  const customData = await customResponse.json();

  return [
    ...regularData,
    ...customData.map((request: Record<string, unknown>) => ({
      ...request,
      is_custom: true,
    })),
  ];
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: 'APPROVED' | 'REJECTED',
  isCustom: boolean,
  token: string
) {
  const endpoint = isCustom
    ? `/api/custom-supply-requests/${requestId}/status`
    : `/api/supply-requests/${requestId}`;

  const response = await fetch(endpoint, {
    method: isCustom ? 'PATCH' : 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar requisição');
  }

  return response.json();
}

export async function updateManagerDeliveryConfirmation(
  requestId: string,
  confirmation: boolean,
  isCustom: boolean,
  token: string
) {
  const endpoint = isCustom
    ? `/api/custom-supply-requests/${requestId}/manager-delivery-confirmation`
    : `/api/supply-requests/${requestId}/manager-delivery-confirmation`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ confirmation }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error || 'Erro ao confirmar entrega'
    );
  }

  return response.json();
}
