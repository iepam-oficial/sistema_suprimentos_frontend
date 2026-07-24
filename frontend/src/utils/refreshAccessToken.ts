import { refreshSession } from '@/features/identity/api/authApi';

/** Renova access token via BFF; atualiza localStorage. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('@ti-assistant:refresh-token');
  if (!refreshToken) {
    return null;
  }

  try {
    const data = await refreshSession(refreshToken);
    const accessToken = data.accessToken || data.token;

    if (accessToken) {
      localStorage.setItem('@ti-assistant:token', accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('@ti-assistant:refresh-token', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('@ti-assistant:user', JSON.stringify(data.user));
    }

    return accessToken ?? null;
  } catch {
    return null;
  }
}
