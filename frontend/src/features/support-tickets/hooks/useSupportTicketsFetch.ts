'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';
import { fetchSupportTickets, RateLimitError } from '../api/supportTicketApi';
import type { SupportTicket } from '../types';
import { ROLES_TICKETS_VIEW } from '../types';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

export interface UseSupportTicketsFetchOptions {
  statusFilter?: string;
  priorityFilter?: string;
  /** Admin desk: busca todos os status para stats/filtros locais */
  fetchAllStatuses?: boolean;
}

export function useSupportTicketsFetch({
  statusFilter = '',
  priorityFilter = '',
  fetchAllStatuses = false,
}: UseSupportTicketsFetchOptions = {}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
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
      const user = JSON.parse(userRaw) as { roles?: string[]; role?: string };
      const roles = resolveUserRoles(user);
      const access = assertPageAccess(roles, ROLES_TICKETS_VIEW);
      if (!access.allowed) {
        router.push(access.redirectTo);
        return;
      }
      setUserRoles(roles);

      const data = await fetchSupportTickets(token, {
        status: !fetchAllStatuses && statusFilter ? statusFilter : undefined,
        priority: priorityFilter || undefined,
      });

      if (requestId !== fetchGeneration.current) return;
      setTickets(data);
    } catch (err: unknown) {
      if (requestId !== fetchGeneration.current) return;
      if (err instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
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
  }, [statusFilter, priorityFilter, fetchAllStatuses, router, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    setTickets,
    initialLoading,
    filtersLoading,
    error,
    userRoles,
    refetch: fetchTickets,
  };
}
