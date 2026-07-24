'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserDetailDTO } from '../types';
import { fetchUsers } from '../api/userApi';
import { useAuthSession } from '../context/AuthSessionContext';

export function useUsers() {
  const { token } = useAuthSession();
  const [users, setUsers] = useState<UserDetailDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { users, loading, error, reload };
}
