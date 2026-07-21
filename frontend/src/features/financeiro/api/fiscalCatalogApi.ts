import type { FiscalNcmDTO } from '@ti-assistant/contracts';
import { RateLimitError } from './extraExpenseApi';

export interface FiscalNcmImportResult {
  versionId: string;
  created: number;
  updated: number;
  deactivated: number;
  skipped: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro ao buscar códigos fiscais',
    );
  }
  return response.json();
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export async function fetchFiscalNcms(options?: {
  active?: boolean;
}): Promise<FiscalNcmDTO[]> {
  const token = getToken();
  if (!token) return [];

  const params = new URLSearchParams();
  if (options?.active !== undefined) {
    params.set('active', String(options.active));
  }
  const qs = params.toString();
  const response = await fetch(`/api/fiscal-ncms${qs ? `?${qs}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<FiscalNcmDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function importFiscalNcms(
  payload: unknown | File,
): Promise<FiscalNcmImportResult> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const body =
    payload instanceof File
      ? JSON.parse(await payload.text())
      : payload;

  const response = await fetch('/api/fiscal-ncms/import', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return handleResponse<FiscalNcmImportResult>(response);
}
