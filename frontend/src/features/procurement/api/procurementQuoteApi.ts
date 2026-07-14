import type {
  ApproveProcurementQuoteInput,
  CloseProcurementQuoteInput,
  CreateProcurementQuoteInput,
  ProcurementQuoteDTO,
  ProcurementQuoteProposalReviewDTO,
  ProcurementQuoteStatus,
  RequestProposalCorrectionInput,
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

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { error?: string; message?: string }).error ??
        (errData as { message?: string }).message ??
        'Erro na requisição de cotações de compra'
    );
  }
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
  filters: ProcurementQuoteListFilters = {},
  options?: { polling?: boolean }
): Promise<ProcurementQuoteListResult> {
  const headers: HeadersInit = {
    ...authHeaders(token),
    ...(options?.polling === true ? { 'X-Polling': '1' } : {}),
  };
  const response = await fetch(`/api/procurement-quotes${buildListQuery(filters)}`, {
    headers,
  });
  return handleResponse<ProcurementQuoteListResult>(response);
}

export async function fetchProcurementQuoteById(
  token: string,
  id: string,
  options?: { polling?: boolean }
): Promise<ProcurementQuoteDTO> {
  const headers: HeadersInit = {
    ...authHeaders(token),
    ...(options?.polling === true ? { 'X-Polling': '1' } : {}),
  };
  const response = await fetch(`/api/procurement-quotes/${encodeURIComponent(id)}`, {
    headers,
  });
  return handleResponse<ProcurementQuoteDTO>(response);
}

export async function fetchProcurementQuoteEvents(
  token: string,
  quoteId: string,
  options?: { polling?: boolean }
): Promise<ProcurementQuoteEventDTO[]> {
  const headers: HeadersInit = {
    ...authHeaders(token),
    ...(options?.polling === true ? { 'X-Polling': '1' } : {}),
  };
  const response = await fetch(
    `/api/procurement-quotes/${encodeURIComponent(quoteId)}/events`,
    {
      headers,
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

/**
 * Fornecedor pendente retornado no corpo do erro 409 de {@link closeProcurementQuote}.
 */
export interface CloseQuotePendingSupplier {
  invite_id: string;
  supplier_name: string;
  reason: string;
}

/**
 * Lançado por {@link closeProcurementQuote} quando o backend responde 409
 * (existem propostas sem "Revisão OK"). Expõe a lista `pending_suppliers`
 * extraída do JSON de erro para que a UI ofereça confirmação explícita e
 * reenvie o close com `confirm_exclude_pending: true`.
 */
export class CloseQuotePendingReviewError extends Error {
  readonly pending_suppliers: CloseQuotePendingSupplier[];

  constructor(message: string, pendingSuppliers: CloseQuotePendingSupplier[]) {
    super(message);
    this.name = 'CloseQuotePendingReviewError';
    this.pending_suppliers = pendingSuppliers;
  }
}

/**
 * Encerra a cotação e calcula o ranking.
 *
 * Em caso de 409 (propostas sem "Revisão OK" e `confirm_exclude_pending`
 * ausente/false), lança {@link CloseQuotePendingReviewError} contendo
 * `pending_suppliers`. O chamador deve capturar esse erro, exibir o modal de
 * confirmação e reenviar com `{ confirm_exclude_pending: true }`.
 */
export async function closeProcurementQuote(
  token: string,
  id: string,
  body?: CloseProcurementQuoteInput
): Promise<ProcurementQuoteDTO> {
  const response = await fetch(`/api/procurement-quotes/${encodeURIComponent(id)}/close`, {
    method: 'POST',
    headers: body ? jsonHeaders(token) : authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 409) {
    const errData = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      pending_suppliers?: CloseQuotePendingSupplier[];
    };
    throw new CloseQuotePendingReviewError(
      errData.error ?? errData.message ?? 'Existem propostas sem revisão OK',
      errData.pending_suppliers ?? []
    );
  }

  return handleResponse<ProcurementQuoteDTO>(response);
}

export async function markProposalReviewOk(
  token: string,
  quoteId: string,
  inviteId: string
): Promise<void> {
  const response = await fetch(
    `/api/procurement-quotes/${encodeURIComponent(quoteId)}/invites/${encodeURIComponent(
      inviteId
    )}/review-ok`,
    {
      method: 'POST',
      headers: authHeaders(token),
    }
  );
  await assertOk(response);
}

export async function requestProposalCorrection(
  token: string,
  quoteId: string,
  inviteId: string,
  payload: RequestProposalCorrectionInput
): Promise<void> {
  const response = await fetch(
    `/api/procurement-quotes/${encodeURIComponent(quoteId)}/invites/${encodeURIComponent(
      inviteId
    )}/request-correction`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  await assertOk(response);
}

export async function fetchProposalReviews(
  token: string,
  quoteId: string,
  inviteId: string
): Promise<ProcurementQuoteProposalReviewDTO[]> {
  const response = await fetch(
    `/api/procurement-quotes/${encodeURIComponent(quoteId)}/invites/${encodeURIComponent(
      inviteId
    )}/reviews`,
    {
      headers: authHeaders(token),
    }
  );
  return handleResponse<ProcurementQuoteProposalReviewDTO[]>(response);
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
