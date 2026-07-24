import type {
  CreateUnitOfMeasureInput,
  UnitOfMeasureDTO,
  UpdateUnitOfMeasureInput,
} from '../types';
import { authHeaders, handleResponse } from './apiClient';

export async function fetchUnitOfMeasures(token: string): Promise<UnitOfMeasureDTO[]> {
  const response = await fetch('/api/unit-of-measures', { headers: authHeaders(token) });
  const data = await handleResponse<UnitOfMeasureDTO[]>(
    response,
    'Erro ao buscar unidades de medida'
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchUnitOfMeasureById(
  token: string,
  id: string
): Promise<UnitOfMeasureDTO> {
  const response = await fetch(`/api/unit-of-measures/${id}`, { headers: authHeaders(token) });
  return handleResponse<UnitOfMeasureDTO>(response, 'Erro ao buscar unidade de medida');
}

export async function createUnitOfMeasure(
  token: string,
  data: CreateUnitOfMeasureInput
): Promise<UnitOfMeasureDTO> {
  const response = await fetch('/api/unit-of-measures', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<UnitOfMeasureDTO>(response, 'Erro ao criar unidade de medida');
}

export async function updateUnitOfMeasure(
  token: string,
  id: string,
  data: UpdateUnitOfMeasureInput
): Promise<UnitOfMeasureDTO> {
  const response = await fetch(`/api/unit-of-measures/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify(data),
  });
  return handleResponse<UnitOfMeasureDTO>(response, 'Erro ao atualizar unidade de medida');
}

export async function deleteUnitOfMeasure(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/unit-of-measures/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response, 'Erro ao excluir unidade de medida');
}
