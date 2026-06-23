'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Center,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusColor,
  purchaseRequestStatusLabel,
} from '../types';

interface PurchaseRequestListProps {
  items: PurchaseRequestDTO[];
  loading?: boolean;
  showCreator?: boolean;
}

export function PurchaseRequestList({
  items,
  loading = false,
  showCreator = false,
}: PurchaseRequestListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const filteredItems = items.filter((item) => {
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.display_code.toLowerCase().includes(search) ||
      item.justification.toLowerCase().includes(search) ||
      item.items.some((row) => row.description.toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box>
      <HStack spacing={4} mb={4} flexWrap="wrap">
        <InputGroup maxW="320px" size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon size={16} />
          </InputLeftElement>
          <Input
            placeholder="Buscar por código, justificativa ou item"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Select
          placeholder="Filtrar por status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          maxW="220px"
          size="sm"
        >
          <option value="">Todos</option>
          <option value="DRAFT">Rascunho</option>
          <option value="PENDING_APPROVAL">Aguardando aprovação</option>
          <option value="APPROVED">Aprovada</option>
          <option value="REJECTED">Rejeitada</option>
          <option value="CANCELLED">Cancelada</option>
        </Select>
      </HStack>

      {filteredItems.length === 0 ? (
        <Center py={8}>
          <Text color="gray.500">Nenhuma solicitação de compra encontrada.</Text>
        </Center>
      ) : (
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Código</Th>
                <Th>Status</Th>
                <Th>Prioridade</Th>
                {showCreator && <Th>Solicitante</Th>}
                <Th>Itens</Th>
                <Th>Plano de contas</Th>
                <Th>Criada em</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((item) => (
                <Tr
                  key={item.id}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => router.push(`/procurement/solicitacoes/${item.id}`)}
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
                  <Td color={textColor}>
                    {item.chart_of_account
                      ? `${item.chart_of_account.codigo} — ${item.chart_of_account.nome}`
                      : '—'}
                  </Td>
                  <Td color={textColor}>
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
      )}
    </Box>
  );
}
