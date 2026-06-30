'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Progress,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Minus, Plus } from 'lucide-react';
import type {
  GoodsReceiptDTO,
  GoodsReceiptDiscrepancyDTO,
  SavePhysicalLineInput,
  SuggestedInvoiceLineDTO,
  SuggestedInvoiceMetadataDTO,
} from '@ti-assistant/contracts';
import { GoodsReceiptStatus, ReceiptLineDestination } from '@ti-assistant/contracts';
import type { CategoryDTO, LocationDTO } from '@/features/reference-data';
import { fetchCategories, fetchLocations } from '@/features/reference-data';
import {
  classifyInvoiceLines,
  directorApproveGoodsReceipt,
  finalizeGoodsReceipt,
  resolveGoodsReceiptDiscrepancy,
  runGoodsReceiptComparison,
  saveInventoryLines,
  savePhysicalLines,
  confirmGoodsReceiptInvoiceLines,
  suggestGoodsReceiptSupplyMappings,
  uploadGoodsReceiptInvoice,
} from '../api/goodsReceiptApi';
import {
  buildClassificationsFromReceipt,
  InvoiceLineClassificationTable,
  isClassificationComplete,
  type LineClassificationState,
} from './InvoiceLineClassificationTable';
import { SupplyItemAutocomplete } from './purchase-request/SupplyItemAutocomplete';

const STEPS = ['Conferência física', 'Nota fiscal', 'Classificação', 'Divergências', 'Finalizar'];

interface PhysicalLineRow extends SavePhysicalLineInput {
  key: string;
}

interface PendingInvoiceLineRow extends SuggestedInvoiceLineDTO {
  key: string;
}

function isPdfOrImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.pdf') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp')
  );
}

function createEmptyInvoiceLine(lineNumber: number): PendingInvoiceLineRow {
  return {
    key: crypto.randomUUID(),
    line_number: lineNumber,
    description: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
  };
}

interface GoodsReceiptWizardProps {
  receipt: GoodsReceiptDTO;
  onReceiptUpdated: (receipt: GoodsReceiptDTO) => void;
  userRole?: string | null;
}

function discrepancySeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    CRITICAL: 'red',
    HIGH: 'orange',
    MEDIUM: 'yellow',
    LOW: 'gray',
  };
  return colors[severity] ?? 'gray';
}

function discrepancySeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    CRITICAL: 'Crítica',
    HIGH: 'Alta',
    MEDIUM: 'Média',
    LOW: 'Baixa',
  };
  return labels[severity] ?? severity;
}

function discrepancyLayerLabel(layer: string): string {
  const labels: Record<string, string> = {
    SC: 'SC',
    QUOTE: 'Cotação',
    PO: 'Pedido',
    PHYSICAL: 'Físico',
  };
  return labels[layer] ?? layer;
}

function hasComparisonRun(receipt: GoodsReceiptDTO): boolean {
  return receipt.document_comparison_at != null;
}

function inferInitialStep(receipt: GoodsReceiptDTO): number {
  if (receipt.status === GoodsReceiptStatus.APPROVED) return 4;
  if (
    receipt.status === GoodsReceiptStatus.BLOCKED ||
    receipt.status === GoodsReceiptStatus.PENDING_DIRECTOR ||
    receipt.discrepancies.length > 0
  ) {
    return 3;
  }
  if (receipt.invoice_lines.length > 0) {
    const hasUnclassified = receipt.invoice_lines.some(
      (l) => l.destination_type === ReceiptLineDestination.UNCLASSIFIED
    );
    if (hasUnclassified) return 2;
    if (hasComparisonRun(receipt)) return 3;
    return 2;
  }
  if (receipt.status === GoodsReceiptStatus.PHYSICAL_DONE || receipt.invoice_s3_key) return 1;
  return 0;
}

export function GoodsReceiptWizard({
  receipt,
  onReceiptUpdated,
  userRole,
}: GoodsReceiptWizardProps) {
  const toast = useToast();
  const [step, setStep] = useState(() => inferInitialStep(receipt));
  const [submitting, setSubmitting] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [pendingInvoiceLines, setPendingInvoiceLines] = useState<PendingInvoiceLineRow[]>([]);
  const [pendingInvoiceMetadata, setPendingInvoiceMetadata] =
    useState<SuggestedInvoiceMetadataDTO>({});
  const [showInvoiceLineReview, setShowInvoiceLineReview] = useState(false);
  const [physicalLines, setPhysicalLines] = useState<PhysicalLineRow[]>([]);
  const [classifications, setClassifications] = useState<LineClassificationState[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [resolveJustification, setResolveJustification] = useState<Record<string, string>>({});

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const summaryBg = useColorModeValue('gray.50', 'gray.700');
  const isReadOnly = receipt.status === GoodsReceiptStatus.APPROVED;

  useEffect(() => {
    if (receipt.physical_lines.length > 0) {
      setPhysicalLines(
        receipt.physical_lines.map((line) => ({
          key: line.id,
          description: line.description,
          quantity_received: line.quantity_received,
          supply_id: line.supply_id ?? undefined,
          pr_item_id: line.pr_item_id ?? undefined,
        }))
      );
      return;
    }

    const poItems = receipt.purchase_order?.items;
    if (poItems && poItems.length > 0) {
      setPhysicalLines(
        poItems.map((item) => ({
          key: crypto.randomUUID(),
          description: item.description,
          quantity_received: item.quantity,
          pr_item_id: item.pr_item_id ?? undefined,
        }))
      );
      return;
    }

    setPhysicalLines([{ key: crypto.randomUUID(), description: '', quantity_received: 1 }]);
  }, [receipt.physical_lines, receipt.purchase_order?.items]);

  useEffect(() => {
    if (receipt.invoice_lines.length > 0) {
      setClassifications(buildClassificationsFromReceipt(receipt.invoice_lines));
    }
  }, [receipt.invoice_lines]);

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    Promise.all([fetchLocations(token), fetchCategories(token)])
      .then(([locData, catData]) => {
        setLocations(locData);
        setCategories(catData);
      })
      .catch(() => {
        toast({
          title: 'Erro ao carregar dados de referência',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      });
  }, [toast]);

  const unclassifiedCount = useMemo(
    () =>
      receipt.invoice_lines.filter(
        (l) => l.destination_type === ReceiptLineDestination.UNCLASSIFIED
      ).length,
    [receipt.invoice_lines]
  );

  const canFinalize = useMemo(() => {
    if (isReadOnly) return false;
    if (unclassifiedCount > 0) return false;
    if (receipt.status === GoodsReceiptStatus.BLOCKED) return false;
    if (
      receipt.status === GoodsReceiptStatus.PENDING_DIRECTOR &&
      !receipt.director_approved_at
    ) {
      return false;
    }
    const unresolvedCritical = receipt.discrepancies.filter(
      (d) => d.severity === 'CRITICAL' && !d.resolved_at
    );
    if (unresolvedCritical.length > 0) return false;
    return true;
  }, [isReadOnly, unclassifiedCount, receipt]);

  const getToken = () => {
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) {
      toast({ title: 'Sessão expirada', status: 'error', duration: 3000, isClosable: true });
    }
    return token;
  };

  const handleSavePhysical = async () => {
    const token = getToken();
    if (!token) return;

    const lines = physicalLines
      .filter((l) => l.description.trim() && l.quantity_received > 0)
      .map(({ description, quantity_received, supply_id, pr_item_id }) => ({
        description: description.trim(),
        quantity_received,
        supply_id,
        pr_item_id,
      }));

    if (lines.length === 0) {
      toast({
        title: 'Informe ao menos uma linha',
        description: 'Adicione descrição e quantidade recebida.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await savePhysicalLines(token, receipt.id, { lines });
      onReceiptUpdated(updated);
      toast({ title: 'Conferência física salva', status: 'success', duration: 3000, isClosable: true });
      setStep(1);
    } catch (err) {
      toast({
        title: 'Erro ao salvar conferência',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadInvoice = async () => {
    const token = getToken();
    if (!token) return;

    if (!invoiceFile) {
      toast({
        title: 'Selecione um arquivo',
        description: 'Envie a nota fiscal em XML, PDF ou imagem.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await uploadGoodsReceiptInvoice(token, receipt.id, invoiceFile);
      onReceiptUpdated(result.receipt);

      const needsReview =
        isPdfOrImageFile(invoiceFile) ||
        result.receipt.invoice_file_type === 'pdf' ||
        result.receipt.invoice_file_type === 'image';

      if (needsReview) {
        const suggested = result.suggested_lines ?? [];
        setPendingInvoiceMetadata(result.suggested_metadata ?? {});
        setPendingInvoiceLines(
          suggested.length > 0
            ? suggested.map((line) => ({ ...line, key: crypto.randomUUID() }))
            : [createEmptyInvoiceLine(1)]
        );
        setShowInvoiceLineReview(true);

        if (result.ai_extraction_failed) {
          toast({
            title: 'Preencha manualmente',
            description: 'Não foi possível extrair os dados automaticamente.',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
        } else if (suggested.length > 0) {
          toast({
            title: 'Revise as linhas extraídas',
            description: 'Confirme ou edite antes de continuar.',
            status: 'info',
            duration: 4000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Preencha manualmente',
            description: 'Nenhuma linha foi sugerida pela IA.',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
        }
        return;
      }

      toast({ title: 'Nota fiscal enviada', status: 'success', duration: 3000, isClosable: true });
      setStep(2);
    } catch (err) {
      toast({
        title: 'Erro ao enviar nota fiscal',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmInvoiceLines = async () => {
    const token = getToken();
    if (!token) return;

    const lines = pendingInvoiceLines
      .filter((line) => line.description.trim() && line.quantity > 0)
      .map(({ line_number, description, quantity, unit_price, total_price }) => ({
        line_number,
        description: description.trim(),
        quantity,
        unit_price,
        total_price,
      }));

    if (lines.length === 0) {
      toast({
        title: 'Informe ao menos uma linha',
        description: 'Adicione descrição e quantidade para cada item da NF.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const metadata =
        pendingInvoiceMetadata.nfe_number ||
        pendingInvoiceMetadata.nfe_series ||
        pendingInvoiceMetadata.nfe_access_key
          ? pendingInvoiceMetadata
          : undefined;

      const updated = await confirmGoodsReceiptInvoiceLines(token, receipt.id, {
        lines,
        metadata,
      });
      onReceiptUpdated(updated);
      setShowInvoiceLineReview(false);
      setPendingInvoiceLines([]);
      setPendingInvoiceMetadata({});
      toast({ title: 'Linhas da NF confirmadas', status: 'success', duration: 3000, isClosable: true });
      setStep(2);
    } catch (err) {
      toast({
        title: 'Erro ao confirmar linhas',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addPendingInvoiceLine = () => {
    setPendingInvoiceLines((prev) => {
      const nextNumber =
        prev.reduce((max, line) => Math.max(max, line.line_number), 0) + 1;
      return [...prev, createEmptyInvoiceLine(nextNumber)];
    });
  };

  const removePendingInvoiceLine = (key: string) => {
    setPendingInvoiceLines((prev) =>
      prev.length > 1 ? prev.filter((line) => line.key !== key) : prev
    );
  };

  const updatePendingInvoiceLine = (key: string, patch: Partial<PendingInvoiceLineRow>) => {
    setPendingInvoiceLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const updated = { ...line, ...patch };
        if ('quantity' in patch || 'unit_price' in patch) {
          updated.total_price = updated.quantity * updated.unit_price;
        }
        return updated;
      })
    );
  };

  const handleSaveClassification = async () => {
    const token = getToken();
    if (!token) return;

    if (!isClassificationComplete(classifications)) {
      toast({
        title: 'Classificação incompleta',
        description: 'Classifique todas as linhas e preencha os dados obrigatórios.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const classifyLines = classifications.map((c) => ({
        invoice_line_id: c.invoice_line_id,
        destination_type: c.destination_type as 'SUPPLY' | 'INVENTORY',
        supply_id: c.destination_type === 'SUPPLY' ? c.supply_id : undefined,
      }));

      let updated = await classifyInvoiceLines(token, receipt.id, { lines: classifyLines });

      const inventoryLines = classifications
        .filter((c) => c.destination_type === 'INVENTORY' && c.inventory)
        .map((c) => ({
          invoice_line_id: c.invoice_line_id,
          name: c.inventory!.name.trim(),
          model: c.inventory!.model.trim(),
          serial_numbers: c.inventory!.serial_numbers.map((s) => s.trim()),
          location_id: c.inventory!.location_id,
          category_id: c.inventory!.category_id,
          subcategory_id: c.inventory!.subcategory_id,
        }));

      if (inventoryLines.length > 0) {
        updated = await saveInventoryLines(token, receipt.id, { lines: inventoryLines });
      }

      updated = await runGoodsReceiptComparison(token, receipt.id);
      onReceiptUpdated(updated);
      toast({ title: 'Classificação salva', status: 'success', duration: 3000, isClosable: true });
      setStep(3);
    } catch (err) {
      toast({
        title: 'Erro ao salvar classificação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunComparison = async () => {
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const updated = await runGoodsReceiptComparison(token, receipt.id);
      onReceiptUpdated(updated);
      setStep(3);
      toast({
        title: 'Comparação executada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao executar comparação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveDiscrepancy = useCallback(
    async (discrepancy: GoodsReceiptDiscrepancyDTO, action: 'accept' | 'notify_supplier' | 'acknowledge') => {
      const token = getToken();
      if (!token) return;

      setSubmitting(true);
      try {
        const updated = await resolveGoodsReceiptDiscrepancy(
          token,
          receipt.id,
          discrepancy.id,
          {
            action,
            justification: resolveJustification[discrepancy.id]?.trim() || undefined,
          }
        );
        onReceiptUpdated(updated);
        toast({ title: 'Divergência resolvida', status: 'success', duration: 3000, isClosable: true });
      } catch (err) {
        toast({
          title: 'Erro ao resolver divergência',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [onReceiptUpdated, receipt.id, resolveJustification, toast]
  );

  const handleDirectorApprove = async () => {
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const updated = await directorApproveGoodsReceipt(token, receipt.id);
      onReceiptUpdated(updated);
      toast({ title: 'Recebimento aprovado pelo diretor', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      toast({
        title: 'Erro na aprovação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    const token = getToken();
    if (!token) return;

    if (!canFinalize) {
      toast({
        title: 'Não é possível finalizar',
        description:
          unclassifiedCount > 0
            ? 'Classifique todas as linhas da NF antes de finalizar.'
            : 'Resolva divergências pendentes ou aguarde aprovação do diretor.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await finalizeGoodsReceipt(token, receipt.id);
      onReceiptUpdated(updated);
      toast({
        title: 'Recebimento finalizado',
        description: 'Lotes e patrimônio foram criados.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao finalizar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addPhysicalLine = () => {
    setPhysicalLines((prev) => [
      ...prev,
      { key: crypto.randomUUID(), description: '', quantity_received: 1 },
    ]);
  };

  const removePhysicalLine = (key: string) => {
    setPhysicalLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const updatePhysicalLine = (key: string, patch: Partial<PhysicalLineRow>) => {
    setPhysicalLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const renderDiscrepancies = () => {
    if (!hasComparisonRun(receipt)) {
      return (
        <VStack align="stretch" spacing={3}>
          <Text color={mutedColor} fontSize="sm">
            A comparação documental ainda não foi executada. Classifique as linhas da NF e salve, ou
            execute a comparação manualmente.
          </Text>
          <Button
            colorScheme="blue"
            size="sm"
            alignSelf="flex-start"
            isLoading={submitting}
            isDisabled={isReadOnly || receipt.invoice_lines.length === 0}
            onClick={handleRunComparison}
          >
            Executar comparação
          </Button>
        </VStack>
      );
    }

    if (receipt.discrepancies.length === 0) {
      return (
        <Text color={mutedColor} fontSize="sm">
          Nenhuma divergência documental encontrada.
        </Text>
      );
    }

    return (
      <VStack align="stretch" spacing={4}>
        {receipt.discrepancies.map((d) => (
          <Box
            key={d.id}
            p={4}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            bg={summaryBg}
          >
            <HStack justify="space-between" mb={2}>
              <Badge colorScheme={discrepancySeverityColor(d.severity)}>
                {discrepancySeverityLabel(d.severity)}
              </Badge>
              <Text fontSize="xs" color={mutedColor}>
                {discrepancyLayerLabel(d.layer)} · {d.field}
              </Text>
            </HStack>
            <Text fontSize="sm" mb={1}>
              Esperado: {d.expected_value ?? '—'}
            </Text>
            <Text fontSize="sm" mb={2}>
              Encontrado: {d.actual_value ?? '—'}
            </Text>
            {d.resolved_at ? (
              <Badge colorScheme="green">Resolvida</Badge>
            ) : (
              <VStack align="stretch" spacing={2} mt={2}>
                <Textarea
                  size="sm"
                  placeholder="Justificativa (opcional)"
                  value={resolveJustification[d.id] ?? ''}
                  onChange={(e) =>
                    setResolveJustification((prev) => ({ ...prev, [d.id]: e.target.value }))
                  }
                  isDisabled={isReadOnly || submitting}
                />
                <HStack flexWrap="wrap">
                  <Button
                    size="xs"
                    colorScheme="green"
                    isDisabled={isReadOnly || submitting}
                    onClick={() => handleResolveDiscrepancy(d, 'accept')}
                  >
                    Aceitar
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    isDisabled={isReadOnly || submitting}
                    onClick={() => handleResolveDiscrepancy(d, 'acknowledge')}
                  >
                    Reconhecer
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="orange"
                    isDisabled={isReadOnly || submitting}
                    onClick={() => handleResolveDiscrepancy(d, 'notify_supplier')}
                  >
                    Notificar fornecedor
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        ))}

        {receipt.status === GoodsReceiptStatus.PENDING_DIRECTOR &&
          !receipt.director_approved_at &&
          (userRole === 'DIRECTOR' || userRole === 'ADMIN') && (
            <Button
              colorScheme="purple"
              isLoading={submitting}
              onClick={handleDirectorApprove}
            >
              Aprovar como diretor
            </Button>
          )}
      </VStack>
    );
  };

  const comparisonCompleted = hasComparisonRun(receipt);

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" color={mutedColor}>
            Etapa {step + 1} de {STEPS.length}: {STEPS[step]}
          </Text>
          <Badge>{receipt.display_code}</Badge>
        </HStack>
        <Progress value={((step + 1) / STEPS.length) * 100} size="sm" colorScheme="blue" borderRadius="md" />
        <HStack mt={2} spacing={2} flexWrap="wrap">
          {STEPS.map((label, index) => (
            <Button
              key={label}
              size="xs"
              variant={step === index ? 'solid' : 'ghost'}
              colorScheme={step === index ? 'blue' : 'gray'}
              isDisabled={index === 3 && !comparisonCompleted}
              onClick={() => {
                if (index === 3 && !comparisonCompleted) return;
                setStep(index);
              }}
            >
              {label}
            </Button>
          ))}
        </HStack>
      </Box>

      {step === 0 && (
        <VStack align="stretch" spacing={4}>
          <Text fontSize="sm" color={mutedColor}>
            Registre os itens recebidos fisicamente.
          </Text>
          <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Descrição</Th>
                  <Th w="120px">Qtd recebida</Th>
                  <Th w="48px" />
                </Tr>
              </Thead>
              <Tbody>
                {physicalLines.map((line) => (
                  <Tr key={line.key}>
                    <Td>
                      <SupplyItemAutocomplete
                        value={line.description}
                        isDisabled={isReadOnly || submitting}
                        placeholder="Descrição do item"
                        onChange={(description) =>
                          updatePhysicalLine(line.key, {
                            description,
                            supply_id: undefined,
                          })
                        }
                        onSelect={(selection) =>
                          updatePhysicalLine(line.key, {
                            description: selection.description,
                            supply_id: selection.supply_id,
                          })
                        }
                      />
                    </Td>
                    <Td>
                      <NumberInput
                        size="sm"
                        min={1}
                        value={line.quantity_received}
                        isDisabled={isReadOnly || submitting}
                        onChange={(_, value) =>
                          updatePhysicalLine(line.key, { quantity_received: value || 1 })
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Remover linha"
                        size="xs"
                        variant="ghost"
                        icon={<Minus size={14} />}
                        isDisabled={isReadOnly || submitting || physicalLines.length <= 1}
                        onClick={() => removePhysicalLine(line.key)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          <HStack>
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              variant="outline"
              isDisabled={isReadOnly || submitting}
              onClick={addPhysicalLine}
            >
              Adicionar linha
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              isLoading={submitting}
              isDisabled={isReadOnly}
              onClick={handleSavePhysical}
            >
              Salvar e continuar
            </Button>
          </HStack>
        </VStack>
      )}

      {step === 1 && (
        <VStack align="stretch" spacing={4} maxW={showInvoiceLineReview ? '100%' : '480px'}>
          {!showInvoiceLineReview ? (
            <>
              <Text fontSize="sm" color={mutedColor}>
                Envie a nota fiscal (XML, PDF ou imagem). XML gera linhas automaticamente; PDF e
                imagem passam por revisão das linhas extraídas.
              </Text>
              {receipt.nfe_number && (
                <Box p={3} bg={summaryBg} borderRadius="md" fontSize="sm">
                  NF {receipt.nfe_number}
                  {receipt.nfe_series ? ` · Série ${receipt.nfe_series}` : ''}
                  {receipt.invoice_lines.length > 0
                    ? ` · ${receipt.invoice_lines.length} linha(s)`
                    : ''}
                </Box>
              )}
              <FormControl>
                <FormLabel fontSize="sm">Arquivo da nota fiscal</FormLabel>
                <Input
                  type="file"
                  size="sm"
                  accept=".xml,.pdf,.png,.jpg,.jpeg,.webp"
                  isDisabled={isReadOnly || submitting}
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                  data-testid="gr-invoice-upload"
                />
              </FormControl>
              <Button
                colorScheme="blue"
                isLoading={submitting}
                isDisabled={isReadOnly}
                onClick={handleUploadInvoice}
              >
                Enviar e continuar
              </Button>
            </>
          ) : (
            <>
              <Text fontSize="sm" color={mutedColor}>
                Revise as linhas extraídas da nota fiscal. Edite, adicione ou remova itens antes de
                confirmar.
              </Text>
              <HStack spacing={3} flexWrap="wrap">
                <FormControl maxW="160px">
                  <FormLabel fontSize="xs">Nº NF</FormLabel>
                  <Input
                    size="sm"
                    value={pendingInvoiceMetadata.nfe_number ?? ''}
                    isDisabled={isReadOnly || submitting}
                    onChange={(e) =>
                      setPendingInvoiceMetadata((prev) => ({
                        ...prev,
                        nfe_number: e.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormControl maxW="120px">
                  <FormLabel fontSize="xs">Série</FormLabel>
                  <Input
                    size="sm"
                    value={pendingInvoiceMetadata.nfe_series ?? ''}
                    isDisabled={isReadOnly || submitting}
                    onChange={(e) =>
                      setPendingInvoiceMetadata((prev) => ({
                        ...prev,
                        nfe_series: e.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormControl flex="1" minW="200px">
                  <FormLabel fontSize="xs">Chave de acesso</FormLabel>
                  <Input
                    size="sm"
                    value={pendingInvoiceMetadata.nfe_access_key ?? ''}
                    isDisabled={isReadOnly || submitting}
                    onChange={(e) =>
                      setPendingInvoiceMetadata((prev) => ({
                        ...prev,
                        nfe_access_key: e.target.value,
                      }))
                    }
                  />
                </FormControl>
              </HStack>
              <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="md">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th w="64px">#</Th>
                      <Th>Descrição</Th>
                      <Th w="100px">Qtd</Th>
                      <Th w="120px">V. unit.</Th>
                      <Th w="120px">Total</Th>
                      <Th w="48px" />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingInvoiceLines.map((line) => (
                      <Tr key={line.key}>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={1}
                            value={line.line_number}
                            isDisabled={isReadOnly || submitting}
                            onChange={(_, value) =>
                              updatePendingInvoiceLine(line.key, {
                                line_number: value || 1,
                              })
                            }
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <Input
                            size="sm"
                            value={line.description}
                            isDisabled={isReadOnly || submitting}
                            onChange={(e) =>
                              updatePendingInvoiceLine(line.key, { description: e.target.value })
                            }
                            placeholder="Descrição do item"
                          />
                        </Td>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={1}
                            value={line.quantity}
                            isDisabled={isReadOnly || submitting}
                            onChange={(_, value) =>
                              updatePendingInvoiceLine(line.key, { quantity: value || 1 })
                            }
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <NumberInput
                            size="sm"
                            min={0}
                            precision={2}
                            value={line.unit_price}
                            isDisabled={isReadOnly || submitting}
                            onChange={(_, value) =>
                              updatePendingInvoiceLine(line.key, { unit_price: value || 0 })
                            }
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {line.total_price.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        </Td>
                        <Td>
                          <IconButton
                            aria-label="Remover linha"
                            size="xs"
                            variant="ghost"
                            icon={<Minus size={14} />}
                            isDisabled={
                              isReadOnly || submitting || pendingInvoiceLines.length <= 1
                            }
                            onClick={() => removePendingInvoiceLine(line.key)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              <HStack>
                <Button
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  variant="outline"
                  isDisabled={isReadOnly || submitting}
                  onClick={addPendingInvoiceLine}
                >
                  Adicionar linha
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={isReadOnly || submitting}
                  onClick={() => setShowInvoiceLineReview(false)}
                >
                  Voltar ao upload
                </Button>
                <Button
                  size="sm"
                  colorScheme="blue"
                  isLoading={submitting}
                  isDisabled={isReadOnly}
                  onClick={handleConfirmInvoiceLines}
                >
                  Confirmar linhas
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      )}

      {step === 2 && (
        <VStack align="stretch" spacing={4}>
          <Text fontSize="sm" color={mutedColor}>
            Classifique cada linha da NF como Suprimento ou Inventário. As opções são mutuamente
            exclusivas.
          </Text>
          <Button
            size="sm"
            variant="outline"
            alignSelf="flex-start"
            isLoading={submitting}
            isDisabled={isReadOnly || receipt.invoice_lines.length === 0}
            onClick={async () => {
              const token = localStorage.getItem('@ti-assistant:token');
              if (!token) return;
              try {
                setSubmitting(true);
                const updated = await suggestGoodsReceiptSupplyMappings(token, receipt.id);
                onReceiptUpdated(updated);
                setClassifications(buildClassificationsFromReceipt(updated.invoice_lines));
                toast({
                  title: 'Sugestões de suprimento atualizadas',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
              } catch (err) {
                toast({
                  title: 'Erro ao buscar sugestões',
                  description: err instanceof Error ? err.message : 'Tente novamente.',
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Buscar sugestões IA de suprimento
          </Button>
          {unclassifiedCount > 0 && (
            <Text fontSize="sm" color="orange.500">
              {unclassifiedCount} linha(s) ainda não classificada(s).
            </Text>
          )}
          <InvoiceLineClassificationTable
            lines={receipt.invoice_lines}
            classifications={classifications}
            onChange={setClassifications}
            locations={locations}
            categories={categories}
            disabled={isReadOnly || submitting}
          />
          <Button
            colorScheme="blue"
            isLoading={submitting}
            isDisabled={isReadOnly || !isClassificationComplete(classifications)}
            onClick={handleSaveClassification}
          >
            Salvar classificação e comparar
          </Button>
        </VStack>
      )}

      {step === 3 && renderDiscrepancies()}

      {step === 4 && (
        <VStack align="stretch" spacing={4} maxW="520px">
          {receipt.status === GoodsReceiptStatus.APPROVED ? (
            <Box p={4} bg={summaryBg} borderRadius="md">
              <Badge colorScheme="green" mb={2}>
                Finalizado
              </Badge>
              <Text fontSize="sm">
                Recebimento concluído em{' '}
                {receipt.approved_at
                  ? new Date(receipt.approved_at).toLocaleString('pt-BR')
                  : '—'}
                .
              </Text>
            </Box>
          ) : (
            <>
              <Text fontSize="sm" color={mutedColor}>
                Revise os dados e finalize o recebimento para gerar lotes (suprimento) e patrimônio
                (inventário).
              </Text>
              {unclassifiedCount > 0 && (
                <Text fontSize="sm" color="red.500">
                  Finalização bloqueada: {unclassifiedCount} linha(s) não classificada(s).
                </Text>
              )}
              <Button
                colorScheme="green"
                size="lg"
                isLoading={submitting}
                isDisabled={!canFinalize}
                onClick={handleFinalize}
                data-testid="gr-finalize"
              >
                Finalizar recebimento
              </Button>
            </>
          )}
        </VStack>
      )}

      <HStack justify="flex-end">
        {step > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Button>
        )}
        {step < STEPS.length - 1 && (
          <Button size="sm" variant="outline" onClick={() => setStep((s) => s + 1)}>
            Próximo
          </Button>
        )}
      </HStack>
    </VStack>
  );
}
