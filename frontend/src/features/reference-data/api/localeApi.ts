import type { CreateLocaleInput, LocaleDTO, UpdateLocaleInput } from '../types';
import { authHeaders, handleResponse } from './apiClient';

export async function fetchLocales(token: string): Promise<LocaleDTO[]> {
  const response = await fetch('/api/locales', { headers: authHeaders(token) });
  const data = await handleResponse<LocaleDTO[]>(response, 'Erro ao buscar ambientes');
  return Array.isArray(data) ? data : [];
}

export async function fetchLocalesByUserLocation(token: string): Promise<LocaleDTO[]> {
  const response = await fetch('/api/locales/user-location', { headers: authHeaders(token) });
  const data = await handleResponse<LocaleDTO[]>(
    response,
    'Erro ao buscar ambientes da localização do usuário'
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchLocaleById(token: string, id: string): Promise<LocaleDTO> {
  const response = await fetch(`/api/locales/${id}`, { headers: authHeaders(token) });
  return handleResponse<LocaleDTO>(response, 'Erro ao buscar ambiente');
}

export async function createLocale(token: string, data: CreateLocaleInput): Promise<LocaleDTO> {
  const response = await fetch('/api/locales', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<LocaleDTO>(response, 'Erro ao criar ambiente');
}

export async function updateLocale(
  token: string,
  id: string,
  data: UpdateLocaleInput
): Promise<LocaleDTO> {
  const response = await fetch(`/api/locales/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<LocaleDTO>(response, 'Erro ao atualizar ambiente');
}

export async function deleteLocale(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/locales/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response, 'Erro ao excluir ambiente');
}
