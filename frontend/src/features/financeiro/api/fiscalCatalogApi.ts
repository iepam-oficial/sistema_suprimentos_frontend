import type {
  CreateFiscalNcmInput,
  FiscalNcmDTO,
  FiscalNcmListResultDTO,
  UpdateFiscalNcmInput,
} from '@ti-assistant/contracts';
import { RateLimitError } from './extraExpenseApi';
import {
  invalidImportMessage,
  parseAndValidateFiscalImportFile,
} from '../lib/fiscalImportValidation';

export interface FiscalNcmImportResult {
  versionId: string;
  created: number;
  updated: number;
  deactivated: number;
  skipped: number;
  cestCreated?: number;
  cestUpdated?: number;
  cestDeactivated?: number;
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
  page?: number;
  limit?: number;
}): Promise<FiscalNcmListResultDTO> {
  const token = getToken();
  if (!token) {
    return { items: [], total: 0, page: 1, limit: options?.limit ?? 100 };
  }

  const params = new URLSearchParams();
  if (options?.active !== undefined) {
    params.set('active', String(options.active));
  }
  if (options?.q?.trim()) {
    params.set('q', options.q.trim());
  }
  params.set('page', String(options?.page ?? 1));
  params.set('limit', String(options?.limit ?? 100));
  const qs = params.toString();
  const response = await fetch(`/api/fiscal-ncms${qs ? `?${qs}` : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<FiscalNcmListResultDTO>(response);
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : 0,
    page: typeof data.page === 'number' ? data.page : 1,
    limit: typeof data.limit === 'number' ? data.limit : options?.limit ?? 100,
  };
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
  ncmFile: File,
  cestFile: File,
): Promise<FiscalNcmImportResult> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const [ncmParsed, cestParsed] = await Promise.all([
    parseAndValidateFiscalImportFile(ncmFile, 'ncm'),
    parseAndValidateFiscalImportFile(cestFile, 'cest'),
  ]);
  if (!ncmParsed.ok) {
    throw new Error(ncmParsed.error || invalidImportMessage('ncm'));
  }
  if (!cestParsed.ok) {
    throw new Error(cestParsed.error || invalidImportMessage('cest'));
  }

  const response = await fetch('/api/fiscal-ncms/import', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ncm: ncmParsed.data, cest: cestParsed.data }),
  });

  return handleResponse<FiscalNcmImportResult>(response);
}
