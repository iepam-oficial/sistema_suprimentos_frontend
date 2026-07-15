"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Flex,
  VStack,
  HStack,
  Button,
} from '@chakra-ui/react';
import { useAuthSession } from '@/features/identity';
import {
  fetchInternalServiceOrderById,
  RateLimitError,
  type InternalServiceOrder,
} from '@/features/operations';

export default function InternalServiceOrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<InternalServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token } = useAuthSession();

  useEffect(() => {
    const loadOrder = async () => {
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const data = await fetchInternalServiceOrderById(token, params.id);
        setOrder(data);
      } catch (err) {
        if (err instanceof RateLimitError) {
          router.push('/rate-limit');
          return;
        }
        setError(err instanceof Error ? err.message : 'Erro ao buscar ordem de serviço interna');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [params.id, router, token]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (!order) {
    return <Text>Ordem de serviço interna não encontrada.</Text>;
  }

  return (
    <Box p={8}>
      <Button mb={4} onClick={() => router.back()} colorScheme="gray">Voltar</Button>
      <Heading size="lg" mb={4}>{order.title}</Heading>
      <VStack align="start" spacing={3}>
        <HStack><Text fontWeight="bold">Técnico:</Text><Text>{order.technician?.name || '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Início:</Text><Text>{order.start_date ? new Date(order.start_date).toLocaleString('pt-BR') : '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Fim:</Text><Text>{order.end_date ? new Date(order.end_date).toLocaleString('pt-BR') : '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Tipo:</Text><Text>{order.type}</Text></HStack>
        <HStack><Text fontWeight="bold">Setor:</Text><Text>{order.sector?.name || '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Local:</Text><Text>{order.location?.name || '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Tempo gasto (h):</Text><Text>{order.time_spent_hours}</Text></HStack>
        <HStack><Text fontWeight="bold">Equipamento:</Text><Text>{order.inventory?.name || '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Descrição:</Text><Text>{order.description || '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Observações:</Text><Text>{order.notes || '-'}</Text></HStack>
        <HStack><Text fontWeight="bold">Criado em:</Text><Text>{new Date(order.created_at).toLocaleString('pt-BR')}</Text></HStack>
        <HStack><Text fontWeight="bold">Atualizado em:</Text><Text>{new Date(order.updated_at).toLocaleString('pt-BR')}</Text></HStack>
      </VStack>
    </Box>
  );
}
