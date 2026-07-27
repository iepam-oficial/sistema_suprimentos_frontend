'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { SessionResponseDTO, UserDTO } from '../types';
import * as authApi from '../api/authApi';

const USER_STORAGE_KEY = '@ti-assistant:user';
const TOKEN_STORAGE_KEY = '@ti-assistant:token';
const REFRESH_STORAGE_KEY = '@ti-assistant:refresh-token';

interface AuthSessionState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

type AuthSessionAction =
  | { type: 'SET_SESSION'; payload: { user: UserDTO; token: string; refreshToken?: string } }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INITIALIZE_FROM_STORAGE' };

const initialState: AuthSessionState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

function authSessionReducer(
  state: AuthSessionState,
  action: AuthSessionAction
): AuthSessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'INITIALIZE_FROM_STORAGE': {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        return {
          ...state,
          user: storedUser ? (JSON.parse(storedUser) as UserDTO) : null,
          isAuthenticated: !!storedToken,
          token: storedToken,
          loading: false,
        };
      } catch {
        return { ...state, loading: false };
      }
    }
    default:
      return state;
  }
}

interface AuthSessionContextValue {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setSession: (session: SessionResponseDTO) => void;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

function persistSession(user: UserDTO, token: string, refreshToken?: string) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
  }
}

function clearSessionStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_STORAGE_KEY);
  localStorage.removeItem('@ti-assistant:cart');
  localStorage.removeItem('@ti-assistant:supplies');
  localStorage.removeItem('@ti-assistant:suppliesLastFetched');
  localStorage.removeItem('@ti-assistant:inventoryItems');
  localStorage.removeItem('@ti-assistant:inventoryLastFetched');
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authSessionReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_FROM_STORAGE' });
  }, []);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.user));
    }
    if (state.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, state.token);
    }
  }, [state.user, state.token]);

  const setSession = useCallback((session: SessionResponseDTO) => {
    const accessToken = session.accessToken || session.token;
    persistSession(session.user, accessToken, session.refreshToken);
    dispatch({
      type: 'SET_SESSION',
      payload: { user: session.user, token: accessToken, refreshToken: session.refreshToken },
    });
  }, []);

  const setToken = useCallback((token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    clearSessionStorage();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      setSession,
      setToken,
      logout,
    }),
    [state, setSession, setToken, logout]
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession deve ser usado dentro de AuthSessionProvider');
  }
  return context;
}

export function useUser() {
  const { user, isAuthenticated } = useAuthSession();
  return { user, isAuthenticated };
}
