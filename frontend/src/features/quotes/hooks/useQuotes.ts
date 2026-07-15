'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuoteDTO } from '../types';
import {
  approveQuote,
  fetchQuotes,
  RateLimitError,
  rejectQuote,
  type FetchQuotesFilters,
} from '../api/quoteApi';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export function useQuotes(filters: FetchQuotesFilters = {}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteDTO[]>([]);
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
      const data = await fetchQuotes(token, filters);
      setQuotes(data);
    } catch (err) {
      if (err instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.created_by, filters.supplier_id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = useCallback(
    async (quoteId: string, status: 'APPROVED' | 'REJECTED') => {
      const token = getToken();
      if (!token) throw new Error('Token não encontrado');

      if (status === 'APPROVED') {
        await approveQuote(token, quoteId);
      } else {
        await rejectQuote(token, quoteId);
      }

      await load();
    },
    [load],
  );

  return {
    quotes,
    loading,
    error,
    reload: load,
    handleStatusChange,
  };
}
