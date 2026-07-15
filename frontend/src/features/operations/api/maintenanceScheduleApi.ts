import type {
  CreateMaintenanceScheduleInput,
  MaintenanceScheduleDTO,
  UpdateMaintenanceScheduleInput,
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
        'Erro na requisição de agendamentos'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMaintenanceSchedules(
  token: string
): Promise<MaintenanceScheduleDTO[]> {
  const response = await fetch('/api/maintenance-schedules', {
    headers: authHeaders(token),
  });
  return handleResponse<MaintenanceScheduleDTO[]>(response);
}

export async function fetchMaintenanceScheduleById(
  token: string,
  id: string
): Promise<MaintenanceScheduleDTO> {
  const response = await fetch(`/api/maintenance-schedules/${id}`, {
    headers: authHeaders(token),
  });
  return handleResponse<MaintenanceScheduleDTO>(response);
}

export async function createMaintenanceSchedule(
  token: string,
  input: CreateMaintenanceScheduleInput
): Promise<MaintenanceScheduleDTO> {
  const response = await fetch('/api/maintenance-schedules', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<MaintenanceScheduleDTO>(response);
}

export async function updateMaintenanceSchedule(
  token: string,
  id: string,
  input: UpdateMaintenanceScheduleInput
): Promise<MaintenanceScheduleDTO> {
  const response = await fetch(`/api/maintenance-schedules/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<MaintenanceScheduleDTO>(response);
}

export async function deleteMaintenanceSchedule(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/maintenance-schedules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<{ message: string }>(response);
}
