'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import { useRouter } from 'next/navigation';
import {
  approvePurchaseRequest,
  PurchaseRequestDetailModal,
  PurchaseRequestFiltersDrawer,
  PurchaseRequestPageShell,
  PurchaseRequestToolbar,
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusColor,
  purchaseRequestStatusLabel,
  rejectPurchaseRequest,
  useDirectorApprovalFilters,
  usePollingRefresh,
  useProcurementMenuBadges,
  usePurchaseRequests,
  useMarkMenuBadgeSeen,
} from '@/features/procurement';
import { badgeRouteAfterAction } from '@/features/procurement/utils/menuBadgeRoutes';

import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';

const ALLOWED_ROLES = ['DIRECTOR', 'ADMIN'];

type ActionType = 'approve' | 'reject';

export default function PurchaseRequestApprovalsPage() {
  const router = useRouter();
  const toast = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchaseRequestDTO | null>(null);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType>('approve');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { refreshRouteCount } = useProcurementMenuBadges();

  const {
    isOpen: isActionOpen,
    onOpen: onActionOpen,
    onClose: onActionClose,
  } = useDisclosure();
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const {
    isOpen: isFilterOpen,
    onOpen: onFilterOpen,
    onClose: onFilterClose,
  } = useDisclosure();

  const {
    search,
    setSearch,
    drawerFilters,
    setDrawerFilters,
    clearDrawerFilters,
    filtersActive,
    apiFilters,
    filterItems,
  } = useDirectorApprovalFilters(currentUserId);

  const stableApiFilters = useMemo(() => apiFilters, [JSON.stringify(apiFilters)]);

  const { items, loading, error, reload, refreshSilent } = usePurchaseRequests(stableApiFilters);
  const displayedItems = useMemo(() => filterItems(items), [items, filterItems]);

  usePollingRefresh({
    enabled: authorized && !isActionOpen && !isDetailOpen && !isFilterOpen,
    onTick: refreshSilent,
  });

  useMarkMenuBadgeSeen('aprovacoes-sc', authorized);

  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    const access = assertPageAccess(resolveUserRoles(user), ALLOWED_ROLES);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }
    setCurrentUserId(user.id ?? '');
    setToken(localStorage.getItem('@ti-assistant:token'));
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar fila de aprovação',
        description: error,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const openActionModal = useCallback(
    (request: PurchaseRequestDTO, type: ActionType) => {
      setSelected(request);
      setActionType(type);
      setReason('');
      onActionOpen();
    },
    [onActionOpen],
  );

  const openDetailModal = useCallback(
    (request: PurchaseRequestDTO) => {
      setDetailRequestId(request.id);
      onDetailOpen();
    },
    [onDetailOpen],
  );

  const handleDetailClose = useCallback(() => {
    onDetailClose();
    setDetailRequestId(null);
  }, [onDetailClose]);

  const handleConfirm = async () => {
    if (!selected) return;

    if (actionType === 'reject' && !reason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da rejeição.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!token) {
      toast({
        title: 'Sessão expirada',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await approvePurchaseRequest(token, selected.id, {
          reason: reason.trim() || undefined,
        });
        toast({
          title: 'Solicitação aprovada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await rejectPurchaseRequest(token, selected.id, { reason: reason.trim() });
        toast({
          title: 'Solicitação rejeitada',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      onActionClose();
      reload();
      void refreshRouteCount(badgeRouteAfterAction(actionType === 'approve' ? 'approve_sc' : 'reject_sc'));
    } catch (err) {
      toast({
        title: 'Erro ao processar solicitação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!authorized) {
    return null;
  }

  return (
    <>
      <PurchaseRequestPageShell
        title="Aprovações de SC"
        toolbar={
          <PurchaseRequestToolbar
            search={search}
            onSearchChange={setSearch}
            filtersActive={filtersActive}
            onOpenFilters={onFilterOpen}
            onNewRequest={() => {}}
            showNewRequest={false}
          />
        }
      >
        {loading ? (
          <Center flex="1" py={12}>
            <Spinner size="xl" />
          </Center>
        ) : displayedItems.length === 0 ? (
          <Center flex="1" py={12}>
            <Text color="gray.500" textAlign="center">
              Nenhuma solicitação encontrada com os filtros atuais.
            </Text>
          </Center>
        ) : (
          <Box flex="1" minH={0} overflowX="auto" overflowY="auto">
            <Table size="sm">
              <Thead position="sticky" top={0} zIndex={1} bg={headerBg}>
                <Tr>
                  <Th>Código</Th>
                  <Th>Status</Th>
                  <Th>Prioridade</Th>
                  <Th>Solicitante</Th>
                  <Th>Justificativa</Th>
                  <Th>Itens</Th>
                  <Th>Criada em</Th>
                  <Th textAlign="right">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {displayedItems.map((item) => (
                  <Tr key={item.id} _hover={{ bg: hoverBg }}>
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
                    <Td color={textColor}>
                      {'name' in item.created_by ? item.created_by.name : '—'}
                    </Td>
                    <Td color={textColor} maxW="240px" isTruncated title={item.justification}>
                      {item.justification}
                    </Td>
                    <Td color={textColor}>{item.items.length}</Td>
                    <Td color={textColor}>
                      {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Td>
                    <Td>
                      <HStack justify="flex-end" spacing={2}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailModal(item)}
                        >
                          Ver detalhes
                        </Button>
                        {item.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => openActionModal(item, 'approve')}
                              data-testid="pr-approve"
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => openActionModal(item, 'reject')}
                              data-testid="pr-reject"
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </PurchaseRequestPageShell>

      <PurchaseRequestFiltersDrawer
        isOpen={isFilterOpen}
        onClose={onFilterClose}
        filters={drawerFilters}
        onChange={setDrawerFilters}
        onClear={() => {
          clearDrawerFilters();
          onFilterClose();
        }}
      />

      <PurchaseRequestDetailModal
        isOpen={isDetailOpen}
        onClose={handleDetailClose}
        purchaseRequestId={detailRequestId}
        token={token}
      />

      <Modal isOpen={isActionOpen} onClose={onActionClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'approve' ? 'Aprovar solicitação' : 'Rejeitar solicitação'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selected && (
              <Box>
                <Text fontSize="sm" mb={3}>
                  <strong>{selected.display_code}</strong> —{' '}
                  {purchaseRequestStatusLabel(selected.status)}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {selected.justification}
                </Text>
                <FormControl isRequired={actionType === 'reject'}>
                  <FormLabel>
                    {actionType === 'reject' ? 'Motivo da rejeição' : 'Observação (opcional)'}
                  </FormLabel>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      actionType === 'reject'
                        ? 'Descreva o motivo da rejeição'
                        : 'Comentário opcional'
                    }
                    rows={4}
                  />
                </FormControl>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onActionClose} isDisabled={submitting}>
              Cancelar
            </Button>
            <Button
              colorScheme={actionType === 'approve' ? 'green' : 'red'}
              onClick={handleConfirm}
              isLoading={submitting}
              loadingText="Processando..."
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
