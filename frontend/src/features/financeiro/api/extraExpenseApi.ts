import type {
  CreateExtraExpenseInput,
  ExtraExpenseCategoryTotalDTO,
  ExtraExpenseDTO,
  ExtraExpenseFilters,
  ExtraExpensePeriodTotalDTO,
  UpdateExtraExpenseInput,
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
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro na requisição de despesas extras'
    );
  }
  return response.json();
}

export async function fetchExtraExpenses(
  token: string,
  filters: ExtraExpenseFilters = {}
): Promise<ExtraExpenseDTO[]> {
  const params = new URLSearchParams();
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.location_id) params.set('location_id', filters.location_id);
  if (filters.event_id) params.set('event_id', filters.event_id);
  if (filters.user_id) params.set('user_id', filters.user_id);
  if (filters.start_date) params.set('start_date', filters.start_date);
  if (filters.end_date) params.set('end_date', filters.end_date);
  if (filters.min_amount != null) params.set('min_amount', String(filters.min_amount));
  if (filters.max_amount != null) params.set('max_amount', String(filters.max_amount));

  const qs = params.toString();
  const response = await fetch(`/api/extra-expenses${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await handleResponse<ExtraExpenseDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchExtraExpenseById(
  token: string,
  id: string
): Promise<ExtraExpenseDTO> {
  const response = await fetch(`/api/extra-expenses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ExtraExpenseDTO>(response);
}

export async function createExtraExpense(
  token: string,
  data: CreateExtraExpenseInput
): Promise<ExtraExpenseDTO> {
  const response = await fetch('/api/extra-expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<ExtraExpenseDTO>(response);
}

export async function updateExtraExpense(
  token: string,
  id: string,
  data: UpdateExtraExpenseInput
): Promise<ExtraExpenseDTO> {
  const response = await fetch(`/api/extra-expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<ExtraExpenseDTO>(response);
}

export async function deleteExtraExpense(
  token: string,
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`/api/extra-expenses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ message: string }>(response);
}

export async function fetchExtraExpenseTotalByPeriod(
  token: string,
  startDate: string,
  endDate: string
): Promise<ExtraExpensePeriodTotalDTO> {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const response = await fetch(`/api/extra-expenses/total/period?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ExtraExpensePeriodTotalDTO>(response);
}

export async function fetchExtraExpenseTotalByCategory(
  token: string,
  categoryId: string
): Promise<ExtraExpenseCategoryTotalDTO> {
  const response = await fetch(`/api/extra-expenses/total/category/${categoryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ExtraExpenseCategoryTotalDTO>(response);
}
