'use client';

import { useEffect, useRef, useState } from 'react';
import type { FiscalNcmDTO } from '@ti-assistant/contracts';
import { fetchFiscalNcms } from '../api/fiscalCatalogApi';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function useFiscalNcmSearch(
  query: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false;
  const [results, setResults] = useState<FiscalNcmDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!enabled || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsLoading(true);
    setError(null);

    let cancelled = false;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await fetchFiscalNcms({
          active: true,
          q: trimmed,
          limit: 20,
        });
        if (!cancelled) {
          setResults(data.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(
            err instanceof Error ? err.message : 'Erro ao buscar NCMs',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, enabled]);

  return { results, isLoading, error };
}
