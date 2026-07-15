"use client"

import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Flex,
  Text,
  Button,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useInternalServiceOrders } from '@/features/operations';

export default function InternalServiceOrdersPage() {
  const { orders, loading, error } = useInternalServiceOrders();
  const router = useRouter();

  return (
    <Box p={8}>
      <Heading size="lg" mb={6}>Ordens de Serviço Internas (Técnicos)</Heading>
      <Button
        leftIcon={<Plus size={18} />}
        colorScheme="blue"
        mb={4}
        onClick={() => router.push('/internal-service-orders/new')}
      >
        Nova OS Interna
      </Button>
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Título</Th>
              <Th>Técnico</Th>
              <Th>Início</Th>
              <Th>Fim</Th>
              <Th>Tipo</Th>
              <Th>Setor</Th>
              <Th>Local</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {orders.map(order => (
              <Tr key={order.id}>
                <Td>{order.title}</Td>
                <Td>{order.technician?.name || '-'}</Td>
                <Td>{order.start_date ? new Date(order.start_date).toLocaleString('pt-BR') : '-'}</Td>
                <Td>{order.end_date ? new Date(order.end_date).toLocaleString('pt-BR') : '-'}</Td>
                <Td>{order.type}</Td>
                <Td>{order.sector?.name || '-'}</Td>
                <Td>{order.location?.name || '-'}</Td>
                <Td>
                  <Button size="sm" colorScheme="blue" onClick={() => router.push(`/internal-service-orders/${order.id}`)}>
                    Detalhes
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
