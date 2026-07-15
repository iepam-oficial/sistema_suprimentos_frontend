'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import type { SupplyDTO } from '@/features/catalog/types';
import { clampCartQuantity, normalizeSupplyStock, reconcileCartItems } from '../utils/cartStockUtils';

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
  | { type: 'RECONCILE_CART'; payload: CartItem[] }
  | { type: 'INITIALIZE_FROM_STORAGE' };

const initialState: CartState = {
  cart: [],
  supplies: [],
  suppliesLastFetched: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { id, quantity, supply } = action.payload;
      const maxQty = supply.available_quantity;
      if (maxQty <= 0) return state;

      const existing = state.cart.find((item) => item.id === id);
      if (existing) {
        if (existing.quantity >= maxQty) return state;
        const nextQty = clampCartQuantity(existing.quantity + quantity, maxQty);
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, quantity: nextQty, supply } : item
          ),
        };
      }

      const initialQty = clampCartQuantity(quantity, maxQty);
      if (initialQty <= 0) return state;
      return { ...state, cart: [...state.cart, { id, quantity: initialQty, supply }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((item) => item.id !== action.payload) };
    case 'UPDATE_CART_ITEM': {
      const item = state.cart.find((cartItem) => cartItem.id === action.payload.id);
      if (!item) return state;

      const clamped = clampCartQuantity(action.payload.quantity, item.supply.available_quantity);
      if (clamped <= 0) {
        return { ...state, cart: state.cart.filter((cartItem) => cartItem.id !== action.payload.id) };
      }

      return {
        ...state,
        cart: state.cart.map((cartItem) =>
          cartItem.id === action.payload.id ? { ...cartItem, quantity: clamped } : cartItem
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SUPPLIES':
      return { ...state, supplies: action.payload, suppliesLastFetched: Date.now() };
    case 'RECONCILE_CART':
      return { ...state, cart: action.payload };
    case 'INITIALIZE_FROM_STORAGE': {
      try {
        const storedCart = localStorage.getItem('@ti-assistant:cart');
        const storedSupplies = localStorage.getItem('@ti-assistant:supplies');
        const storedSuppliesLastFetched = localStorage.getItem('@ti-assistant:suppliesLastFetched');

        const rawSupplies = storedSupplies ? JSON.parse(storedSupplies) : [];
        const rawCart = storedCart ? JSON.parse(storedCart) : [];

        const hadLegacyShape =
          rawSupplies.some(
            (supply: SupplyDTO & { quantity?: number }) =>
              typeof supply.available_quantity !== 'number' && typeof supply.quantity === 'number',
          ) ||
          rawCart.some(
            (item: CartItem) =>
              typeof item.supply?.available_quantity !== 'number' &&
              typeof (item.supply as SupplyDTO & { quantity?: number })?.quantity === 'number',
          );

        const supplies = rawSupplies.map(normalizeSupplyStock);
        const cart = rawCart.map((item: CartItem) => ({
          ...item,
          supply: normalizeSupplyStock(item.supply),
        }));

        return {
          ...state,
          cart,
          supplies,
          suppliesLastFetched: hadLegacyShape
            ? null
            : storedSuppliesLastFetched
              ? parseInt(storedSuppliesLastFetched, 10)
              : null,
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
  reconcileCart: (supplies: SupplyDTO[]) => boolean;
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

  const reconcileCart = (supplies: SupplyDTO[]): boolean => {
    const { cart, changed } = reconcileCartItems(state.cart, supplies);
    dispatch({ type: 'RECONCILE_CART', payload: cart });
    return changed;
  };

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
    reconcileCart,
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
