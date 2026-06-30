'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import type { PurchaseRequestDTO, PurchaseRequestPriority } from '@ti-assistant/contracts';
import {
  PurchaseRequestPageShell,
  PurchaseRequestQueueList,
  usePurchaseRequests,
} from '@/features/procurement';

const ALLOWED_ROLES = ['MANAGER', 'ADMIN'];

const PRIORITY_ORDER: Record<PurchaseRequestPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function sortQueueItems(items: PurchaseRequestDTO[]): PurchaseRequestDTO[] {
  return [...items].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export default function PurchaseRequestQueuePage() {
  const router = useRouter();
  const toast = useToast();
  const [authorized, setAuthorized] = useState(false);

  const { items, loading, error } = usePurchaseRequests({
    awaiting_quote: true,
    limit: 100,
  });

  const sortedItems = useMemo(() => sortQueueItems(items), [items]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar fila',
        description: error,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  if (!authorized) {
    return null;
  }

  return (
    <PurchaseRequestPageShell title="Fila de Compras">
      <PurchaseRequestQueueList items={sortedItems} loading={loading} error={error} />
    </PurchaseRequestPageShell>
  );
}
