import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useColorMode,
  useColorModeValue,
  useMediaQuery,
  useToast,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Divider,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
} from '@chakra-ui/react';
import type { DemandSupplyApprovalDTO, SupplyRequestDTO } from '@ti-assistant/contracts';
import { SearchIcon, CheckCircle, X } from 'lucide-react';
import { SupplyRequest } from '../../types';
import { useFilters } from '@/contexts/GlobalContext';
import {
  confirmApprovalBatchRequester,
  fetchPendingConfirmations,
} from '@/features/supply-requests/api/demandSupplyApi';

interface MyRequestsTabProps {
  requests: SupplyRequest[];
  onRequesterConfirmation: (requestId: string, confirmation: boolean, token: string, isCustom: boolean) => void;
  onCancelRequest: (requestId: string, token: string, isCustom: boolean) => void;
  onBatchConfirmed?: () => void | Promise<void>;
}

function getItemName(item: SupplyRequestDTO): string {
  return item.is_custom ? item.item_name ?? '-' : item.supply?.name ?? '-';
}

function getNonCustomItems(approval: DemandSupplyApprovalDTO): SupplyRequestDTO[] {
  return (approval.items ?? []).filter((item) => !item.is_custom);
}

function formatBatchItemsSummary(approval: DemandSupplyApprovalDTO): string {
  const items = getNonCustomItems(approval);
  const count = items.length;
  const itemLabel = count === 1 ? 'item aprovado' : 'itens aprovados';
  return `${count} ${itemLabel}`;
}

function formatBatchItemsList(approval: DemandSupplyApprovalDTO): string {
  return getNonCustomItems(approval)
    .map((item) => `${getItemName(item)} (${item.quantity})`)
    .join(', ');
}

export function MyRequestsTab({
  requests,
  onRequesterConfirmation,
  onCancelRequest,
  onBatchConfirmed,
}: MyRequestsTabProps) {
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter } = useFilters();
  const toast = useToast();
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const sectionBorder = useColorModeValue('gray.200', 'gray.600');
  const sectionBg = useColorModeValue('white', 'rgba(45, 55, 72, 0.5)');
  const entryBorder = useColorModeValue('gray.100', 'rgba(255,255,255,0.08)');

  const [pendingBatches, setPendingBatches] = useState<DemandSupplyApprovalDTO[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [confirmingBatchId, setConfirmingBatchId] = useState<string | null>(null);

  const visiblePendingBatches = useMemo(
    () =>
      pendingBatches.filter((approval) => getNonCustomItems(approval).length > 0),
    [pendingBatches],
  );

  const loadPendingConfirmations = useCallback(async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setPendingBatches([]);
      return;
    }

    setIsLoadingPending(true);
    try {
      const batches = await fetchPendingConfirmations(token);
      setPendingBatches(batches);
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Erro ao carregar confirmações pendentes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingPending(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPendingConfirmations();
  }, [loadPendingConfirmations]);

  const handleBatchConfirmation = async (approvalId: string) => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({
        title: 'Erro',
        description: 'Token não encontrado',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setConfirmingBatchId(approvalId);
    try {
      await confirmApprovalBatchRequester(token, approvalId, true);
      toast({
        title: 'Sucesso',
        description: 'Recebimento confirmado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadPendingConfirmations();
      await onBatchConfirmed?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao confirmar recebimento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setConfirmingBatchId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'DELIVERED': return 'purple';
      case 'CANCELLED': return 'gray';
      default: return 'yellow';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'APPROVED': return 'Aprovado';
      case 'REJECTED': return 'Rejeitado';
      case 'DELIVERED': return 'Entregue';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Card bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} backdropFilter="blur(12px)" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}>
      <CardBody>
        {!isMobile && (
          <HStack mb={6} gap={4}>
            <InputGroup maxW="350px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
              </InputLeftElement>
              <Input
                placeholder="Buscar por suprimento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
                borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              />
            </InputGroup>
            <Select
              placeholder="Filtrar por status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              maxW="200px"
              bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
              borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
            </Select>
          </HStack>
        )}
        {!isLoadingPending && visiblePendingBatches.length > 0 && (
          <Box
            mb={6}
            borderWidth="1px"
            borderColor={sectionBorder}
            borderRadius="md"
            bg={sectionBg}
            p={4}
          >
            <Text
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color={mutedColor}
              mb={3}
            >
              Confirmações pendentes
            </Text>
            <VStack spacing={3} align="stretch">
              {visiblePendingBatches.map((approval) => (
                <Box
                  key={approval.id}
                  p={3}
                  borderWidth="1px"
                  borderColor={entryBorder}
                  borderRadius="md"
                >
                  <HStack
                    justify="space-between"
                    align={isMobile ? 'stretch' : 'center'}
                    flexDirection={isMobile ? 'column' : 'row'}
                    spacing={3}
                  >
                    <VStack align="start" spacing={1} flex="1">
                      <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                        Lote {approval.report_id} — {formatBatchItemsSummary(approval)}
                      </Text>
                      <Text fontSize="sm" color={mutedColor}>
                        {formatBatchItemsList(approval)}
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<CheckCircle size={16} />}
                      onClick={() => handleBatchConfirmation(approval.id)}
                      isLoading={confirmingBatchId === approval.id}
                      isDisabled={confirmingBatchId !== null && confirmingBatchId !== approval.id}
                      alignSelf={isMobile ? 'stretch' : 'flex-end'}
                      flexShrink={0}
                    >
                      Confirmar recebimento
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
        {requests.length === 0 ? (
          <VStack align="center" justify="center" py={8}>
            <Image src="/Task-complete.svg" alt="Nenhuma requisição encontrada" maxW="300px" mb={4} />
            <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} fontSize="lg">Nenhuma requisição encontrada</Text>
          </VStack>
        ) : isMobile ? (
          <VStack spacing={4} align="stretch">
            {requests.map((request) => (
              <Card key={request.id} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} borderRadius={0}>
                <CardBody p={4}>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontWeight="bold" fontSize="md" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                          {request.is_custom ? request.item_name : request.supply?.name}
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {request.quantity} {request.is_custom ? request.unit?.symbol || request.unit?.name : request.supply?.unit?.symbol || request.supply?.unit?.name}
                        </Text>
                      </VStack>
                      <Badge colorScheme={getStatusColor(request.status)} size="sm">
                        {getStatusText(request.status)}
                      </Badge>
                    </HStack>
                    <Divider />
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Data:</Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Requerente:</Text>
                        <Badge colorScheme={request.requester_confirmation ? 'green' : 'gray'} size="xs">
                          {request.requester_confirmation ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Gerente:</Text>
                        <Badge colorScheme={request.manager_delivery_confirmation ? 'green' : 'gray'} size="xs">
                          {request.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </HStack>
                    </VStack>
                    <VStack spacing={2} w="full">
                      {request.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<CheckCircle size={16} />}
                          onClick={() => onRequesterConfirmation(request.id, true, localStorage.getItem('@ti-assistant:token') || '', request.is_custom || false)}
                          isDisabled={request.requester_confirmation}
                          bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined}
                          _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }}
                          transition="all 0.3s ease"
                          w="full"
                        >
                          Confirmar Recebimento
                        </Button>
                      )}
                      {(request.status === 'PENDING' || request.status === 'APPROVED') && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<X size={16} />}
                          onClick={() => onCancelRequest(request.id, localStorage.getItem('@ti-assistant:token') || '', request.is_custom || false)}
                          bg={colorMode === 'dark' ? 'rgba(220, 38, 38, 0.1)' : undefined}
                          _hover={{ bg: colorMode === 'dark' ? 'rgba(220, 38, 38, 0.2)' : undefined, transform: 'translateY(-1px)' }}
                          transition="all 0.3s ease"
                          w="full"
                        >
                          Cancelar
                        </Button>
                      )}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
              <Thead>
                <Tr>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Suprimento</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>Quantidade</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Status</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>Data</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', lg: 'table-cell' }}>Confirmações</Th>
                  <Th color={colorMode === 'dark' ? 'white' : 'gray.800'}>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {requests.map((request) => (
                  <Tr key={request.id}>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{request.is_custom ? request.item_name : request.supply?.name}</Text>
                      </VStack>
                    </Td>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>
                      {request.quantity} {request.is_custom ? request.unit?.symbol || request.unit?.name : request.supply?.unit?.symbol || request.supply?.unit?.name}
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(request.status)} size={{ base: 'sm', md: 'md' }}>
                        {getStatusText(request.status)}
                      </Badge>
                    </Td>
                    <Td color={colorMode === 'dark' ? 'white' : 'gray.800'} display={{ base: 'none', md: 'table-cell' }}>
                      {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </Td>
                    <Td display={{ base: 'none', lg: 'table-cell' }}>
                      <VStack spacing={2} align="start">
                        <HStack>
                          <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Requerente:</Text>
                          <Badge colorScheme={request.requester_confirmation ? 'green' : 'gray'}>
                            {request.requester_confirmation ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </HStack>
                        <HStack>
                          <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'}>Gerente:</Text>
                          <Badge colorScheme={request.manager_delivery_confirmation ? 'green' : 'gray'}>
                            {request.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {request.status === 'APPROVED' && (
                          <Button
                            size={{ base: 'xs', md: 'sm' }}
                            colorScheme="blue"
                            leftIcon={<CheckCircle size={isMobile ? 14 : 16} />}
                            onClick={() => onRequesterConfirmation(request.id, true, localStorage.getItem('@ti-assistant:token') || '', request.is_custom || false)}
                            isDisabled={request.requester_confirmation}
                            bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined}
                            _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }}
                            transition="all 0.3s ease"
                          >
                            {isMobile ? 'Confirmar' : 'Confirmar Recebimento'}
                          </Button>
                        )}
                        {(request.status === 'PENDING' || request.status === 'APPROVED') && (
                          <Button
                            size={{ base: 'xs', md: 'sm' }}
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<X size={isMobile ? 14 : 16} />}
                            onClick={() => onCancelRequest(request.id, localStorage.getItem('@ti-assistant:token') || '', request.is_custom || false)}
                            bg={colorMode === 'dark' ? 'rgba(220, 38, 38, 0.1)' : undefined}
                            _hover={{ bg: colorMode === 'dark' ? 'rgba(220, 38, 38, 0.2)' : undefined, transform: 'translateY(-1px)' }}
                            transition="all 0.3s ease"
                          >
                            Cancelar
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </CardBody>
    </Card>
  );
} 