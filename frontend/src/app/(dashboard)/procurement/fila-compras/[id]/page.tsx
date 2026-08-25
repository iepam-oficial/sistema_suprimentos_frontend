'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flex, Spinner, useToast } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  fetchPurchaseRequestById,
  PurchaseRequestDetailLayout,
} from '@/features/procurement';
import { creatorLocksQueuePriority } from '@/features/procurement/lib/purchaseRequestAccess';

import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

const ALLOWED_ROLES = ['MANAGER', 'ADMIN'];

export default function PurchaseRequestQueueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const requestId = params.id as string;

  const [authorized, setAuthorized] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [request, setRequest] = useState<PurchaseRequestDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRequest = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPurchaseRequestById(token, requestId);
      setRequest(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar solicitação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [requestId, toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const roles = resolveUserRoles(user);
    const access = assertPageAccess(roles, ALLOWED_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setUserRoles(roles);
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) {
      loadRequest();
    }
  }, [authorized, loadRequest]);

  useEffect(() => {
    if (request && request.status !== 'APPROVED') {
      router.push('/procurement/fila-compras');
    }
  }, [request, router]);

  if (!authorized || loading) {
    return (
      <Flex justify="center" align="center" h="full">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!request) {
    return null;
  }

  return (
    <PurchaseRequestDetailLayout
      request={request}
      backHref="/procurement/fila-compras"
      userRoles={userRoles}
      onPriorityUpdated={setRequest}
      showQuoteCta
      priorityDisabled={creatorLocksQueuePriority(request)}
    />
  );
}
