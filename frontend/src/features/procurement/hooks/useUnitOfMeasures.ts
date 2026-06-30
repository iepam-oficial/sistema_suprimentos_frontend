'use client';

import { useEffect, useState } from 'react';
import type { UnitOfMeasureDTO } from '@ti-assistant/contracts';
import { fetchUnitOfMeasures } from '@/features/reference-data/api/unitOfMeasureApi';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('@ti-assistant:token');
}

export function useUnitOfMeasures() {
  const [units, setUnits] = useState<UnitOfMeasureDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Token não encontrado');
      setLoading(false);
      return;
    }

    fetchUnitOfMeasures(token)
      .then(setUnits)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar unidades');
      })
      .finally(() => setLoading(false));
  }, []);

  return { units, loading, error };
}
