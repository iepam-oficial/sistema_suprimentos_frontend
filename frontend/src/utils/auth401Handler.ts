import { refreshAccessToken } from './refreshAccessToken';
import { performLogout } from './logout';

let refreshInFlight: Promise<string | null> | null = null;

export function getRefreshedAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function shouldSkip401Handling(url: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const isLoginPage = window.location.pathname === '/';
  const isSessionRequest = url.includes('/api/auth/session');
  const isRefreshRequest = url.includes('/api/auth/refresh');
  return isLoginPage || isSessionRequest || isRefreshRequest;
}

export async function handle401WithRefresh(
  url: string,
  retry: () => Promise<Response>
): Promise<Response | null> {
  if (shouldSkip401Handling(url)) {
    return null;
  }

  const refreshToken = localStorage.getItem('@ti-assistant:refresh-token');
  if (!refreshToken) {
    await performLogout();
    return null;
  }

  const newToken = await getRefreshedAccessToken();
  if (!newToken) {
    await performLogout();
    return null;
  }

  return retry();
}
