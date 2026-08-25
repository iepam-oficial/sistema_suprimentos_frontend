'use client';

import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DemandSupplySummaryDTO, InventoryAllocationDTO } from '@ti-assistant/contracts';
import { PurchaseRequestPageShell } from '@/features/procurement';
import { fetchDemandSupplies } from '@/features/supply-requests/api/demandSupplyApi';
import {
  confirmAllocationDelivery,
  fetchAllocations,
} from '@/features/inventory/api/inventoryApi';
import { DemandSupplyDrawer } from '@/app/(dashboard)/supply-requests/admin/components/DemandSupplyDrawer';
import {
  formatAggregateStatusLabel,
  formatDemandSupplyCode,
} from '@/features/supply-requests/utils/formatDemandSupply';

import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

const ALLOWED_ROLES = ['MANAGER', 'ADMIN'];

function formatDeadline(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

export default function PostReceiptDeliveriesPage() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demandSupplies, setDemandSupplies] = useState<DemandSupplySummaryDTO[]>([]);
  const [allocations, setAllocations] = useState<InventoryAllocationDTO[]>([]);
  const [selectedDsId, setSelectedDsId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const loadQueue = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const [dsResult, allocResult] = await Promise.all([
        fetchDemandSupplies(token, { origin: 'sc', limit: 100 }),
        fetchAllocations(token, { origin: 'sc' }),
      ]);

      setDemandSupplies(
        dsResult.items.filter((item) => item.aggregate_status !== 'DELIVERED'),
      );
      setAllocations(
        (allocResult as InventoryAllocationDTO[]).filter(
          (item) => item.status === 'APPROVED' || item.status === 'DELIVERED',
        ),
      );
    } catch (err) {
      toast({
        title: 'Erro ao carregar entregas pós-recebimento',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const access = assertPageAccess(resolveUserRoles(user), ALLOWED_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) {
      void loadQueue();
    }
  }, [authorized, loadQueue]);

  const openDemandSupply = (id: string) => {
    setSelectedDsId(id);
    onOpen();
  };

  const handleConfirmAllocation = async (allocation: InventoryAllocationDTO) => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      router.push('/login');
      return;
    }

    setConfirmingId(allocation.id);
    try {
      await confirmAllocationDelivery(allocation.id, true, token);
      toast({
        title: 'Entrega confirmada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadQueue();
    } catch (err) {
      toast({
        title: 'Erro ao confirmar entrega',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setConfirmingId(null);
    }
  };

  if (!authorized) {
    return null;
  }

  return (
    <PurchaseRequestPageShell title="Entregas pós-recebimento">
      <VStack align="stretch" spacing={4} h="full" minH={0} overflow="auto">
        <Text fontSize="sm" color={mutedColor}>
          Pedidos e alocações gerados automaticamente a partir de solicitações de compra
          finalizadas. Use as confirmações de entrega do fluxo atual.
        </Text>

        {loading ? (
          <HStack justify="center" py={10}>
            <Spinner />
          </HStack>
        ) : (
          <>
            <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
              <Heading size="sm" px={3} py={2} bg={headerBg}>
                Suprimentos (DemandSupply)
              </Heading>
              {demandSupplies.length === 0 ? (
                <Text px={3} py={4} fontSize="sm" color={mutedColor}>
                  Nenhuma entrega de suprimento com origem SC pendente.
                </Text>
              ) : (
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Código</Th>
                      <Th>Destino</Th>
                      <Th>Prazo</Th>
                      <Th>Status</Th>
                      <Th>Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {demandSupplies.map((item) => (
                      <Tr key={item.id}>
                        <Td color={textColor} fontWeight="medium">
                          {item.demand_supply_code || formatDemandSupplyCode(item.code)}
                        </Td>
                        <Td color={textColor}>{item.destination}</Td>
                        <Td color={textColor}>{formatDeadline(item.delivery_deadline)}</Td>
                        <Td>
                          <Badge>
                            {formatAggregateStatusLabel(item.aggregate_status)}
                          </Badge>
                        </Td>
                        <Td>
                          <Button size="xs" colorScheme="blue" onClick={() => openDemandSupply(item.id)}>
                            Abrir
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>

            <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
              <Heading size="sm" px={3} py={2} bg={headerBg}>
                Patrimônio (Alocações)
              </Heading>
              {allocations.length === 0 ? (
                <Text px={3} py={4} fontSize="sm" color={mutedColor}>
                  Nenhuma alocação com origem SC.
                </Text>
              ) : (
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Item</Th>
                      <Th>Destino</Th>
                      <Th>Prazo</Th>
                      <Th>Status</Th>
                      <Th>Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {allocations.map((item) => (
                      <Tr key={item.id}>
                        <Td color={textColor}>
                          {item.inventory?.name ?? item.inventory_id}
                        </Td>
                        <Td color={textColor}>{item.destination}</Td>
                        <Td color={textColor}>{formatDeadline(item.delivery_deadline)}</Td>
                        <Td>
                          <Badge>{item.status}</Badge>
                        </Td>
                        <Td>
                          {item.status === 'APPROVED' && !item.manager_delivery_confirmation ? (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              isLoading={confirmingId === item.id}
                              onClick={() => void handleConfirmAllocation(item)}
                            >
                              Confirmar entrega
                            </Button>
                          ) : (
                            <Text fontSize="xs" color={mutedColor}>
                              —
                            </Text>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          </>
        )}
      </VStack>

      <DemandSupplyDrawer
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSelectedDsId(null);
          void loadQueue();
        }}
        demandSupplyId={selectedDsId}
        placement="right"
      />
    </PurchaseRequestPageShell>
  );
}
