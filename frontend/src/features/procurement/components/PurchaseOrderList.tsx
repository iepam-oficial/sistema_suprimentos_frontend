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
import type { PurchaseOrderDTO } from '@ti-assistant/contracts';
import { createGoodsReceipt } from '../api/goodsReceiptApi';
import { sendPurchaseOrder } from '../api/purchaseOrderApi';
import { purchaseOrderStatusColor, purchaseOrderStatusLabel } from '../types';

interface PurchaseOrderListProps {
  items: PurchaseOrderDTO[];
  loading?: boolean;
  onReload?: () => void;
  canManage?: boolean;
}

export function PurchaseOrderList({
  items,
  loading = false,
  onReload,
  canManage = false,
}: PurchaseOrderListProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [startingReceiptId, setStartingReceiptId] = useState<string | null>(null);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const filteredItems = items.filter((item) => {
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.display_code.toLowerCase().includes(search) ||
      (item.quote_display_code ?? '').toLowerCase().includes(search) ||
      (item.supplier?.name ?? '').toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  const handleSend = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSendingId(orderId);
    try {
      await sendPurchaseOrder(token, orderId);
      toast({
        title: 'Pedido enviado',
        description: 'O fornecedor foi notificado por e-mail.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onReload?.();
    } catch (err) {
      toast({
        title: 'Erro ao enviar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleStartReceipt = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setStartingReceiptId(orderId);
    try {
      const receipt = await createGoodsReceipt(token, { purchase_order_id: orderId });
      toast({
        title: 'Recebimento iniciado',
        description: `Código ${receipt.display_code}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push(`/procurement/recebimentos/${receipt.id}`);
    } catch (err) {
      toast({
        title: 'Erro ao iniciar recebimento',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setStartingReceiptId(null);
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
            placeholder="Buscar por código, cotação ou fornecedor"
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
          <option value="SENT">Enviado</option>
          <option value="ACCEPTED">Aceito</option>
          <option value="DECLINED">Recusado</option>
          <option value="CANCELLED">Cancelado</option>
        </Select>
      </HStack>

      {filteredItems.length === 0 ? (
        <Center py={8}>
          <Text color="gray.500">Nenhum pedido de compra encontrado.</Text>
        </Center>
      ) : (
        <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Código</Th>
                <Th>Status</Th>
                <Th>Fornecedor</Th>
                <Th>Cotação</Th>
                <Th>Criado em</Th>
                {canManage && <Th textAlign="right">Ações</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((item) => (
                <Tr key={item.id} _hover={{ bg: hoverBg }}>
                  <Td color={textColor} fontWeight="medium">
                    {item.display_code}
                  </Td>
                  <Td>
                    <Badge colorScheme={purchaseOrderStatusColor(item.status)}>
                      {purchaseOrderStatusLabel(item.status)}
                    </Badge>
                  </Td>
                  <Td color={textColor}>{item.supplier?.name ?? '—'}</Td>
                  <Td color={textColor}>{item.quote_display_code ?? '—'}</Td>
                  <Td color={textColor}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Td>
                  {canManage && (
                    <Td textAlign="right">
                      <HStack justify="flex-end" spacing={2}>
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
                        {item.status === 'ACCEPTED' && (
                          <Button
                            size="xs"
                            colorScheme="green"
                            isLoading={startingReceiptId === item.id}
                            loadingText="Iniciando..."
                            onClick={(e) => handleStartReceipt(e, item.id)}
                          >
                            Iniciar recebimento
                          </Button>
                        )}
                      </HStack>
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
