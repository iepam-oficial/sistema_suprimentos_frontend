'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Table,
  Tbody,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import type {
  CreatePurchaseRequestInput,
  PurchaseRequestDTO,
  PurchaseRequestPriority,
} from '@ti-assistant/contracts';
import { fetchChartOfAccounts } from '@/features/financeiro/api/chartOfAccountApi';
import type { ChartOfAccount } from '@/features/financeiro/types';
import {
  createPurchaseRequest,
  submitPurchaseRequest,
  updatePurchaseRequest,
} from '../api/purchaseRequestApi';
import {
  createEmptyItemRow,
  PurchaseRequestItemRow,
  type PurchaseRequestItemFormRow,
} from './PurchaseRequestItemRow';

interface PurchaseRequestFormProps {
  initialData?: PurchaseRequestDTO | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

function itemsFromDto(dto?: PurchaseRequestDTO | null): PurchaseRequestItemFormRow[] {
  if (!dto?.items?.length) {
    return [createEmptyItemRow()];
  }

  return dto.items.map((item) => ({
    key: item.id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit ?? '',
    supply_id: item.supply_id ?? undefined,
    inventory_id: item.inventory_id ?? undefined,
  }));
}

export function PurchaseRequestForm({ initialData, onSuccess, onCancel }: PurchaseRequestFormProps) {
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [justification, setJustification] = useState(initialData?.justification ?? '');
  const [priority, setPriority] = useState<PurchaseRequestPriority>(
    initialData?.priority ?? 'MEDIUM',
  );
  const [chartOfAccountId, setChartOfAccountId] = useState(initialData?.chart_of_account_id ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [items, setItems] = useState<PurchaseRequestItemFormRow[]>(() => itemsFromDto(initialData));
  const [submitting, setSubmitting] = useState(false);

  const isReadOnly =
    !!initialData && initialData.status !== 'DRAFT';

  useEffect(() => {
    fetchChartOfAccounts('DESPESA')
      .then(setChartOfAccounts)
      .catch(() => {
        toast({
          title: 'Erro ao carregar planos de conta',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  }, [toast]);

  const validate = (): CreatePurchaseRequestInput | null => {
    if (!justification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    if (!chartOfAccountId) {
      toast({
        title: 'Plano de contas obrigatório',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      toast({
        title: 'Itens obrigatórios',
        description: 'Adicione ao menos um item com descrição.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    return {
      justification: justification.trim(),
      priority,
      notes: notes.trim() || undefined,
      chart_of_account_id: chartOfAccountId,
      items: validItems.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unit: item.unit.trim() || undefined,
        supply_id: item.supply_id,
        inventory_id: item.inventory_id,
      })),
    };
  };

  const getToken = () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    return token;
  };

  const handleSaveDraft = async () => {
    const payload = validate();
    if (!payload) return;

    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      if (initialData) {
        await updatePurchaseRequest(token, initialData.id, payload);
      } else {
        await createPurchaseRequest(token, payload);
      }

      toast({
        title: 'Rascunho salvo',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onSuccess();
    } catch (err) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const payload = validate();
    if (!payload) return;

    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      let requestId = initialData?.id;

      if (requestId) {
        await updatePurchaseRequest(token, requestId, payload);
      } else {
        const created = await createPurchaseRequest(token, payload);
        requestId = created.id;
      }

      await submitPurchaseRequest(token, requestId);

      toast({
        title: 'Solicitação enviada',
        description: 'A solicitação foi submetida para aprovação.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onSuccess();
    } catch (err) {
      toast({
        title: 'Erro ao submeter solicitação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (index: number, row: PurchaseRequestItemFormRow) => {
    setItems((prev) => prev.map((item, i) => (i === index ? row : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <VStack align="stretch" spacing={4}>
      <FormControl isRequired>
        <FormLabel>Justificativa</FormLabel>
        <Textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Descreva a necessidade da compra"
          isDisabled={isReadOnly}
          rows={3}
        />
      </FormControl>

      <HStack spacing={4} align="flex-start" flexWrap="wrap">
        <FormControl isRequired maxW="240px">
          <FormLabel>Prioridade</FormLabel>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PurchaseRequestPriority)}
            isDisabled={isReadOnly}
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </Select>
        </FormControl>

        <FormControl isRequired flex="1" minW="240px">
          <FormLabel>Plano de contas</FormLabel>
          <Select
            placeholder="Selecione o plano de contas"
            value={chartOfAccountId}
            onChange={(e) => setChartOfAccountId(e.target.value)}
            isDisabled={isReadOnly}
          >
            {chartOfAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.codigo} — {account.nome}
              </option>
            ))}
          </Select>
        </FormControl>
      </HStack>

      <FormControl>
        <FormLabel>Observações</FormLabel>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informações adicionais (opcional)"
          isDisabled={isReadOnly}
          rows={2}
        />
      </FormControl>

      <Box>
        <HStack justify="space-between" mb={2}>
          <FormLabel mb={0}>Itens</FormLabel>
          {!isReadOnly && (
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              variant="outline"
              onClick={() => setItems((prev) => [...prev, createEmptyItemRow()])}
            >
              Adicionar item
            </Button>
          )}
        </HStack>

        <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Descrição</Th>
                <Th w="120px">Quantidade</Th>
                <Th w="120px">Unidade</Th>
                <Th w="60px" />
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row, index) => (
                <PurchaseRequestItemRow
                  key={row.key}
                  row={row}
                  onChange={(updated) => updateItem(index, updated)}
                  onRemove={() => removeItem(index)}
                  canRemove={items.length > 1}
                  isDisabled={isReadOnly}
                />
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      {!isReadOnly && (
        <HStack justify="flex-end" spacing={3}>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} isDisabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            isLoading={submitting}
            loadingText="Salvando..."
          >
            Salvar rascunho
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitting}
            loadingText="Enviando..."
          >
            Submeter
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
