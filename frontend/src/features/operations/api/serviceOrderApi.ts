import type {
  CloseServiceOrderInput,
  CreateServiceOrderInput,
  ServiceOrderDTO,
  UpdateServiceOrderInput,
} from '../types';

export { RateLimitError } from './maintenanceScheduleApi';

import { RateLimitError } from './maintenanceScheduleApi';

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
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro na requisição de ordens de serviço'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchServiceOrders(token: string): Promise<ServiceOrderDTO[]> {
  const response = await fetch('/api/orders', {
    headers: authHeaders(token),
  });
  return handleResponse<ServiceOrderDTO[]>(response);
}

export async function fetchServiceOrderById(
  token: string,
  id: string
): Promise<ServiceOrderDTO> {
  const response = await fetch(`/api/orders/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse<ServiceOrderDTO>(response);
}

export async function createServiceOrder(
  token: string,
  input: CreateServiceOrderInput
): Promise<ServiceOrderDTO> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ServiceOrderDTO>(response);
}

export async function updateServiceOrder(
  token: string,
  id: string,
  input: UpdateServiceOrderInput
): Promise<ServiceOrderDTO> {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ServiceOrderDTO>(response);
}

export async function deleteServiceOrder(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response);
}

export async function closeServiceOrder(
  token: string,
  id: string,
  input: CloseServiceOrderInput
): Promise<ServiceOrderDTO> {
  const response = await fetch(`/api/orders/${id}/close`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ServiceOrderDTO>(response);
}

export async function uploadServiceOrderPdf(
  token: string,
  id: string,
  file: Blob
): Promise<ServiceOrderDTO> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/orders/${id}/pdf`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  return handleResponse<ServiceOrderDTO>(response);
}
