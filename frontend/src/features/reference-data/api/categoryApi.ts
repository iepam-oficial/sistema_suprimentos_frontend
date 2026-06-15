import type { CategoryDTO, CreateCategoryInput, UpdateCategoryInput } from '../types';
import { authHeaders, handleResponse } from './apiClient';

export async function fetchCategories(token: string): Promise<CategoryDTO[]> {
  const response = await fetch('/api/categories', { headers: authHeaders(token) });
  const data = await handleResponse<CategoryDTO[]>(response, 'Erro ao buscar categorias');
  return Array.isArray(data) ? data : [];
}

export async function fetchCategoryById(token: string, id: string): Promise<CategoryDTO> {
  const response = await fetch(`/api/categories/${id}`, { headers: authHeaders(token) });
  return handleResponse<CategoryDTO>(response, 'Erro ao buscar categoria');
}

export async function createCategory(
  token: string,
  data: CreateCategoryInput
): Promise<CategoryDTO> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<CategoryDTO>(response, 'Erro ao criar categoria');
}

export async function updateCategory(
  token: string,
  id: string,
  data: UpdateCategoryInput
): Promise<CategoryDTO> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<CategoryDTO>(response, 'Erro ao atualizar categoria');
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response, 'Erro ao excluir categoria');
}
