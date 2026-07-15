'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/identity';
import {
  fetchMaintenanceSchedules,
  RateLimitError,
} from '../api/maintenanceScheduleApi';
import type { MaintenanceSchedule } from '../types';

export function useMaintenanceSchedules() {
  const { token } = useAuthSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await fetchMaintenanceSchedules(token);
      setSchedules(data);
    } catch (e) {
      if (e instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      const message =
        e instanceof Error ? e.message : 'Não foi possível carregar os agendamentos';
      setError(message);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { schedules, loading, error, reload };
}
