'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProcurementQuoteDTO } from '@ti-assistant/contracts';
import {
  fetchProcurementQuotes,
  type ProcurementQuoteListFilters,
} from '../api/procurementQuoteApi';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export function useProcurementQuotes(filters: ProcurementQuoteListFilters = {}) {
  const [items, setItems] = useState<ProcurementQuoteDTO[]>([]);
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
      const data = await fetchProcurementQuotes(token, filters);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações de compra');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.purchase_request_id, filters.page, filters.limit]);

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
