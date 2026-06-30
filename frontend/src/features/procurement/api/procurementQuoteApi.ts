import type {
  ApproveProcurementQuoteInput,
  CreateProcurementQuoteInput,
  ProcurementQuoteDTO,
  ProcurementQuoteStatus,
} from '@ti-assistant/contracts';

export interface ProcurementQuoteListFilters {
  status?: ProcurementQuoteStatus;
  purchase_request_id?: string;
  page?: number;
  limit?: number;
}

export interface ProcurementQuoteListResult {
  items: ProcurementQuoteDTO[];
  total: number;
  page: number;
  limit: number;
}

export type ProcurementQuoteEventType =
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'
  | 'PORTAL_ACCESSED'
  | 'PROPOSAL_SUBMITTED'
  | 'INVITE_DECLINED'
  | 'QUOTE_CLOSED'
  | 'QUOTE_APPROVED';

export interface ProcurementQuoteEventDTO {
  id: string;
  procurement_quote_id: string;
  invite_id: string | null;
  event_type: ProcurementQuoteEventType | string;
  metadata: unknown;
  created_at: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de cotações de compra'
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

function buildListQuery(filters: ProcurementQuoteListFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);
  if (filters.purchase_request_id) params.set('purchase_request_id', filters.purchase_request_id);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchProcurementQuotes(
  token: string,
  filters: ProcurementQuoteListFilters = {}
): Promise<ProcurementQuoteListResult> {
  const response = await fetch(`/api/procurement-quotes${buildListQuery(filters)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<ProcurementQuoteListResult>(response);
}

export async function fetchProcurementQuoteById(
  token: string,
  id: string
): Promise<ProcurementQuoteDTO> {
  const response = await fetch(`/api/procurement-quotes/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  return handleResponse<ProcurementQuoteDTO>(response);
}

export async function fetchProcurementQuoteEvents(
  token: string,
  quoteId: string
): Promise<ProcurementQuoteEventDTO[]> {
  const response = await fetch(
    `/api/procurement-quotes/${encodeURIComponent(quoteId)}/events`,
    {
      headers: authHeaders(token),
    }
  );
  return handleResponse<ProcurementQuoteEventDTO[]>(response);
}

export async function createProcurementQuote(
  token: string,
  input: CreateProcurementQuoteInput
): Promise<ProcurementQuoteDTO> {
  const response = await fetch('/api/procurement-quotes', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<ProcurementQuoteDTO>(response);
}

export async function sendProcurementQuote(
  token: string,
  id: string
): Promise<ProcurementQuoteDTO> {
  const response = await fetch(`/api/procurement-quotes/${encodeURIComponent(id)}/send`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<ProcurementQuoteDTO>(response);
}

export async function closeProcurementQuote(
  token: string,
  id: string
): Promise<ProcurementQuoteDTO> {
  const response = await fetch(`/api/procurement-quotes/${encodeURIComponent(id)}/close`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return handleResponse<ProcurementQuoteDTO>(response);
}

export async function approveProcurementQuote(
  token: string,
  id: string,
  input: ApproveProcurementQuoteInput
): Promise<ProcurementQuoteDTO> {
  const response = await fetch(`/api/procurement-quotes/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return handleResponse<ProcurementQuoteDTO>(response);
}
