'use client';

import { useEffect, useRef, useState } from 'react';
import type { CatalogSearchResultDTO } from '@ti-assistant/contracts';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

async function fetchCatalogSearch(
  token: string,
  query: string,
  scope: 'supply' | 'all' = 'all',
): Promise<CatalogSearchResultDTO[]> {
  const params = new URLSearchParams({ q: query });
  if (scope === 'supply') {
    params.set('scope', 'supply');
  }
  const response = await fetch(`/api/procurement/catalog-search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar itens do catálogo');
  }

  return response.json();
}

export function useCatalogSearch(
  query: string,
  options?: { enabled?: boolean; scope?: 'supply' | 'all' },
) {
  const enabled = options?.enabled !== false;
  const scope = options?.scope ?? 'all';
  const [results, setResults] = useState<CatalogSearchResultDTO[]>([]);
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
        const token = getToken();
        if (!token) {
          if (!cancelled) {
            setResults([]);
            setError('Token não encontrado');
            setIsLoading(false);
          }
          return;
        }

        const data = await fetchCatalogSearch(token, trimmed, scope);
        if (!cancelled) {
          setResults(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(
            err instanceof Error ? err.message : 'Erro ao buscar itens do catálogo',
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
  }, [query, enabled, scope]);

  return { results, isLoading, error };
}
