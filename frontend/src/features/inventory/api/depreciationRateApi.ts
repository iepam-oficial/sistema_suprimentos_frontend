import type {
  CreateDepreciationRateInput,
  DepreciationRateDTO,
  UpdateDepreciationRateInput,
} from '@ti-assistant/contracts';
import { RateLimitError } from '@/features/financeiro/api/extraExpenseApi';

export interface DepreciationRateFilters {
  ncm?: string;
  cest?: string;
  chart_of_account_id?: string;
  active?: boolean;
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
        'Erro ao buscar taxas de depreciação'
    );
  }
  return response.json();
}

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

function buildQueryString(params: {
  ncm?: string;
  cest?: string;
  chart_of_account_id?: string;
  active?: boolean;
  onDate?: string;
}): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function fetchDepreciationRates(
  token: string,
  filters: DepreciationRateFilters = {}
): Promise<DepreciationRateDTO[]> {
  const query = buildQueryString(filters);
  const response = await fetch(`/api/depreciation-rates${query}`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse<DepreciationRateDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchDepreciationRateById(
  token: string,
  id: string
): Promise<DepreciationRateDTO> {
  const response = await fetch(`/api/depreciation-rates/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse<DepreciationRateDTO>(response);
}

export async function lookupDepreciationRate(
  token: string,
  ncm: string,
  cest?: string,
  onDate?: string
): Promise<DepreciationRateDTO | null> {
  const query = buildQueryString({ ncm, cest, onDate });
  const response = await fetch(`/api/depreciation-rates/lookup${query}`, {
    headers: authHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<DepreciationRateDTO>(response);
}

export async function createDepreciationRate(
  token: string,
  data: CreateDepreciationRateInput
): Promise<DepreciationRateDTO> {
  const response = await fetch('/api/depreciation-rates', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<DepreciationRateDTO>(response);
}

export async function updateDepreciationRate(
  token: string,
  id: string,
  data: UpdateDepreciationRateInput
): Promise<DepreciationRateDTO> {
  const response = await fetch(`/api/depreciation-rates/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<DepreciationRateDTO>(response);
}

export async function setActiveDepreciationRate(
  token: string,
  id: string,
  active: boolean
): Promise<DepreciationRateDTO> {
  const response = await fetch(`/api/depreciation-rates/${id}/active`, {
    method: 'PATCH',
    headers: authHeaders(token, true),
    body: JSON.stringify({ active }),
  });
  return handleResponse<DepreciationRateDTO>(response);
}
