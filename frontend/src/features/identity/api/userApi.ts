import type {
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  UserDetailDTO,
  UserWithSectorDTO,
} from '../types';
import { RateLimitError } from './authApi';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { message?: string; error?: string }).message ??
        (data as { error?: string }).error ??
        'Erro na requisição de usuários'
    );
  }
  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchUsers(token: string): Promise<UserDetailDTO[]> {
  const response = await fetch('/api/users', { headers: authHeaders(token) });
  return handleResponse<UserDetailDTO[]>(response);
}

export async function fetchUserById(token: string, id: string): Promise<UserDetailDTO> {
  const response = await fetch(`/api/users/${id}`, { headers: authHeaders(token) });
  return handleResponse<UserDetailDTO>(response);
}

export async function fetchMe(token: string): Promise<UserWithSectorDTO> {
  const response = await fetch('/api/users/me', { headers: authHeaders(token) });
  return handleResponse<UserWithSectorDTO>(response);
}

export async function createUser(
  token: string,
  input: CreateUserInput
): Promise<UserWithSectorDTO> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<UserWithSectorDTO>(response);
}

export async function updateUser(
  token: string,
  id: string,
  input: UpdateUserInput
): Promise<UserWithSectorDTO> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<UserWithSectorDTO>(response);
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<void>(response);
}

export async function changePassword(
  token: string,
  input: ChangePasswordInput
): Promise<void> {
  const response = await fetch('/api/users/change-password', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await handleResponse<{ message: string }>(response);
}
