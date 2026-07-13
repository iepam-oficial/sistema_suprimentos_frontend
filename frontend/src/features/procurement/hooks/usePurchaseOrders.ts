'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PurchaseOrderDTO } from '@ti-assistant/contracts';
import {
  fetchPurchaseOrders,
  type PurchaseOrderListFilters,
} from '../api/purchaseOrderApi';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export type ListReloadOptions = {
  silent?: boolean;
};

export function usePurchaseOrders(filters: PurchaseOrderListFilters = {}) {
  const [items, setItems] = useState<PurchaseOrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: ListReloadOptions) => {
    const silent = options?.silent === true;
    const token = getToken();
    if (!token) {
      if (!silent) {
        setError('Token não encontrado');
        setLoading(false);
      }
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await fetchPurchaseOrders(
        token,
        filters,
        silent ? { polling: true } : undefined,
      );
      setItems(data.items);
      setTotal(data.total);
      if (silent) {
        setError(null);
      }
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar pedidos de compra');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filters.status, filters.page, filters.limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(), [load]);
  const refreshSilent = useCallback(() => load({ silent: true }), [load]);

  return {
    items,
    total,
    loading,
    error,
    reload,
    refreshSilent,
  };
}
