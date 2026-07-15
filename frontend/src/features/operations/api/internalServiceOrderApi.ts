import type {
  CreateInternalServiceOrderInput,
  InternalServiceOrderDTO,
  UpdateInternalServiceOrderInput,
} from '../types';

export { RateLimitError } from './maintenanceScheduleApi';

import { RateLimitError } from './maintenanceScheduleApi';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro na requisição de ordens de serviço internas'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchInternalServiceOrders(
  token: string
): Promise<InternalServiceOrderDTO[]> {
  const response = await fetch('/api/internal-service-orders', {
    headers: authHeaders(token),
  });
  return handleResponse<InternalServiceOrderDTO[]>(response);
}

export async function fetchInternalServiceOrderById(
  token: string,
  id: string
): Promise<InternalServiceOrderDTO> {
  const response = await fetch(`/api/internal-service-orders/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse<InternalServiceOrderDTO>(response);
}

export async function createInternalServiceOrder(
  token: string,
  input: CreateInternalServiceOrderInput
): Promise<InternalServiceOrderDTO> {
  const response = await fetch('/api/internal-service-orders', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<InternalServiceOrderDTO>(response);
}

export async function updateInternalServiceOrder(
  token: string,
  id: string,
  input: UpdateInternalServiceOrderInput
): Promise<InternalServiceOrderDTO> {
  const response = await fetch(`/api/internal-service-orders/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<InternalServiceOrderDTO>(response);
}

export async function deleteInternalServiceOrder(
  token: string,
  id: string
): Promise<void> {
  const response = await fetch(`/api/internal-service-orders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<{ message: string }>(response);
}
