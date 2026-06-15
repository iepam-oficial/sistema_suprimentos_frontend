'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useCartContext } from '@/features/supply-requests/context/CartContext';
import { useInventoryCache } from '@/features/inventory/context/InventoryCacheContext';

interface GlobalState {
  loading: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  activeTab: number;
  searchQuery: string;
  statusFilter: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

type GlobalAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'INITIALIZE_FROM_STORAGE' };

const initialState: GlobalState = {
  loading: false,
  theme: 'light',
  notifications: [],
  activeTab: 0,
  searchQuery: '',
  statusFilter: '',
};

function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_NOTIFICATION': {
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      return { ...state, notifications: [...state.notifications, newNotification] };
    }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload };
    case 'INITIALIZE_FROM_STORAGE':
      try {
        const storedTheme = localStorage.getItem('@ti-assistant:theme') as 'light' | 'dark';
        const storedActiveTab = localStorage.getItem('@ti-assistant:activeTab');

        return {
          ...state,
          theme: storedTheme || 'light',
          activeTab: storedActiveTab ? parseInt(storedActiveTab, 10) : 0,
        };
      } catch {
        return state;
      }
    default:
      return state;
  }
}

const GlobalContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  setActiveTab: (tabIndex: number) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
} | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_FROM_STORAGE' });
  }, []);

  useEffect(() => {
    localStorage.setItem('@ti-assistant:theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('@ti-assistant:activeTab', state.activeTab.toString());
  }, [state.activeTab]);

  const value = {
    state,
    dispatch,
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (notificationId: string) =>
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId }),
    setActiveTab: (tabIndex: number) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tabIndex }),
    setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    setStatusFilter: (filter: string) => dispatch({ type: 'SET_STATUS_FILTER', payload: filter }),
    setTheme: (theme: 'light' | 'dark') => dispatch({ type: 'SET_THEME', payload: theme }),
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal deve ser usado dentro de um GlobalProvider');
  }
  return context;
}

export { useUser } from '@/features/identity';

export function useCart() {
  return useCartContext();
}

export function useSupplies() {
  const { supplies, suppliesLastFetched, setSupplies } = useCartContext();
  return { supplies, suppliesLastFetched, setSupplies };
}

export function useInventoryItems() {
  return useInventoryCache();
}

export type { InventoryItem } from '@/features/inventory/types';

export function useNotifications() {
  const { state, addNotification, removeNotification } = useGlobal();
  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
  };
}

export function useTheme() {
  const { state, setTheme } = useGlobal();
  return { theme: state.theme, setTheme };
}

export function useTabs() {
  const { state, setActiveTab } = useGlobal();
  return { activeTab: state.activeTab, setActiveTab };
}

export function useFilters() {
  const { state, setSearchQuery, setStatusFilter } = useGlobal();
  return {
    searchQuery: state.searchQuery,
    statusFilter: state.statusFilter,
    setSearchQuery,
    setStatusFilter,
  };
}
