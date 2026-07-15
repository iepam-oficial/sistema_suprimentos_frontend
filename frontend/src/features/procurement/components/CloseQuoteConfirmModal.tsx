'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { ProcurementQuoteDTO } from '@ti-assistant/contracts';
import {
  closeProcurementQuote,
  type CloseQuotePendingSupplier,
} from '../api/procurementQuoteApi';

interface CloseQuoteConfirmModalProps {
  quoteId: string;
  /** Fornecedores retornados no 409 que ficarão de fora do ranking. */
  pendingSuppliers: CloseQuotePendingSupplier[];
  isOpen: boolean;
  onClose: () => void;
  /** Chamado após encerramento confirmado com sucesso; recebe a cotação encerrada. */
  onSuccess: (quote: ProcurementQuoteDTO) => void;
}

export function CloseQuoteConfirmModal({
  quoteId,
  pendingSuppliers,
  isOpen,
  onClose,
  onSuccess,
}: CloseQuoteConfirmModalProps) {
  const toast = useToast();
  const itemBg = useColorModeValue('gray.50', 'gray.700');
  const border = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAcknowledged(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!acknowledged) return;

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSubmitting(true);
    try {
      const quote = await closeProcurementQuote(token, quoteId, {
        confirm_exclude_pending: true,
      });
      toast({
        title: 'Cotação encerrada',
        description: 'O ranking foi calculado com as propostas revisadas.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onSuccess(quote);
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao encerrar cotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Encerrar cotação com pendências</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              As propostas abaixo não possuem &quot;Revisão OK&quot; e não entrarão no
              ranking:
            </Text>

            <VStack spacing={2} align="stretch">
              {pendingSuppliers.map((supplier) => (
                <Box
                  key={supplier.invite_id}
                  bg={itemBg}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={border}
                  p={3}
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {supplier.supplier_name}
                  </Text>
                  <HStack spacing={2} color={mutedColor} fontSize="xs">
                    <Text>{supplier.reason}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>

            <Checkbox
              isChecked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            >
              Entendo que estas propostas não entrarão no ranking
            </Checkbox>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="red"
            onClick={handleConfirm}
            isLoading={submitting}
            loadingText="Encerrando..."
            isDisabled={!acknowledged}
          >
            Encerrar mesmo assim
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
