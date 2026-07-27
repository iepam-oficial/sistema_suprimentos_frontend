'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SmartQuoteDTO } from '../types';
import { fetchSmartQuotes, RateLimitError } from '../api/quoteApi';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export function useSmartQuotes() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SmartQuoteDTO[]>([]);
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
      const data = await fetchSmartQuotes(token);
      setQuotes(data);
    } catch (err) {
      if (err instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro ao buscar cotações inteligentes');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return { quotes, loading, error, reload: load };
}
