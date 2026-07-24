import type { CreateLocationInput, LocationDTO, UpdateLocationInput } from '../types';
import { authHeaders, handleResponse } from './apiClient';

export async function fetchLocations(token: string): Promise<LocationDTO[]> {
  const response = await fetch('/api/locations', { headers: authHeaders(token) });
  const data = await handleResponse<LocationDTO[]>(response, 'Erro ao buscar localizações');
  return Array.isArray(data) ? data : [];
}

export async function fetchLocationById(token: string, id: string): Promise<LocationDTO> {
  const response = await fetch(`/api/locations/${id}`, { headers: authHeaders(token) });
  return handleResponse<LocationDTO>(response, 'Erro ao buscar localização');
}

export async function createLocation(
  token: string,
  data: CreateLocationInput
): Promise<LocationDTO> {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<LocationDTO>(response, 'Erro ao criar localização');
}

export async function updateLocation(
  token: string,
  id: string,
  data: UpdateLocationInput
): Promise<LocationDTO> {
  const response = await fetch(`/api/locations/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<LocationDTO>(response, 'Erro ao atualizar localização');
}

export async function deleteLocation(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/locations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response, 'Erro ao excluir localização');
}
