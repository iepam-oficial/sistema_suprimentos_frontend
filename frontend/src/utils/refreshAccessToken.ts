/** Renova access token via BFF; atualiza localStorage. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('@ti-assistant:refresh-token');
  if (!refreshToken) {
    return null;
  }

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const accessToken = data.accessToken || data.token;

  if (accessToken) {
    localStorage.setItem('@ti-assistant:token', accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem('@ti-assistant:refresh-token', data.refreshToken);
  }

  return accessToken ?? null;
}
