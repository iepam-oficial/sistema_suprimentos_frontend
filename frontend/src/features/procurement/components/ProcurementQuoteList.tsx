'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
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
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ProcurementQuoteDTO } from '@ti-assistant/contracts';
import { sendProcurementQuote } from '../api/procurementQuoteApi';
import {
  procurementQuoteStatusColor,
  procurementQuoteStatusLabel,
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
} from '../types';

interface ProcurementQuoteListProps {
  items: ProcurementQuoteDTO[];
  loading?: boolean;
  onReload?: () => void;
  canSend?: boolean;
}

export function ProcurementQuoteList({
  items,
  loading = false,
  onReload,
  canSend = false,
}: ProcurementQuoteListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const filteredItems = items.filter((item) => {
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.display_code.toLowerCase().includes(search) ||
      (item.purchase_request?.display_code ?? '').toLowerCase().includes(search) ||
      (item.notes ?? '').toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  const handleSend = async (e: React.MouseEvent, quoteId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSendingId(quoteId);
    try {
      await sendProcurementQuote(token, quoteId);
      toast({
        title: 'Cotação enviada',
        description: 'Os fornecedores foram notificados por e-mail.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onReload?.();
    } catch (err) {
      toast({
        title: 'Erro ao enviar cotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSendingId(null);
    }
  };

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
            placeholder="Buscar por código ou SC"
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
          <option value="SENT">Enviada</option>
          <option value="AWAITING_APPROVAL">
            {procurementQuoteStatusLabel('AWAITING_APPROVAL')}
          </option>
          <option value="APPROVED">Aprovada</option>
          <option value="REJECTED">Rejeitada</option>
          <option value="CANCELLED">Cancelada</option>
        </Select>
      </HStack>

      {filteredItems.length === 0 ? (
        <Center py={8}>
          <Text color="gray.500">Nenhuma cotação de compra encontrada.</Text>
        </Center>
      ) : (
        <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Código</Th>
                <Th>Status</Th>
                <Th>Prioridade</Th>
                <Th>Solicitação</Th>
                <Th>Fornecedores</Th>
                <Th>Prazo resposta</Th>
                <Th>Criada em</Th>
                {canSend && <Th textAlign="right">Ações</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((item) => (
                <Tr
                  key={item.id}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => router.push(`/procurement/cotacoes/${item.id}`)}
                >
                  <Td color={textColor} fontWeight="medium">
                    {item.display_code}
                  </Td>
                  <Td>
                    <Badge colorScheme={procurementQuoteStatusColor(item.status)}>
                      {procurementQuoteStatusLabel(item.status)}
                    </Badge>
                  </Td>
                  <Td>
                    {item.purchase_request?.priority ? (
                      <Badge colorScheme={purchaseRequestPriorityColor(item.purchase_request.priority)}>
                        {purchaseRequestPriorityLabel(item.purchase_request.priority)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td color={textColor}>
                    {item.purchase_request?.display_code ?? '—'}
                  </Td>
                  <Td color={textColor}>{item.invites?.length ?? '—'}</Td>
                  <Td color={textColor}>
                    {new Date(item.response_deadline).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
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
                  {canSend && (
                    <Td textAlign="right">
                      {item.status === 'DRAFT' && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          isLoading={sendingId === item.id}
                          loadingText="Enviando..."
                          onClick={(e) => handleSend(e, item.id)}
                        >
                          Enviar
                        </Button>
                      )}
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
