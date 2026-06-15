import type { CreateSubcategoryInput, SubcategoryDTO, UpdateSubcategoryInput } from '../types';
import { authHeaders, handleResponse } from './apiClient';

export async function fetchSubcategories(token: string): Promise<SubcategoryDTO[]> {
  const response = await fetch('/api/subcategories', { headers: authHeaders(token) });
  const data = await handleResponse<SubcategoryDTO[]>(response, 'Erro ao buscar subcategorias');
  return Array.isArray(data) ? data : [];
}

export async function fetchSubcategoriesByCategory(
  token: string,
  categoryId: string
): Promise<SubcategoryDTO[]> {
  const response = await fetch(`/api/subcategories/category/${categoryId}`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse<SubcategoryDTO[]>(
    response,
    'Erro ao buscar subcategorias'
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchSubcategoryById(token: string, id: string): Promise<SubcategoryDTO> {
  const response = await fetch(`/api/subcategories/${id}`, { headers: authHeaders(token) });
  return handleResponse<SubcategoryDTO>(response, 'Erro ao buscar subcategoria');
}

export async function createSubcategory(
  token: string,
  data: CreateSubcategoryInput
): Promise<SubcategoryDTO> {
  const response = await fetch('/api/subcategories', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<SubcategoryDTO>(response, 'Erro ao criar subcategoria');
}

export async function updateSubcategory(
  token: string,
  id: string,
  data: UpdateSubcategoryInput
): Promise<SubcategoryDTO> {
  const response = await fetch(`/api/subcategories/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<SubcategoryDTO>(response, 'Erro ao atualizar subcategoria');
}

export async function deleteSubcategory(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/subcategories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response, 'Erro ao excluir subcategoria');
}
