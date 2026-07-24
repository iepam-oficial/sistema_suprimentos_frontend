import type { CreateTaskInput, TaskDTO, UpdateTaskInput } from '../types';
import { RateLimitError } from './maintenanceScheduleApi';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        'Erro na requisição de tarefas'
    );
  }
  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchTasks(token: string, query?: string): Promise<TaskDTO[]> {
  const url = query ? `/api/tasks?${query}` : '/api/tasks';
  const response = await fetch(url, { headers: authHeaders(token) });
  return handleResponse<TaskDTO[]>(response);
}

export async function fetchUpcomingTasks(token: string, days = 30): Promise<TaskDTO[]> {
  const response = await fetch(`/api/tasks/upcoming?days=${days}`, {
    headers: authHeaders(token),
  });
  return handleResponse<TaskDTO[]>(response);
}

export async function fetchOverdueTasks(token: string): Promise<TaskDTO[]> {
  const response = await fetch('/api/tasks/overdue', { headers: authHeaders(token) });
  return handleResponse<TaskDTO[]>(response);
}

export async function fetchTaskById(token: string, id: string): Promise<TaskDTO> {
  const response = await fetch(`/api/tasks/${id}`, { headers: authHeaders(token) });
  return handleResponse<TaskDTO>(response);
}

export async function createTask(token: string, input: CreateTaskInput): Promise<TaskDTO> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<TaskDTO>(response);
}

export async function updateTask(
  token: string,
  id: string,
  input: UpdateTaskInput
): Promise<TaskDTO> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<TaskDTO>(response);
}

export async function deleteTask(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<{ message: string }>(response);
}

export async function completeTask(token: string, id: string): Promise<TaskDTO> {
  const response = await fetch(`/api/tasks/${id}/complete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  return handleResponse<TaskDTO>(response);
}
