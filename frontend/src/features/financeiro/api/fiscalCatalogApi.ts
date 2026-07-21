import type {
  CreateFiscalNcmInput,
  FiscalNcmDTO,
  UpdateFiscalNcmInput,
} from '@ti-assistant/contracts';
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
  q?: string;
}): Promise<FiscalNcmDTO[]> {
  const token = getToken();
  if (!token) return [];

  const params = new URLSearchParams();
  if (options?.active !== undefined) {
    params.set('active', String(options.active));
  }
  if (options?.q?.trim()) {
    params.set('q', options.q.trim());
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

export async function fetchFiscalNcmById(id: string): Promise<FiscalNcmDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch(`/api/fiscal-ncms/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<FiscalNcmDTO>(response);
}

export async function createFiscalNcm(
  data: CreateFiscalNcmInput,
): Promise<FiscalNcmDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/api/fiscal-ncms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<FiscalNcmDTO>(response);
}

export async function updateFiscalNcm(
  id: string,
  data: UpdateFiscalNcmInput,
): Promise<FiscalNcmDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch(`/api/fiscal-ncms/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<FiscalNcmDTO>(response);
}

export async function setFiscalNcmActive(
  id: string,
  active: boolean,
): Promise<FiscalNcmDTO> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch(`/api/fiscal-ncms/${id}/active`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ active }),
  });

  return handleResponse<FiscalNcmDTO>(response);
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
