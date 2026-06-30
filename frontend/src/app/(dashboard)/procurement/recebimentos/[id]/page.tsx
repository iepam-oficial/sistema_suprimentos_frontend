'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Heading,
  HStack,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import type { GoodsReceiptDTO } from '@ti-assistant/contracts';
import { GoodsReceiptStatus } from '@ti-assistant/contracts';
import { fetchGoodsReceiptById, GoodsReceiptWizard } from '@/features/procurement';

const ALLOWED_ROLES = ['MANAGER', 'ADMIN'];

function goodsReceiptStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IN_PROGRESS: 'Em andamento',
    PHYSICAL_DONE: 'Físico concluído',
    DOCUMENTAL_REVIEW: 'Revisão documental',
    PENDING_DIRECTOR: 'Aguardando diretor',
    APPROVED: 'Aprovado',
    BLOCKED: 'Bloqueado',
    CANCELLED: 'Cancelado',
  };
  return labels[status] ?? status;
}

function goodsReceiptStatusColor(status: string): string {
  const colors: Record<string, string> = {
    IN_PROGRESS: 'blue',
    PHYSICAL_DONE: 'cyan',
    DOCUMENTAL_REVIEW: 'purple',
    PENDING_DIRECTOR: 'orange',
    APPROVED: 'green',
    BLOCKED: 'red',
    CANCELLED: 'gray',
  };
  return colors[status] ?? 'gray';
}

export default function GoodsReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const receiptId = params.id as string;

  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<GoodsReceiptDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const loadReceipt = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchGoodsReceiptById(token, receiptId);
      setReceipt(data);
    } catch (err) {
      toast({
        title: 'Erro ao carregar recebimento',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [receiptId, toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setUserRole(user.role);
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) {
      loadReceipt();
    }
  }, [authorized, loadReceipt]);

  if (!authorized) {
    return null;
  }

  return (
    <Box w="full" h="full">
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        h="full"
      >
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={18} />}
              onClick={() => router.push('/procurement/pedidos')}
            >
              Voltar
            </Button>
            <Heading size="lg" color={headingColor}>
              Recebimento de mercadorias
            </Heading>
          </HStack>
          {receipt && (
            <Badge colorScheme={goodsReceiptStatusColor(receipt.status)} fontSize="sm" px={3} py={1}>
              {goodsReceiptStatusLabel(receipt.status)}
            </Badge>
          )}
        </HStack>

        {receipt && (
          <HStack spacing={4} flexWrap="wrap" fontSize="sm" color={mutedColor}>
            <Text>
              Pedido: <strong>{receipt.purchase_order?.display_code ?? receipt.purchase_order_id}</strong>
            </Text>
            {receipt.purchase_order?.supplier?.name && (
              <Text>
                Fornecedor: <strong>{receipt.purchase_order.supplier.name}</strong>
              </Text>
            )}
            {receipt.status === GoodsReceiptStatus.BLOCKED && (
              <Text color="red.500">Recebimento bloqueado por divergências críticas.</Text>
            )}
          </HStack>
        )}

        <Divider />

        {loading ? (
          <Center py={12}>
            <Spinner size="xl" />
          </Center>
        ) : receipt ? (
          <GoodsReceiptWizard
            receipt={receipt}
            onReceiptUpdated={setReceipt}
            userRole={userRole}
          />
        ) : (
          <Center py={12}>
            <Text color={mutedColor}>Recebimento não encontrado.</Text>
          </Center>
        )}
      </VStack>
    </Box>
  );
}
