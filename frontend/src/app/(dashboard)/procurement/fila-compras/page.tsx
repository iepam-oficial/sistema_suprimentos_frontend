'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Flex, useToast } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PurchaseRequestPageShell,
  PurchaseRequestQueueList,
  usePollingRefresh,
  usePurchaseRequests,
  useMarkMenuBadgeSeen,
} from '@/features/procurement';
import { sortPurchaseRequestQueue } from '@/features/procurement/lib/sortPurchaseRequestQueue';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

const ALLOWED_ROLES = ['MANAGER', 'ADMIN'];

export default function PurchaseRequestQueuePage() {
  const router = useRouter();
  const toast = useToast();
  const [authorized, setAuthorized] = useState(false);

  const { items, loading, error, refreshSilent } = usePurchaseRequests({
    awaiting_quote: true,
    limit: 100,
  });

  const sortedItems = useMemo(() => sortPurchaseRequestQueue(items), [items]);

  usePollingRefresh({
    enabled: authorized,
    onTick: refreshSilent,
  });

  useMarkMenuBadgeSeen('fila-compras', authorized);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const access = assertPageAccess(resolveUserRoles(user), ALLOWED_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
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
    <PurchaseRequestPageShell
      title="Fila de Compras"
      toolbar={
        <Flex justify="flex-end" flexShrink={0}>
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            colorScheme="blue"
            flexShrink={0}
            onClick={() => router.push('/procurement/solicitacoes/nova')}
          >
            Nova solicitação
          </Button>
        </Flex>
      }
    >
      <PurchaseRequestQueueList items={sortedItems} loading={loading} error={error} />
    </PurchaseRequestPageShell>
  );
}
