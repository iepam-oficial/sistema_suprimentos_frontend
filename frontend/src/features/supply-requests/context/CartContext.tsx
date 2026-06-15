'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import type { SupplyDTO } from '@/features/catalog/types';

export interface CartItem {
  id: string;
  quantity: number;
  supply: SupplyDTO;
}

interface CartState {
  cart: CartItem[];
  supplies: SupplyDTO[];
  suppliesLastFetched: number | null;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SUPPLIES'; payload: SupplyDTO[] }
  | { type: 'INITIALIZE_FROM_STORAGE' };

const initialState: CartState = {
  cart: [],
  supplies: [],
  suppliesLastFetched: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.cart.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((item) => item.id !== action.payload) };
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SUPPLIES':
      return { ...state, supplies: action.payload, suppliesLastFetched: Date.now() };
    case 'INITIALIZE_FROM_STORAGE': {
      try {
        const storedCart = localStorage.getItem('@ti-assistant:cart');
        const storedSupplies = localStorage.getItem('@ti-assistant:supplies');
        const storedSuppliesLastFetched = localStorage.getItem('@ti-assistant:suppliesLastFetched');
        return {
          ...state,
          cart: storedCart ? JSON.parse(storedCart) : [],
          supplies: storedSupplies ? JSON.parse(storedSupplies) : [],
          suppliesLastFetched: storedSuppliesLastFetched ? parseInt(storedSuppliesLastFetched, 10) : null,
        };
      } catch {
        return state;
      }
    }
    default:
      return state;
  }
}

const CartContext = createContext<{
  cart: CartItem[];
  supplies: SupplyDTO[];
  suppliesLastFetched: number | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setSupplies: (supplies: SupplyDTO[]) => void;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_FROM_STORAGE' });
  }, []);

  useEffect(() => {
    localStorage.setItem('@ti-assistant:cart', JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    localStorage.setItem('@ti-assistant:supplies', JSON.stringify(state.supplies));
  }, [state.supplies]);

  useEffect(() => {
    if (state.suppliesLastFetched) {
      localStorage.setItem('@ti-assistant:suppliesLastFetched', state.suppliesLastFetched.toString());
    }
  }, [state.suppliesLastFetched]);

  const value = {
    cart: state.cart,
    supplies: state.supplies,
    suppliesLastFetched: state.suppliesLastFetched,
    addToCart: (item: CartItem) => dispatch({ type: 'ADD_TO_CART', payload: item }),
    removeFromCart: (itemId: string) => dispatch({ type: 'REMOVE_FROM_CART', payload: itemId }),
    updateCartItem: (itemId: string, quantity: number) =>
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { id: itemId, quantity } }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    setSupplies: (supplies: SupplyDTO[]) => dispatch({ type: 'SET_SUPPLIES', payload: supplies }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext deve ser usado dentro de CartProvider');
  }
  return context;
}
