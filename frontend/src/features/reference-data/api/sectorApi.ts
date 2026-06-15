import type { CreateSectorInput, SectorDTO, UpdateSectorInput } from '../types';
import { authHeaders, handleResponse } from './apiClient';

export async function fetchSectors(token: string): Promise<SectorDTO[]> {
  const response = await fetch('/api/sectors', { headers: authHeaders(token) });
  const data = await handleResponse<SectorDTO[]>(response, 'Erro ao buscar setores');
  return Array.isArray(data) ? data : [];
}

export async function fetchSectorsByLocation(
  token: string,
  locationId: string
): Promise<SectorDTO[]> {
  const response = await fetch(`/api/sectors/location/${locationId}`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse<SectorDTO[]>(response, 'Erro ao buscar setores');
  return Array.isArray(data) ? data : [];
}

export async function fetchSectorsByUserLocation(token: string): Promise<SectorDTO[]> {
  const response = await fetch('/api/sectors/user-location', { headers: authHeaders(token) });
  const data = await handleResponse<SectorDTO[]>(
    response,
    'Erro ao buscar setores da localização do usuário'
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchSectorById(token: string, id: string): Promise<SectorDTO> {
  const response = await fetch(`/api/sectors/${id}`, { headers: authHeaders(token) });
  return handleResponse<SectorDTO>(response, 'Erro ao buscar setor');
}

export async function createSector(token: string, data: CreateSectorInput): Promise<SectorDTO> {
  const response = await fetch('/api/sectors', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<SectorDTO>(response, 'Erro ao criar setor');
}

export async function updateSector(
  token: string,
  id: string,
  data: UpdateSectorInput
): Promise<SectorDTO> {
  const response = await fetch(`/api/sectors/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<SectorDTO>(response, 'Erro ao atualizar setor');
}

export async function deleteSector(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/sectors/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response, 'Erro ao excluir setor');
}
