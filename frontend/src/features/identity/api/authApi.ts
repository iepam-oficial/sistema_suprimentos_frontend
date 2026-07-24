import type { LoginInput, SessionResponseDTO, UserWithSectorDTO } from '../types';

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
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { message?: string; error?: string }).message ??
        (data as { error?: string }).error ??
        'Erro na requisição de autenticação'
    );
  }
  return data as T;
}

export async function login(input: LoginInput): Promise<SessionResponseDTO> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<SessionResponseDTO>(response);
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function refreshSession(refreshToken: string): Promise<SessionResponseDTO> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleResponse<SessionResponseDTO>(response);
}

export async function fetchSession(token: string): Promise<UserWithSectorDTO> {
  const response = await fetch('/api/auth/session', {
    cache: 'no-store',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserWithSectorDTO>(response);
}
