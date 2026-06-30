'use client';

import { useCallback, useEffect, useState } from 'react';
import { Center, Spinner, Text, useToast } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import { fetchPurchaseRequestById } from '@/features/procurement';
import { PurchaseRequestDetailLayout } from '@/features/procurement/components/purchase-request/PurchaseRequestDetailLayout';

const ALLOWED_ROLES = ['COORDINATOR', 'ADMIN'];

export default function PurchaseRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params.id as string;

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PurchaseRequestDTO | null>(null);

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

      if (data.status === 'DRAFT') {
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
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
    loadRequest();
  }, [router, loadRequest]);

  if (!authorized) {
    return null;
  }

  if (loading) {
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

  if (request.status === 'DRAFT') {
    return (
      <Center py={16}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return <PurchaseRequestDetailLayout request={request} />;
}
