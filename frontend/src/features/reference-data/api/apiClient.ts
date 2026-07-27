export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export async function handleResponse<T>(response: Response, fallbackError: string): Promise<T> {
  if (response.status === 429) {
    throw new RateLimitError();
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      (errData as { message?: string; error?: string }).message ||
        (errData as { error?: string }).error ||
        fallbackError
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export function authHeaders(token: string, withJson = false): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}
