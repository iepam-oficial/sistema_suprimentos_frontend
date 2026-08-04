'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ManagerOpsDashboardDTO, ManagerOpsFilters } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import { usePollingRefresh } from '@/features/procurement/hooks/usePollingRefresh';
import { fetchManagerOpsDashboard } from '../api';

export const MANAGER_OPS_POLL_INTERVAL_MS = 45000;

export interface UseManagerOpsDashboardResult {
  data: ManagerOpsDashboardDTO | null;
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
 * Fetches the manager ops dashboard and keeps it fresh via 45s polling.
 * Poll failures never clear previously loaded data — they only surface via
 * `error`/`isStale` so the UI can show a "dados desatualizados" hint.
 */
export function useManagerOpsDashboard(
  filters: ManagerOpsFilters = {}
): UseManagerOpsDashboardResult {
  const { token } = useAuthSession();
  const [data, setData] = useState<ManagerOpsDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const { from, to, consumptionPeriod, categoryId, sectorId, locationId, supplierId } = filters;

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

        const dashboard = await fetchManagerOpsDashboard(
          token,
          {
            from,
            to,
            consumptionPeriod,
            categoryId,
            sectorId,
            locationId,
            supplierId,
          },
          silent ? { polling: true } : undefined
        );

        setData(dashboard);
        setError(null);
        setIsStale(false);
        setLastUpdatedAt(new Date());
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao buscar dashboard operacional do gestor';
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
    [token, from, to, consumptionPeriod, categoryId, sectorId, locationId, supplierId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  usePollingRefresh({
    enabled: Boolean(token),
    intervalMs: MANAGER_OPS_POLL_INTERVAL_MS,
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
