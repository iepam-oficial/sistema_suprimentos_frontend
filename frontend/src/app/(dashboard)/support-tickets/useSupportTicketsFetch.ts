'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';
import { SupportTicket, canUseSupportTicketsKanban, canViewSupportTickets } from './types';

export interface UseSupportTicketsFetchOptions {
  statusFilter?: string;
  priorityFilter?: string;
  viewMode?: 'list' | 'board';
  /** Admin desk: sempre busca todos os status para stats/filtros locais */
  fetchAllStatuses?: boolean;
}

export function useSupportTicketsFetch({
  statusFilter = '',
  priorityFilter = '',
  viewMode = 'list',
  fetchAllStatuses = false,
}: UseSupportTicketsFetchOptions = {}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const hasCompletedOnce = useRef(false);
  const fetchGeneration = useRef(0);
  const router = useRouter();
  const toast = useToast();

  const fetchTickets = useCallback(async () => {
    const requestId = ++fetchGeneration.current;
    const isRefilter = hasCompletedOnce.current;
    try {
      setError(null);
      if (isRefilter) setFiltersLoading(true);
      else setInitialLoading(true);

      const token = localStorage.getItem('@ti-assistant:token');
      const userRaw = localStorage.getItem('@ti-assistant:user');
      if (!token || !userRaw) {
        router.push('/');
        return;
      }
      const user = JSON.parse(userRaw) as { role?: string };
      const role = user.role ?? '';
      setUserRole(role);
      if (!canViewSupportTickets(role)) {
        router.push('/unauthorized');
        return;
      }

      const params = new URLSearchParams();
      const boardFetch = fetchAllStatuses || (canUseSupportTicketsKanban(role) && viewMode === 'board');
      if (!boardFetch && statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const qs = params.toString();

      const res = await fetch(`/api/support-tickets${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao buscar chamados');
      }
      const data = await res.json();
      if (requestId !== fetchGeneration.current) return;
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (requestId !== fetchGeneration.current) return;
      const message = err instanceof Error ? err.message : 'Erro ao buscar chamados';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      if (requestId !== fetchGeneration.current) return;
      setInitialLoading(false);
      setFiltersLoading(false);
      hasCompletedOnce.current = true;
    }
  }, [statusFilter, priorityFilter, viewMode, fetchAllStatuses, router, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    setTickets,
    initialLoading,
    filtersLoading,
    error,
    userRole,
    refetch: fetchTickets,
  };
}
