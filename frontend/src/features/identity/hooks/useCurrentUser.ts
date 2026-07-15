'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserWithSectorDTO } from '../types';
import { fetchMe } from '../api/userApi';
import { useAuthSession } from '../context/AuthSessionContext';

export function useCurrentUser() {
  const { token } = useAuthSession();
  const [currentUser, setCurrentUser] = useState<UserWithSectorDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMe(token);
      setCurrentUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuário');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { currentUser, loading, error, reload };
}
