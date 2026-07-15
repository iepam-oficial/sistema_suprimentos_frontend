'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchEvents, RateLimitError } from '../api/eventApi';
import type { Event } from '../types';

export function useEventsFetch() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const reload = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        setEvents([]);
        return;
      }
      const data = await fetchEvents(token);
      setEvents(data);
    } catch (e) {
      if (e instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
      const message =
        e instanceof Error ? e.message : 'Não foi possível carregar os eventos';
      setError(message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { events, setEvents, loading, error, reload, setLoading };
}
