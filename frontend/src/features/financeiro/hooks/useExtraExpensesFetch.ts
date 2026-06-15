'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchExtraExpenses, RateLimitError } from '../api/extraExpenseApi';
import type { ExtraExpense, ExtraExpenseFilters } from '../types';

export function useExtraExpensesFetch(filters: ExtraExpenseFilters = {}) {
  const [expenses, setExpenses] = useState<ExtraExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const reload = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        setExpenses([]);
        return;
      }
      const data = await fetchExtraExpenses(token, filters);
      setExpenses(data);
    } catch (e) {
      if (e instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      const message =
        e instanceof Error ? e.message : 'Não foi possível carregar as despesas';
      setError(message);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { expenses, setExpenses, loading, error, reload, setLoading };
}
