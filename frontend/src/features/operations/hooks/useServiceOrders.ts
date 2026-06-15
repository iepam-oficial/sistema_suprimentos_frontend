'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchServiceOrders,
  RateLimitError,
} from '../api/serviceOrderApi';
import type { ServiceOrderDTO } from '../types';

export function useServiceOrders(token: string | null, enabled = true) {
  const router = useRouter();
  const [orders, setOrders] = useState<ServiceOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchServiceOrders(token);
      setOrders(data);
    } catch (err) {
      if (err instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro ao buscar ordens de serviço');
    } finally {
      setLoading(false);
    }
  }, [token, enabled, router]);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, loading, error, reload: load, setOrders };
}
