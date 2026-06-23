'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import type { PortalPurchaseOrderContextDTO, PurchaseOrderStatus } from '@ti-assistant/contracts';
import {
  fetchPortalPurchaseOrder,
  respondPortalPurchaseOrder,
} from '@/features/procurement/api/portalPurchaseOrderApi';

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Aguardando resposta',
  ACCEPTED: 'Aceito',
  DECLINED: 'Recusado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'gray',
  SENT: 'yellow',
  ACCEPTED: 'green',
  DECLINED: 'red',
  CANCELLED: 'gray',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default function PortalPedidoPage() {
  const params = useParams();
  const token = params.token as string;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [context, setContext] = useState<PortalPurchaseOrderContextDTO | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const pageBg = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.300');

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const data = await fetchPortalPurchaseOrder(token);
      setContext(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('inválido')) {
        setNotFound(true);
      } else {
        toast({
          title: 'Erro ao carregar pedido',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) {
      loadOrder();
    }
  }, [token, loadOrder]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const data = await respondPortalPurchaseOrder(token, { action: 'accept' });
      setContext(data);
      toast({
        title: 'Pedido aceito',
        description: 'Obrigado pela confirmação.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao aceitar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    const trimmedReason = declineReason.trim();
    if (!trimmedReason) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da recusa.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setActionLoading(true);
      const data = await respondPortalPurchaseOrder(token, {
        action: 'decline',
        reason: trimmedReason,
      });
      setContext(data);
      setShowDeclineForm(false);
      toast({
        title: 'Pedido recusado',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao recusar pedido',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Center minH="100vh" bg={pageBg}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (notFound || !context) {
    return (
      <Center minH="100vh" bg={pageBg} p={8}>
        <VStack spacing={4} textAlign="center">
          <FileText size={48} />
          <Heading size="lg" color={headingColor}>
            Pedido inválido ou expirado
          </Heading>
          <Text color={mutedColor}>
            O link do pedido de compra não é válido ou já expirou. Entre em contato com quem
            enviou o pedido.
          </Text>
        </VStack>
      </Center>
    );
  }

  const canRespond = context.status === 'SENT';

  return (
    <Box minH="100vh" bg={pageBg} py={8} px={4}>
      <Box maxW="900px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={headingColor} mb={2}>
              Portal do Pedido de Compra
            </Heading>
            <Text color={mutedColor}>
              Olá, <strong>{context.supplier_name}</strong>
            </Text>
          </Box>

          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={6}
          >
            <Flex justify="space-between" align="start" wrap="wrap" gap={4} mb={4}>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color={mutedColor}>
                  Pedido de compra
                </Text>
                <Heading size="md" color={headingColor}>
                  {context.display_code}
                </Heading>
              </VStack>
              <Badge colorScheme={STATUS_COLORS[context.status]} fontSize="sm" px={3} py={1}>
                {STATUS_LABELS[context.status]}
              </Badge>
            </Flex>

            <Divider mb={4} />

            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text color={mutedColor}>Cotação de origem</Text>
                <Text fontWeight="medium">{context.quote_display_code}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color={mutedColor}>Prazo de entrega</Text>
                <Text fontWeight="medium">{context.delivery_days} dias</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color={mutedColor}>Prazo de pagamento</Text>
                <Text fontWeight="medium">{context.payment_days} dias</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color={mutedColor}>Validade do link</Text>
                <Text fontWeight="medium">{formatDate(context.expires_at)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="semibold" color={headingColor}>
                  Valor total
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={headingColor}>
                  {formatCurrency(context.total_value)}
                </Text>
              </HStack>
            </VStack>
          </Box>

          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={6}
          >
            <Heading size="sm" mb={4} color={headingColor}>
              Itens do pedido
            </Heading>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Descrição</Th>
                    <Th isNumeric>Quantidade</Th>
                    <Th isNumeric>Preço unitário</Th>
                    <Th isNumeric>Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {context.items.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.description}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td isNumeric>{formatCurrency(item.unit_price)}</Td>
                      <Td isNumeric>{formatCurrency(item.total_price)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>

          {canRespond && (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              p={6}
            >
              <Heading size="sm" mb={2} color={headingColor}>
                Confirmar pedido?
              </Heading>
              <Text color={mutedColor} mb={4}>
                Aceite o pedido de compra para confirmar o fornecimento ou recuse informando o
                motivo.
              </Text>
              <HStack spacing={3}>
                <Button
                  colorScheme="green"
                  onClick={handleAccept}
                  isLoading={actionLoading}
                  loadingText="Aceitando..."
                >
                  Aceitar pedido
                </Button>
                <Button
                  variant="outline"
                  colorScheme="red"
                  onClick={() => setShowDeclineForm((v) => !v)}
                  isDisabled={actionLoading}
                >
                  Recusar pedido
                </Button>
              </HStack>
            </Box>
          )}

          {showDeclineForm && canRespond && (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              p={6}
            >
              <FormControl mb={4} isRequired>
                <FormLabel>Motivo da recusa</FormLabel>
                <Textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Informe o motivo da recusa..."
                  rows={3}
                />
              </FormControl>
              <HStack>
                <Button
                  colorScheme="red"
                  onClick={handleDecline}
                  isLoading={actionLoading}
                  loadingText="Recusando..."
                >
                  Confirmar recusa
                </Button>
                <Button variant="ghost" onClick={() => setShowDeclineForm(false)}>
                  Cancelar
                </Button>
              </HStack>
            </Box>
          )}

          {context.status === 'ACCEPTED' && (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              p={6}
              textAlign="center"
            >
              <Text color={mutedColor}>
                Você aceitou este pedido de compra. Obrigado pela confirmação.
              </Text>
            </Box>
          )}

          {context.status === 'DECLINED' && (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              p={6}
              textAlign="center"
            >
              <Text color={mutedColor}>Você recusou este pedido de compra.</Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
