import type {
  CreateSupportTicketInput,
  SupportTicketDTO,
  UpdateSupportTicketInput,
} from '../types';

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
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string }).message || 'Erro na requisição de chamados'
    );
  }
  return response.json();
}

export interface FetchSupportTicketsFilters {
  status?: string;
  priority?: string;
}

export async function fetchSupportTickets(
  token: string,
  filters: FetchSupportTicketsFilters = {}
): Promise<SupportTicketDTO[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  const qs = params.toString();

  const response = await fetch(`/api/support-tickets${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse<SupportTicketDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchSupportTicketById(
  token: string,
  id: string
): Promise<SupportTicketDTO> {
  const response = await fetch(`/api/support-tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<SupportTicketDTO>(response);
}

export async function createSupportTicket(
  token: string,
  data: CreateSupportTicketInput
): Promise<SupportTicketDTO> {
  const response = await fetch('/api/support-tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<SupportTicketDTO>(response);
}

export async function updateSupportTicket(
  token: string,
  id: string,
  data: UpdateSupportTicketInput
): Promise<SupportTicketDTO> {
  const response = await fetch(`/api/support-tickets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<SupportTicketDTO>(response);
}

export async function deleteSupportTicket(
  token: string,
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`/api/support-tickets/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ message: string }>(response);
}
