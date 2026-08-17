'use client';

import {
  Badge,
  Box,
  Center,
  HStack,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  abcBadgeColorScheme,
  abcBadgeLabel,
} from '@/features/catalog/abcClassification';
import {
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusColor,
  purchaseRequestStatusLabel,
} from '../../types';
import { PurchaseRequestEmptyState } from './PurchaseRequestEmptyState';

function classAItemDescriptions(request: PurchaseRequestDTO): string[] {
  return request.items
    .filter((line) => line.abc_classification === 'A')
    .map((line) => line.description);
}

interface PurchaseRequestListTableProps {
  items: PurchaseRequestDTO[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showCreator?: boolean;
  /** When true (fila de compras), highlight SCs that contain Class A items. */
  highlightClassA?: boolean;
  onCreate?: () => void;
  getDetailHref?: (id: string) => string;
}

export function PurchaseRequestListTable({
  items,
  loading = false,
  error = null,
  emptyMessage = 'Nenhuma solicitação de compra encontrada.',
  showCreator = false,
  highlightClassA = false,
  onCreate,
  getDetailHref,
}: PurchaseRequestListTableProps) {
  const router = useRouter();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const classARowBg = useColorModeValue('orange.50', 'orange.900');
  const classAHoverBg = useColorModeValue('orange.100', 'orange.800');
  const classAMuted = useColorModeValue('orange.700', 'orange.200');

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
            <Th>Destino</Th>
            <Th>Prazo</Th>
            <Th>Itens</Th>
            <Th>Criada em</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item) => {
            const classANames = highlightClassA ? classAItemDescriptions(item) : [];
            const hasClassA = classANames.length > 0;

            return (
              <Tr
                key={item.id}
                cursor="pointer"
                bg={hasClassA ? classARowBg : undefined}
                _hover={{ bg: hasClassA ? classAHoverBg : hoverBg }}
                onClick={() =>
                  router.push(getDetailHref?.(item.id) ?? `/procurement/solicitacoes/${item.id}`)
                }
              >
                <Td color={textColor} fontWeight="medium">
                  <HStack spacing={2} align="flex-start">
                    <Text as="span">{item.display_code}</Text>
                    {hasClassA && (
                      <Badge colorScheme={abcBadgeColorScheme('A')} flexShrink={0}>
                        {abcBadgeLabel('A')}
                      </Badge>
                    )}
                  </HStack>
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
                <Td color={textColor}>{item.destination?.trim() || '—'}</Td>
                <Td color={textColor} whiteSpace="nowrap">
                  {item.delivery_deadline
                    ? new Date(item.delivery_deadline).toLocaleDateString('pt-BR')
                    : '—'}
                </Td>
                <Td color={textColor}>
                  {hasClassA ? (
                    <VStack align="stretch" spacing={0.5}>
                      <Text>{item.items.length}</Text>
                      <Text fontSize="xs" color={classAMuted} noOfLines={3} title={classANames.join(', ')}>
                        Classe A: {classANames.join(', ')}
                      </Text>
                    </VStack>
                  ) : (
                    item.items.length
                  )}
                </Td>
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
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
