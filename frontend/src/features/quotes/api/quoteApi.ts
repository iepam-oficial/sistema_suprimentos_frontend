import type {
  CreateQuoteInput,
  QuoteDTO,
  SmartQuoteDTO,
  UpdateQuoteInput,
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
      (errData as { message?: string; error?: string }).message ??
        (errData as { error?: string }).error ??
        'Erro na requisição de cotações',
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export interface FetchQuotesFilters {
  status?: string;
  created_by?: string;
  supplier_id?: string;
}

export async function fetchQuotes(
  token: string,
  filters: FetchQuotesFilters = {},
): Promise<QuoteDTO[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.created_by) params.set('created_by', filters.created_by);
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id);
  const qs = params.toString();

  const response = await fetch(`/api/quotes${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse<QuoteDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchQuoteById(token: string, id: string): Promise<QuoteDTO> {
  const response = await fetch(`/api/quotes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<QuoteDTO>(response);
}

export async function fetchSmartQuotes(token: string): Promise<SmartQuoteDTO[]> {
  const response = await fetch('/api/quotes/smart', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<SmartQuoteDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function createQuote(token: string, input: CreateQuoteInput): Promise<QuoteDTO> {
  const response = await fetch('/api/quotes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleResponse<QuoteDTO>(response);
}

export async function updateQuote(
  token: string,
  id: string,
  input: UpdateQuoteInput,
): Promise<QuoteDTO> {
  const response = await fetch(`/api/quotes/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleResponse<QuoteDTO>(response);
}

export async function deleteQuote(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/quotes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await handleResponse<void>(response);
}

export async function approveQuote(token: string, id: string): Promise<QuoteDTO> {
  const response = await fetch(`/api/quotes/${id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<QuoteDTO>(response);
}

export async function rejectQuote(token: string, id: string): Promise<QuoteDTO> {
  const response = await fetch(`/api/quotes/${id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<QuoteDTO>(response);
}

export async function cancelQuote(token: string, id: string): Promise<QuoteDTO> {
  const response = await fetch(`/api/quotes/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<QuoteDTO>(response);
}
