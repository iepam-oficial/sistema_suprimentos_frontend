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

export function usePurchaseOrders(filters: PurchaseOrderListFilters = {}) {
  const [items, setItems] = useState<PurchaseOrderDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Token não encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPurchaseOrders(token, filters);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar pedidos de compra');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.page, filters.limit]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    total,
    loading,
    error,
    reload: load,
  };
}
