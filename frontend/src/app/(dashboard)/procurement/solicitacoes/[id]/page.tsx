'use client';

import { useCallback, useEffect, useState } from 'react';
import { Center, Spinner, Text, useToast } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import { fetchPurchaseRequestById } from '@/features/procurement';
import { PurchaseRequestDetailLayout } from '@/features/procurement/components/purchase-request/PurchaseRequestDetailLayout';
import {
  SC_PAGE_ROLES,
  canMutatePurchaseRequest,
  isWizardEditableStatus,
} from '@/features/procurement/lib/purchaseRequestAccess';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params.id as string;

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PurchaseRequestDTO | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const loadRequest = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPurchaseRequestById(token, id);
      setRequest(data);

      const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
      const shouldRedirectToWizard =
        isWizardEditableStatus(data.status) &&
        canMutatePurchaseRequest(
          { id: user.id, roles: resolveUserRoles(user) },
          data,
        );

      if (shouldRedirectToWizard) {
        setRedirecting(true);
        router.replace(`/procurement/solicitacoes/${id}/editar`);
      }
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
  }, [id, router, toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const access = assertPageAccess(resolveUserRoles(user), SC_PAGE_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setAuthorized(true);
    loadRequest();
  }, [router, loadRequest]);

  if (!authorized) {
    return null;
  }

  if (loading || redirecting) {
    return (
      <Center py={16}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!request) {
    return (
      <Center py={16}>
        <Text color="gray.500">Solicitação não encontrada.</Text>
      </Center>
    );
  }

  return <PurchaseRequestDetailLayout request={request} />;
}
