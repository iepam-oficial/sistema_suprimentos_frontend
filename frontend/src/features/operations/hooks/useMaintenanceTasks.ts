'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/identity';
import { RateLimitError } from '../api/maintenanceScheduleApi';
import {
  completeTask,
  fetchOverdueTasks,
  fetchTasks,
  fetchUpcomingTasks,
} from '../api/taskApi';
import type { MaintenanceTask } from '../types';

export type TaskViewFilter = 'all' | 'upcoming' | 'overdue';

export function useMaintenanceTasks(viewFilter: TaskViewFilter = 'all') {
  const { token } = useAuthSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let data: MaintenanceTask[];
      if (viewFilter === 'upcoming') {
        data = await fetchUpcomingTasks(token, 30);
      } else if (viewFilter === 'overdue') {
        data = await fetchOverdueTasks(token);
      } else {
        data = await fetchTasks(token);
      }
      setTasks(data);
    } catch (e) {
      if (e instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      const message =
        e instanceof Error ? e.message : 'Não foi possível carregar as tarefas';
      setError(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [token, router, viewFilter]);

  const markCompleted = useCallback(
    async (taskId: string) => {
      if (!token) return false;
      await completeTask(token, taskId);
      await reload();
      return true;
    },
    [token, reload]
  );

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { tasks, loading, error, reload, markCompleted };
}
