'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import type { InventoryItem } from '../types';

interface InventoryCacheState {
  inventoryItems: InventoryItem[];
  inventoryLastFetched: number | null;
}

type InventoryCacheAction =
  | { type: 'SET_INVENTORY_ITEMS'; payload: InventoryItem[] }
  | { type: 'INITIALIZE_FROM_STORAGE' };

const initialState: InventoryCacheState = {
  inventoryItems: [],
  inventoryLastFetched: null,
};

function inventoryCacheReducer(
  state: InventoryCacheState,
  action: InventoryCacheAction
): InventoryCacheState {
  switch (action.type) {
    case 'SET_INVENTORY_ITEMS':
      return { inventoryItems: action.payload, inventoryLastFetched: Date.now() };
    case 'INITIALIZE_FROM_STORAGE': {
      try {
        const storedItems = localStorage.getItem('@ti-assistant:inventoryItems');
        const storedLastFetched = localStorage.getItem('@ti-assistant:inventoryLastFetched');
        return {
          inventoryItems: storedItems ? JSON.parse(storedItems) : [],
          inventoryLastFetched: storedLastFetched ? parseInt(storedLastFetched, 10) : null,
        };
      } catch {
        return state;
      }
    }
    default:
      return state;
  }
}

const InventoryCacheContext = createContext<{
  inventoryItems: InventoryItem[];
  inventoryLastFetched: number | null;
  setInventoryItems: (items: InventoryItem[]) => void;
} | null>(null);

export function InventoryCacheProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inventoryCacheReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_FROM_STORAGE' });
  }, []);

  useEffect(() => {
    localStorage.setItem('@ti-assistant:inventoryItems', JSON.stringify(state.inventoryItems));
  }, [state.inventoryItems]);

  useEffect(() => {
    if (state.inventoryLastFetched) {
      localStorage.setItem(
        '@ti-assistant:inventoryLastFetched',
        state.inventoryLastFetched.toString()
      );
    }
  }, [state.inventoryLastFetched]);

  const value = {
    inventoryItems: state.inventoryItems,
    inventoryLastFetched: state.inventoryLastFetched,
    setInventoryItems: (items: InventoryItem[]) =>
      dispatch({ type: 'SET_INVENTORY_ITEMS', payload: items }),
  };

  return (
    <InventoryCacheContext.Provider value={value}>{children}</InventoryCacheContext.Provider>
  );
}

export function useInventoryCache() {
  const context = useContext(InventoryCacheContext);
  if (!context) {
    throw new Error('useInventoryCache deve ser usado dentro de InventoryCacheProvider');
  }
  return context;
}
