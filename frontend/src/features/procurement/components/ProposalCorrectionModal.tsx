'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type {
  ProcurementQuoteProposalDTO,
  ProcurementQuoteProposalItemDTO,
} from '@ti-assistant/contracts';
import { requestProposalCorrection } from '../api/procurementQuoteApi';

interface ProposalCorrectionModalProps {
  quoteId: string;
  inviteId: string;
  /** Proposta cujas linhas alimentam o checklist. Aceita a proposta inteira ou só os itens. */
  proposal?: ProcurementQuoteProposalDTO | null;
  items?: ProcurementQuoteProposalItemDTO[];
  supplierName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ProposalCorrectionModal({
  quoteId,
  inviteId,
  proposal,
  items,
  supplierName,
  isOpen,
  onClose,
  onSuccess,
}: ProposalCorrectionModalProps) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [flaggedItemIds, setFlaggedItemIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const proposalItems = useMemo<ProcurementQuoteProposalItemDTO[]>(
    () => items ?? proposal?.items ?? [],
    [items, proposal]
  );

  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setFlaggedItemIds([]);
      setSubmitting(false);
      setTouched(false);
    }
  }, [isOpen]);

  const isMessageInvalid = message.trim().length < 1;

  const handleSubmit = async () => {
    setTouched(true);
    if (isMessageInvalid) return;

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSubmitting(true);
    try {
      await requestProposalCorrection(token, quoteId, inviteId, {
        message: message.trim(),
        flagged_item_ids: flaggedItemIds.length > 0 ? flaggedItemIds : undefined,
      });
      toast({
        title: 'Correção solicitada',
        description: 'O fornecedor receberá um e-mail com o novo link.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao solicitar correção',
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
        <ModalHeader>
          Solicitar correção{supplierName ? ` — ${supplierName}` : ''}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired isInvalid={touched && isMessageInvalid}>
              <FormLabel>Mensagem para o fornecedor</FormLabel>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Descreva o que precisa ser corrigido na proposta."
                rows={5}
              />
              <FormErrorMessage>Informe o que deve ser corrigido.</FormErrorMessage>
            </FormControl>

            {proposalItems.length > 0 && (
              <FormControl>
                <FormLabel>Linhas com problema (opcional)</FormLabel>
                <CheckboxGroup
                  value={flaggedItemIds}
                  onChange={(values) => setFlaggedItemIds(values as string[])}
                >
                  <VStack spacing={2} align="stretch">
                    {proposalItems.map((item) => (
                      <Checkbox key={item.id} value={item.id} alignItems="flex-start">
                        <Box>
                          <Text fontSize="sm" fontWeight="medium">
                            {item.description}
                          </Text>
                          <HStack spacing={3} color="gray.500" fontSize="xs">
                            <Text>Qtd: {item.quantity}</Text>
                            <Text>Preço: {formatCurrency(item.unit_price)}</Text>
                          </HStack>
                        </Box>
                      </Checkbox>
                    ))}
                  </VStack>
                </CheckboxGroup>
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            isLoading={submitting}
            loadingText="Enviando..."
            isDisabled={isMessageInvalid}
          >
            Solicitar correção
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
