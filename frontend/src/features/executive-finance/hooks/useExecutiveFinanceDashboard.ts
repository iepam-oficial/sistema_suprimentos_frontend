'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExecutiveFinanceDashboardDTO, ExecutiveFinanceFilters } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import { usePollingRefresh } from '@/features/procurement/hooks/usePollingRefresh';
import { fetchExecutiveFinanceDashboard } from '../api';

export const EXECUTIVE_FINANCE_POLL_INTERVAL_MS = 45000;

export interface UseExecutiveFinanceDashboardResult {
  data: ExecutiveFinanceDashboardDTO | null;
  loading: boolean;
  error: string | null;
  /** true when the last background poll failed; `data` still holds the last successful response. */
  isStale: boolean;
  lastUpdatedAt: Date | null;
  refetch: () => Promise<void>;
}

type LoadOptions = {
  silent?: boolean;
};

/**
 * Fetches the executive financial dashboard and keeps it fresh via 45s polling.
 * Poll failures never clear previously loaded data — they only surface via
 * `error`/`isStale` so the UI can show a "dados desatualizados" hint.
 */
export function useExecutiveFinanceDashboard(
  filters: ExecutiveFinanceFilters = {}
): UseExecutiveFinanceDashboardResult {
  const { token } = useAuthSession();
  const [data, setData] = useState<ExecutiveFinanceDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const {
    from,
    to,
    locationId,
    companyLocationId,
    chartOfAccountId,
    categoryId,
    sectorId,
    supplierId,
    poloMetric,
  } = filters;

  const load = useCallback(
    async (options?: LoadOptions) => {
      const silent = options?.silent === true;

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

        const dashboard = await fetchExecutiveFinanceDashboard(
          token,
          {
            from,
            to,
            locationId,
            companyLocationId,
            chartOfAccountId,
            categoryId,
            sectorId,
            supplierId,
            poloMetric,
          },
          silent ? { polling: true } : undefined
        );

        setData(dashboard);
        setError(null);
        setIsStale(false);
        setLastUpdatedAt(new Date());
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao buscar dashboard executivo financeiro';
        setError(message);
        if (silent) {
          setIsStale(true);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      token,
      from,
      to,
      locationId,
      companyLocationId,
      chartOfAccountId,
      categoryId,
      sectorId,
      supplierId,
      poloMetric,
    ]
  );

  useEffect(() => {
    void load();
  }, [load]);

  usePollingRefresh({
    enabled: Boolean(token),
    intervalMs: EXECUTIVE_FINANCE_POLL_INTERVAL_MS,
    onTick: () => {
      void load({ silent: true });
    },
  });

  const refetch = useCallback(() => load(), [load]);

  return useMemo(
    () => ({ data, loading, error, isStale, lastUpdatedAt, refetch }),
    [data, loading, error, isStale, lastUpdatedAt, refetch]
  );
}
