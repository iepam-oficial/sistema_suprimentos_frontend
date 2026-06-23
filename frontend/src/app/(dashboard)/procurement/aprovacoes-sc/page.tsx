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
  VStack,
} from '@chakra-ui/react';
import type { PurchaseRequestDTO } from '@ti-assistant/contracts';
import {
  approvePurchaseRequest,
  purchaseRequestPriorityColor,
  purchaseRequestPriorityLabel,
  purchaseRequestStatusLabel,
  rejectPurchaseRequest,
  usePurchaseRequests,
} from '@/features/procurement';
import { useRouter } from 'next/navigation';

const ALLOWED_ROLES = ['DIRECTOR', 'ADMIN'];

type ActionType = 'approve' | 'reject';

export default function PurchaseRequestApprovalsPage() {
  const router = useRouter();
  const toast = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequestDTO | null>(null);
  const [actionType, setActionType] = useState<ActionType>('approve');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { items, loading, error, reload } = usePurchaseRequests({
    status: 'PENDING_APPROVAL',
  });

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
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
      onOpen();
    },
    [onOpen],
  );

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

    const token = localStorage.getItem('@ti-assistant:token');
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

      onClose();
      reload();
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
        <Heading size="lg" color={headingColor}>
          Aprovações de Solicitações de Compra
        </Heading>
        <Text color="gray.500" fontSize="sm">
          Solicitações aguardando aprovação do diretor.
        </Text>
        <Divider />

        {loading ? (
          <Center py={12}>
            <Spinner size="xl" />
          </Center>
        ) : items.length === 0 ? (
          <Center py={12}>
            <Text color="gray.500">Nenhuma solicitação pendente de aprovação.</Text>
          </Center>
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Código</Th>
                  <Th>Prioridade</Th>
                  <Th>Solicitante</Th>
                  <Th>Justificativa</Th>
                  <Th>Itens</Th>
                  <Th>Criada em</Th>
                  <Th textAlign="right">Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((item) => (
                  <Tr key={item.id} _hover={{ bg: hoverBg }}>
                    <Td color={textColor} fontWeight="medium">
                      {item.display_code}
                    </Td>
                    <Td>
                      <Badge colorScheme={purchaseRequestPriorityColor(item.priority)}>
                        {purchaseRequestPriorityLabel(item.priority)}
                      </Badge>
                    </Td>
                    <Td color={textColor}>
                      {'name' in item.created_by ? item.created_by.name : '—'}
                    </Td>
                    <Td color={textColor} maxW="280px" isTruncated title={item.justification}>
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
                          colorScheme="green"
                          onClick={() => openActionModal(item, 'approve')}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => openActionModal(item, 'reject')}
                        >
                          Rejeitar
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'approve' ? 'Aprovar solicitação' : 'Rejeitar solicitação'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selected && (
              <VStack align="stretch" spacing={3}>
                <Text fontSize="sm">
                  <strong>{selected.display_code}</strong> —{' '}
                  {purchaseRequestStatusLabel(selected.status)}
                </Text>
                <Text fontSize="sm" color="gray.600">
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
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={submitting}>
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
    </Box>
  );
}
