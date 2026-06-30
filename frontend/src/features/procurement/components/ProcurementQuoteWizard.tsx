'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Progress,
  Select,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { PurchaseRequestDTO, SupplierDTO } from '@ti-assistant/contracts';
import { fetchSuppliers } from '@/features/catalog/api/catalogApi';
import { createProcurementQuote, sendProcurementQuote } from '../api/procurementQuoteApi';
import { fetchPurchaseRequests } from '../api/purchaseRequestApi';
import { purchaseRequestPriorityColor, purchaseRequestPriorityLabel } from '../types';

const MIN_SUPPLIERS = 3;
const STEPS = ['Solicitação', 'Fornecedores', 'Confirmar'];

interface ProcurementQuoteWizardProps {
  onSuccess: (quoteId: string) => void;
  onCancel: () => void;
  initialPurchaseRequestId?: string;
}

export function ProcurementQuoteWizard({
  onSuccess,
  onCancel,
  initialPurchaseRequestId,
}: ProcurementQuoteWizardProps) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState<PurchaseRequestDTO[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [purchaseRequestId, setPurchaseRequestId] = useState(initialPurchaseRequestId ?? '');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [sendAfterCreate, setSendAfterCreate] = useState(true);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const summaryBg = useColorModeValue('gray.50', 'gray.700');

  const selectedRequest = useMemo(
    () => approvedRequests.find((r) => r.id === purchaseRequestId),
    [approvedRequests, purchaseRequestId]
  );

  const selectedSuppliers = useMemo(
    () => suppliers.filter((s) => selectedSupplierIds.includes(s.id)),
    [suppliers, selectedSupplierIds]
  );

  useEffect(() => {
    if (initialPurchaseRequestId) {
      setPurchaseRequestId(initialPurchaseRequestId);
    }
  }, [initialPurchaseRequestId]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      setLoadingData(false);
      return;
    }

    Promise.all([
      fetchPurchaseRequests(token, { status: 'APPROVED', limit: 100 }),
      fetchSuppliers(token),
    ])
      .then(([requestsResult, suppliersList]) => {
        setApprovedRequests(requestsResult.items);
        setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);
        if (initialPurchaseRequestId) {
          setPurchaseRequestId(initialPurchaseRequestId);
        }
      })
      .catch((err) => {
        toast({
          title: 'Erro ao carregar dados',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      })
      .finally(() => setLoadingData(false));
  }, [toast, initialPurchaseRequestId]);

  const toggleSupplier = (supplierId: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(supplierId)
        ? prev.filter((id) => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const canAdvanceStep = () => {
    if (step === 0) return !!purchaseRequestId;
    if (step === 1) return selectedSupplierIds.length >= MIN_SUPPLIERS;
    return true;
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    if (selectedSupplierIds.length < MIN_SUPPLIERS) {
      toast({
        title: 'Fornecedores insuficientes',
        description: `Selecione pelo menos ${MIN_SUPPLIERS} fornecedores.`,
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const quote = await createProcurementQuote(token, {
        purchase_request_id: purchaseRequestId,
        supplier_ids: selectedSupplierIds,
        notes: notes.trim() || undefined,
      });

      if (sendAfterCreate) {
        await sendProcurementQuote(token, quote.id);
        toast({
          title: 'Cotação criada e enviada',
          description: 'Os fornecedores foram notificados por e-mail.',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Cotação criada',
          description: 'Você pode enviá-la quando estiver pronto.',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      }

      onSuccess(quote.id);
    } catch (err) {
      toast({
        title: 'Erro ao criar cotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return <Text color={mutedColor}>Carregando solicitações e fornecedores...</Text>;
  }

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
      <HStack spacing={2} mb={4}>
        {STEPS.map((label, index) => (
          <Box key={label} flex={1}>
            <Text fontSize="xs" fontWeight={step === index ? 'bold' : 'normal'} color={mutedColor}>
              {index + 1}. {label}
            </Text>
            <Progress
              value={step >= index ? 100 : 0}
              size="xs"
              colorScheme="blue"
              mt={1}
              borderRadius="full"
            />
          </Box>
        ))}
      </HStack>

      {step === 0 && (
        <VStack align="stretch" spacing={4}>
          <FormControl isRequired>
            <FormLabel>Solicitação de compra aprovada</FormLabel>
            <Select
              placeholder="Selecione uma SC aprovada"
              value={purchaseRequestId}
              onChange={(e) => setPurchaseRequestId(e.target.value)}
            >
              {approvedRequests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.display_code} — {request.justification.slice(0, 60)}
                  {request.justification.length > 60 ? '…' : ''}
                </option>
              ))}
            </Select>
            <FormHelperText>
              {approvedRequests.length === 0
                ? 'Nenhuma solicitação aprovada disponível.'
                : 'Apenas solicitações com status Aprovada podem gerar cotação.'}
            </FormHelperText>
          </FormControl>

          {selectedRequest && (
            <Box p={3} bg={summaryBg} borderRadius="md">
              <Text fontSize="sm" fontWeight="medium">
                {selectedRequest.display_code}
              </Text>
              <Text fontSize="sm" color={mutedColor} mt={1}>
                {selectedRequest.justification}
              </Text>
              <Text fontSize="xs" color={mutedColor} mt={2}>
                {selectedRequest.items.length} item(ns)
              </Text>
            </Box>
          )}
        </VStack>
      )}

      {step === 1 && (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" color={mutedColor}>
            Selecione no mínimo {MIN_SUPPLIERS} fornecedores ({selectedSupplierIds.length}{' '}
            selecionado(s)).
          </Text>
          <Box maxH="320px" overflowY="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md" p={2}>
            {suppliers.length === 0 ? (
              <Text fontSize="sm" color={mutedColor} p={2}>
                Nenhum fornecedor cadastrado.
              </Text>
            ) : (
              suppliers.map((supplier) => (
                <Checkbox
                  key={supplier.id}
                  isChecked={selectedSupplierIds.includes(supplier.id)}
                  onChange={() => toggleSupplier(supplier.id)}
                  width="full"
                  py={2}
                  px={2}
                  borderRadius="md"
                  _hover={{ bg: rowHoverBg }}
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {supplier.name}
                  </Text>
                  {supplier.cnpj && (
                    <Text fontSize="xs" color={mutedColor}>
                      CNPJ: {supplier.cnpj}
                    </Text>
                  )}
                </Checkbox>
              ))
            )}
          </Box>
        </VStack>
      )}

      {step === 2 && (
        <VStack align="stretch" spacing={4}>
          <Box>
            <HStack spacing={2} mb={1}>
              <Text fontSize="sm" fontWeight="medium">
                Solicitação
              </Text>
              {selectedRequest?.priority && (
                <Badge colorScheme={purchaseRequestPriorityColor(selectedRequest.priority)}>
                  {purchaseRequestPriorityLabel(selectedRequest.priority)}
                </Badge>
              )}
            </HStack>
            <Text fontSize="sm" color={mutedColor}>
              {selectedRequest?.display_code} — {selectedRequest?.justification}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Fornecedores ({selectedSuppliers.length})
            </Text>
            <VStack align="stretch" spacing={1}>
              {selectedSuppliers.map((supplier) => (
                <Text key={supplier.id} fontSize="sm" color={mutedColor}>
                  • {supplier.name}
                </Text>
              ))}
            </VStack>
          </Box>

          <FormControl>
            <FormLabel>Observações (opcional)</FormLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções adicionais para os fornecedores"
              rows={3}
            />
          </FormControl>

          <Checkbox isChecked={sendAfterCreate} onChange={(e) => setSendAfterCreate(e.target.checked)}>
            Enviar cotação imediatamente após criar
          </Checkbox>
        </VStack>
      )}

      <HStack justify="space-between" mt={6}>
        <Button variant="ghost" onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button colorScheme="blue" onClick={() => setStep((s) => s + 1)} isDisabled={!canAdvanceStep()}>
            Próximo
          </Button>
        ) : (
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitting}
            loadingText="Criando..."
            isDisabled={!canAdvanceStep()}
          >
            {sendAfterCreate ? 'Criar e enviar' : 'Criar cotação'}
          </Button>
        )}
      </HStack>
    </Box>
  );
}
