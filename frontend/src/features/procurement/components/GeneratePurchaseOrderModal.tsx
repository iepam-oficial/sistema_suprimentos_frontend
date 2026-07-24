'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { ProcurementQuoteDTO } from '@ti-assistant/contracts';
import { createPurchaseOrder } from '../api/purchaseOrderApi';
import {
  fetchProcurementQuoteById,
  fetchProcurementQuotes,
} from '../api/procurementQuoteApi';

interface GeneratePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingQuoteIds: string[];
}

export function GeneratePurchaseOrderModal({
  isOpen,
  onClose,
  onSuccess,
  existingQuoteIds,
}: GeneratePurchaseOrderModalProps) {
  const toast = useToast();
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [approvedQuotes, setApprovedQuotes] = useState<ProcurementQuoteDTO[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedPaymentCode, setSelectedPaymentCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableQuotes = useMemo(
    () => approvedQuotes.filter((quote) => !existingQuoteIds.includes(quote.id)),
    [approvedQuotes, existingQuoteIds],
  );

  const selectedQuote = useMemo(
    () => availableQuotes.find((q) => q.id === selectedQuoteId) ?? null,
    [availableQuotes, selectedQuoteId],
  );

  const paymentOptions = useMemo(() => {
    return selectedQuote?.winner_invite?.proposal?.payment_methods ?? [];
  }, [selectedQuote]);

  const directorLocked = Boolean(selectedQuote?.selected_payment_method_code);

  useEffect(() => {
    if (!isOpen) {
      setSelectedQuoteId('');
      setSelectedPaymentCode('');
      return;
    }

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    setLoadingQuotes(true);
    fetchProcurementQuotes(token, { status: 'APPROVED', limit: 100 })
      .then((result) => setApprovedQuotes(result.items))
      .catch((err) => {
        toast({
          title: 'Erro ao carregar cotações aprovadas',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      })
      .finally(() => setLoadingQuotes(false));
  }, [isOpen, toast]);

  useEffect(() => {
    if (!selectedQuoteId) {
      setSelectedPaymentCode('');
      return;
    }

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    let cancelled = false;
    fetchProcurementQuoteById(token, selectedQuoteId)
      .then((full) => {
        if (cancelled) return;
        setApprovedQuotes((prev) =>
          prev.map((q) => (q.id === full.id ? { ...q, ...full } : q)),
        );
        if (full.selected_payment_method_code) {
          setSelectedPaymentCode(full.selected_payment_method_code);
        } else {
          setSelectedPaymentCode('');
        }
      })
      .catch(() => {
        /* keep list data */
      });

    return () => {
      cancelled = true;
    };
  }, [selectedQuoteId]);

  useEffect(() => {
    if (!selectedQuote) {
      return;
    }
    if (selectedQuote.selected_payment_method_code) {
      setSelectedPaymentCode(selectedQuote.selected_payment_method_code);
    }
  }, [selectedQuote]);

  const handleSubmit = async () => {
    if (!selectedQuoteId) {
      toast({
        title: 'Selecione uma cotação',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedPaymentCode && !directorLocked) {
      toast({
        title: 'Selecione a forma de pagamento',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    setSubmitting(true);
    try {
      await createPurchaseOrder(token, {
        procurement_quote_id: selectedQuoteId,
        payment_method_code: selectedPaymentCode || undefined,
      });
      toast({
        title: 'Pedido gerado',
        description: 'O pedido de compra foi criado em rascunho.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao gerar pedido',
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Gerar pedido de compra</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loadingQuotes ? (
            <VStack py={6}>
              <Spinner />
              <Text fontSize="sm" color="gray.500">
                Carregando cotações aprovadas...
              </Text>
            </VStack>
          ) : availableQuotes.length === 0 ? (
            <Text color="gray.500">
              Não há cotações aprovadas disponíveis para gerar pedido de compra.
            </Text>
          ) : (
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Cotação aprovada</FormLabel>
                <Select
                  placeholder="Selecione a cotação"
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                >
                  {availableQuotes.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {quote.display_code}
                      {quote.purchase_request?.display_code
                        ? ` — SC ${quote.purchase_request.display_code}`
                        : ''}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedQuoteId && (
                <FormControl isRequired>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Select
                    placeholder="Selecione a forma"
                    value={selectedPaymentCode}
                    onChange={(e) => setSelectedPaymentCode(e.target.value)}
                    isDisabled={directorLocked || paymentOptions.length === 0}
                  >
                    {paymentOptions.map((method) => (
                      <option key={method.code} value={method.code}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                  {directorLocked ? (
                    <FormHelperText>
                      Definida pelo diretor — não pode ser alterada.
                    </FormHelperText>
                  ) : paymentOptions.length === 0 ? (
                    <FormHelperText color="red.500">
                      Proposta sem formas de pagamento. Solicite correção.
                    </FormHelperText>
                  ) : null}
                </FormControl>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitting}
            loadingText="Gerando..."
            isDisabled={
              loadingQuotes ||
              availableQuotes.length === 0 ||
              (!selectedPaymentCode && !directorLocked)
            }
          >
            Gerar pedido
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
