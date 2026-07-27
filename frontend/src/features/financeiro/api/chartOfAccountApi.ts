import type { ChartOfAccountDTO, ChartOfAccountType } from '../types';
import { RateLimitError } from './extraExpenseApi';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro ao buscar planos de contas'
    );
  }
  return response.json();
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export async function fetchChartOfAccounts(
  tipo?: ChartOfAccountType | string
): Promise<ChartOfAccountDTO[]> {
  const token = getToken();
  if (!token) return [];

  const url = tipo ? `/api/chart-of-accounts?tipo=${tipo}` : '/api/chart-of-accounts';
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<ChartOfAccountDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchChartOfAccountById(
  token: string,
  id: string
): Promise<ChartOfAccountDTO> {
  const response = await fetch(`/api/chart-of-accounts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ChartOfAccountDTO>(response);
}
