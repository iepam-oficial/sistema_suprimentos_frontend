import type {
  CreateExtraExpenseCategoryInput,
  ExtraExpenseCategoryDTO,
  UpdateExtraExpenseCategoryInput,
} from '../types';
import { RateLimitError } from './extraExpenseApi';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string }).message || 'Erro na requisição de categorias'
    );
  }
  return response.json();
}

export async function fetchExtraExpenseCategories(
  token: string
): Promise<ExtraExpenseCategoryDTO[]> {
  const response = await fetch('/api/extra-expense-categories', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<ExtraExpenseCategoryDTO[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function fetchExtraExpenseCategoryById(
  token: string,
  id: string
): Promise<ExtraExpenseCategoryDTO> {
  const response = await fetch(`/api/extra-expense-categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ExtraExpenseCategoryDTO>(response);
}

export async function createExtraExpenseCategory(
  token: string,
  data: CreateExtraExpenseCategoryInput
): Promise<ExtraExpenseCategoryDTO> {
  const response = await fetch('/api/extra-expense-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<ExtraExpenseCategoryDTO>(response);
}

export async function updateExtraExpenseCategory(
  token: string,
  id: string,
  data: UpdateExtraExpenseCategoryInput
): Promise<ExtraExpenseCategoryDTO> {
  const response = await fetch(`/api/extra-expense-categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<ExtraExpenseCategoryDTO>(response);
}

export async function deleteExtraExpenseCategory(
  token: string,
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`/api/extra-expense-categories/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ message: string }>(response);
}
