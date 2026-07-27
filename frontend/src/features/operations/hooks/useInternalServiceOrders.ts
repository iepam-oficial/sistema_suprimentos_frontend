'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/identity';
import {
  fetchInternalServiceOrders,
  RateLimitError,
} from '../api/internalServiceOrderApi';
import type { InternalServiceOrder } from '../types';

export function useInternalServiceOrders() {
  const { token } = useAuthSession();
  const router = useRouter();
  const [orders, setOrders] = useState<InternalServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await fetchInternalServiceOrders(token);
      setOrders(data);
    } catch (e) {
      if (e instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      const message =
        e instanceof Error ? e.message : 'Não foi possível carregar as ordens de serviço internas';
      setError(message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { orders, loading, error, reload };
}
