import type { SupplyRequest } from '../types';

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export async function fetchAllSupplyRequests(token: string): Promise<SupplyRequest[]> {
  const response = await fetch('/api/supply-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    throw new RateLimitError();
  }

  if (!response.ok) {
    throw new Error('Erro ao carregar requisições');
  }

  return response.json();
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: 'APPROVED' | 'REJECTED',
  token: string
) {
  const response = await fetch(`/api/supply-requests/${requestId}`, {
    method: 'PUT',
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
  token: string
) {
  const response = await fetch(
    `/api/supply-requests/${requestId}/manager-delivery-confirmation`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmation }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error || 'Erro ao confirmar entrega'
    );
  }

  return response.json();
}
