import type { AlertDTO, CreateAlertInput, UpdateAlertInput } from '../types';

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (response.status === 204) {
    return undefined as T;
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de alertas'
    );
  }
  return response.json();
}

export async function fetchAlerts(token: string): Promise<AlertDTO[]> {
  const response = await fetch('/api/alerts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<AlertDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchAlertById(token: string, id: string): Promise<AlertDTO> {
  const response = await fetch(`/api/alerts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AlertDTO>(response);
}

export async function fetchAlertsByInventory(
  token: string,
  inventoryId: string
): Promise<AlertDTO[]> {
  const response = await fetch(`/api/alerts/printer/${inventoryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<AlertDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function createAlert(
  token: string,
  data: CreateAlertInput
): Promise<AlertDTO> {
  const response = await fetch('/api/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<AlertDTO>(response);
}

export async function updateAlert(
  token: string,
  id: string,
  data: UpdateAlertInput
): Promise<AlertDTO> {
  const response = await fetch(`/api/alerts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<AlertDTO>(response);
}

export async function deleteAlert(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/alerts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<void>(response);
}
