'use client';

import {
  Badge,
  Box,
  Center,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusColor,
  purchaseRequestStatusLabel,
} from '../../types';
import { PurchaseRequestEmptyState } from './PurchaseRequestEmptyState';

interface PurchaseRequestListTableProps {
  items: PurchaseRequestDTO[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showCreator?: boolean;
  onCreate?: () => void;
  getDetailHref?: (id: string) => string;
}

export function PurchaseRequestListTable({
  items,
  loading = false,
  error = null,
  emptyMessage = 'Nenhuma solicitação de compra encontrada.',
  showCreator = false,
  onCreate,
  getDetailHref,
}: PurchaseRequestListTableProps) {
  const router = useRouter();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  if (loading) {
    return (
      <Center flex="1" py={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center flex="1" py={8}>
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  if (items.length === 0) {
    return onCreate ? <PurchaseRequestEmptyState onCreate={onCreate} /> : (
      <Center flex="1" py={8}>
        <Text color="gray.500">{emptyMessage}</Text>
      </Center>
    );
  }

  return (
    <Box
      flex="1"
      minH={0}
      overflowX="auto"
      overflowY="auto"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
    >
      <Table size="sm" variant="simple">
        <Thead position="sticky" top={0} zIndex={1} bg={headerBg}>
          <Tr>
            <Th>Código</Th>
            <Th>Status</Th>
            <Th>Prioridade</Th>
            {showCreator && <Th>Solicitante</Th>}
            <Th>Itens</Th>
            <Th>Criada em</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item) => (
            <Tr
              key={item.id}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onClick={() =>
                router.push(getDetailHref?.(item.id) ?? `/procurement/solicitacoes/${item.id}`)
              }
            >
              <Td color={textColor} fontWeight="medium">
                {item.display_code}
              </Td>
              <Td>
                <Badge colorScheme={purchaseRequestStatusColor(item.status)}>
                  {purchaseRequestStatusLabel(item.status)}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={purchaseRequestPriorityColor(item.priority)}>
                  {purchaseRequestPriorityLabel(item.priority)}
                </Badge>
              </Td>
              {showCreator && (
                <Td color={textColor}>
                  {'name' in item.created_by ? item.created_by.name : '—'}
                </Td>
              )}
              <Td color={textColor}>{item.items.length}</Td>
              <Td color={textColor} whiteSpace="nowrap">
                {new Date(item.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
