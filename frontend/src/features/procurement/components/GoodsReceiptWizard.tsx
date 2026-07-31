'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Checkbox,
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
  ResolveDiscrepancyAction,
  SavePhysicalLineInput,
  SuggestedInvoiceLineDTO,
  SuggestedInvoiceMetadataDTO,
} from '@ti-assistant/contracts';
import {
  DiscrepancySeverity,
  GoodsReceiptStatus,
  ReceiptLineDestination,
} from '@ti-assistant/contracts';
import type { CategoryDTO, LocationDTO } from '@/features/reference-data';
import { fetchCategories, fetchLocations } from '@/features/reference-data';
import { createClientKey } from '@/utils/clientKey';
import {
  classifyInvoiceLines,
  directorApproveGoodsReceipt,
  finalizeGoodsReceipt,
  resolveGoodsReceiptDiscrepanciesBatch,
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
    key: createClientKey(),
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

function isDiscrepancySelectable(
  d: GoodsReceiptDiscrepancyDTO,
  isReadOnly: boolean
): boolean {
  return !isReadOnly && !d.resolved_at && d.severity !== DiscrepancySeverity.CRITICAL;
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

/** Stable key so polling (new array refs) does not reset local draft state. */
function invoiceLinesSyncKey(receipt: GoodsReceiptDTO): string {
  return receipt.invoice_lines
    .map(
      (l) =>
        [
          l.id,
          l.destination_type,
          l.supply_id ?? '',
          l.ai_suggested_supply_id ?? '',
          l.ai_confidence ?? '',
          l.description,
          l.quantity,
        ].join(':')
    )
    .join('|');
}

function physicalLinesSyncKey(receipt: GoodsReceiptDTO): string {
  if (receipt.physical_lines.length > 0) {
    return receipt.physical_lines
      .map(
        (l) =>
          [
            l.id,
            l.description,
            l.quantity_received,
            l.supply_id ?? '',
            l.pr_item_id ?? '',
          ].join(':')
      )
      .join('|');
  }

  const poItems = receipt.purchase_order?.items ?? [];
  if (poItems.length > 0) {
    return `po|${poItems
      .map((item) =>
        [item.id ?? '', item.description, item.quantity, item.pr_item_id ?? ''].join(':')
      )
      .join('|')}`;
  }

  return 'empty';
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
  const [selectedDiscrepancyIds, setSelectedDiscrepancyIds] = useState<Set<string>>(
    () => new Set()
  );
  const [bulkJustification, setBulkJustification] = useState('');
  const [bulkConfirmAction, setBulkConfirmAction] = useState<ResolveDiscrepancyAction | null>(
    null
  );
  const bulkCancelRef = useRef<HTMLButtonElement>(null);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const summaryBg = useColorModeValue('gray.50', 'gray.700');
  const isReadOnly = receipt.status === GoodsReceiptStatus.APPROVED;

  const selectableDiscrepancies = useMemo(
    () => receipt.discrepancies.filter((d) => isDiscrepancySelectable(d, isReadOnly)),
    [receipt.discrepancies, isReadOnly]
  );
  const selectableIds = useMemo(
    () => selectableDiscrepancies.map((d) => d.id),
    [selectableDiscrepancies]
  );
  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedDiscrepancyIds.has(id));
  const someSelectableSelected = selectableIds.some((id) => selectedDiscrepancyIds.has(id));
  const supplierEmail = receipt.purchase_order?.supplier?.email?.trim() ?? '';
  const hasSupplierEmail = supplierEmail.length > 0;

  const physicalSyncKey = useMemo(() => physicalLinesSyncKey(receipt), [receipt]);
  const invoiceSyncKey = useMemo(() => invoiceLinesSyncKey(receipt), [receipt]);

  useEffect(() => {
    setSelectedDiscrepancyIds((prev) => {
      const eligible = new Set(selectableIds);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (eligible.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed || next.size !== prev.size ? next : prev;
    });
  }, [selectableIds]);

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
          key: createClientKey(),
          description: item.description,
          quantity_received: item.quantity,
          pr_item_id: item.pr_item_id ?? undefined,
        }))
      );
      return;
    }

    setPhysicalLines([{ key: createClientKey(), description: '', quantity_received: 1 }]);
    // Sync only when server content changes; ignore new array refs from polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- physicalSyncKey captures relevant fields
  }, [physicalSyncKey]);

  useEffect(() => {
    if (receipt.invoice_lines.length > 0) {
      setClassifications(buildClassificationsFromReceipt(receipt.invoice_lines));
    }
    // Sync only when server content changes; ignore new array refs from polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- invoiceSyncKey captures relevant fields
  }, [invoiceSyncKey]);

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

  const draftUnclassifiedCount = useMemo(
    () => classifications.filter((c) => c.destination_type === 'UNCLASSIFIED').length,
    [classifications]
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
            ? suggested.map((line) => ({ ...line, key: createClientKey() }))
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
      .map((line) => {
        const {
          line_number,
          description,
          quantity,
          unit_price,
          total_price,
          ncm,
          commercial_unit,
          cfop,
          cst,
          discount_value,
          icms_base,
          icms_value,
          icms_rate,
          icms_st_base,
          icms_st_value,
          ipi_value,
          ipi_rate,
          ibs_value,
          cbs_value,
          is_value,
        } = line;
        return {
          line_number,
          description: description.trim(),
          quantity,
          unit_price,
          total_price,
          ...(ncm ? { ncm } : {}),
          ...(commercial_unit !== undefined ? { commercial_unit } : {}),
          ...(cfop !== undefined ? { cfop } : {}),
          ...(cst !== undefined ? { cst } : {}),
          ...(discount_value !== undefined ? { discount_value } : {}),
          ...(icms_base !== undefined ? { icms_base } : {}),
          ...(icms_value !== undefined ? { icms_value } : {}),
          ...(icms_rate !== undefined ? { icms_rate } : {}),
          ...(icms_st_base !== undefined ? { icms_st_base } : {}),
          ...(icms_st_value !== undefined ? { icms_st_value } : {}),
          ...(ipi_value !== undefined ? { ipi_value } : {}),
          ...(ipi_rate !== undefined ? { ipi_rate } : {}),
          ...(ibs_value !== undefined ? { ibs_value } : {}),
          ...(cbs_value !== undefined ? { cbs_value } : {}),
          ...(is_value !== undefined ? { is_value } : {}),
        };
      });

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
        ncm_id: c.ncm_id ?? null,
        supply_ncm_action: c.destination_type === 'SUPPLY' ? c.supply_ncm_action : undefined,
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
    async (discrepancy: GoodsReceiptDiscrepancyDTO, action: 'accept' | 'notify_supplier') => {
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
        setSelectedDiscrepancyIds((prev) => {
          if (!prev.has(discrepancy.id)) return prev;
          const next = new Set(prev);
          next.delete(discrepancy.id);
          return next;
        });
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

  const toggleDiscrepancySelection = useCallback((id: string, checked: boolean) => {
    setSelectedDiscrepancyIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelectAllDiscrepancies = useCallback(
    (checked: boolean) => {
      setSelectedDiscrepancyIds(checked ? new Set(selectableIds) : new Set());
    },
    [selectableIds]
  );

  const handleBulkResolve = useCallback(
    async (action: ResolveDiscrepancyAction) => {
      const token = getToken();
      if (!token) return;

      const discrepancyIds = [...selectedDiscrepancyIds];
      if (discrepancyIds.length === 0) return;

      setBulkConfirmAction(null);
      setSubmitting(true);
      try {
        const result = await resolveGoodsReceiptDiscrepanciesBatch(token, receipt.id, {
          action,
          discrepancy_ids: discrepancyIds,
          justification: bulkJustification.trim() || undefined,
        });
        onReceiptUpdated(result.receipt);

        const succeeded = result.succeeded_ids.length;
        const failed = result.failed.length;
        toast({
          title:
            failed === 0
              ? `${succeeded} divergência(s) resolvida(s)`
              : `${succeeded} resolvida(s), ${failed} falha(s)`,
          status: failed === 0 ? 'success' : 'warning',
          duration: 5000,
          isClosable: true,
        });

        const failedEligible = new Set(
          result.failed
            .map((f) => f.discrepancy_id)
            .filter((id) => {
              const d = result.receipt.discrepancies.find((x) => x.id === id);
              return d != null && isDiscrepancySelectable(d, isReadOnly);
            })
        );
        setSelectedDiscrepancyIds(failedEligible);
        if (failed === 0) {
          setBulkJustification('');
        }
      } catch (err) {
        toast({
          title: 'Erro ao resolver divergências em lote',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      bulkJustification,
      isReadOnly,
      onReceiptUpdated,
      receipt.id,
      selectedDiscrepancyIds,
      toast,
    ]
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
      { key: createClientKey(), description: '', quantity_received: 1 },
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

    const selectedCount = selectedDiscrepancyIds.size;
    const bulkNotifyDisabled =
      isReadOnly || submitting || selectedCount === 0 || !hasSupplierEmail;
    const bulkAcceptDisabled = isReadOnly || submitting || selectedCount === 0;

    return (
      <VStack align="stretch" spacing={4}>
        <Box
          p={3}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          bg={summaryBg}
        >
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <HStack spacing={3}>
                <Checkbox
                  data-testid="gr-discrepancy-select-all"
                  isChecked={allSelectableSelected}
                  isIndeterminate={someSelectableSelected && !allSelectableSelected}
                  isDisabled={isReadOnly || submitting || selectableIds.length === 0}
                  onChange={(e) => toggleSelectAllDiscrepancies(e.target.checked)}
                >
                  Marcar todos
                </Checkbox>
                <Text fontSize="sm" color={mutedColor}>
                  {selectedCount} selecionadas
                </Text>
              </HStack>
              <HStack flexWrap="wrap" spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  data-testid="gr-discrepancy-bulk-accept"
                  isDisabled={bulkAcceptDisabled}
                  isLoading={submitting}
                  onClick={() => setBulkConfirmAction('accept')}
                >
                  Aceitar selecionadas
                </Button>
                <Button
                  size="sm"
                  colorScheme="orange"
                  data-testid="gr-discrepancy-bulk-notify"
                  isDisabled={bulkNotifyDisabled}
                  isLoading={submitting}
                  onClick={() => setBulkConfirmAction('notify_supplier')}
                >
                  Notificar fornecedor
                </Button>
              </HStack>
            </HStack>
            {!hasSupplierEmail && (
              <Text fontSize="xs" color={mutedColor}>
                Fornecedor sem e-mail cadastrado
              </Text>
            )}
            <Textarea
              size="sm"
              placeholder="Justificativa compartilhada (opcional)"
              value={bulkJustification}
              onChange={(e) => setBulkJustification(e.target.value)}
              isDisabled={isReadOnly || submitting}
              data-testid="gr-discrepancy-bulk-justification"
            />
          </VStack>
        </Box>

        {receipt.discrepancies.map((d) => {
          const selectable = isDiscrepancySelectable(d, isReadOnly);
          return (
            <Box
              key={d.id}
              p={4}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
              bg={summaryBg}
            >
              <HStack align="flex-start" spacing={3}>
                <Checkbox
                  mt={1}
                  data-testid={`gr-discrepancy-checkbox-${d.id}`}
                  isChecked={selectedDiscrepancyIds.has(d.id)}
                  isDisabled={!selectable || submitting}
                  onChange={(e) => toggleDiscrepancySelection(d.id, e.target.checked)}
                />
                <Box flex={1}>
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
              </HStack>
            </Box>
          );
        })}

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

        <AlertDialog
          isOpen={bulkConfirmAction != null}
          leastDestructiveRef={bulkCancelRef}
          onClose={() => setBulkConfirmAction(null)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {bulkConfirmAction === 'notify_supplier'
                  ? 'Notificar fornecedor'
                  : 'Aceitar divergências'}
              </AlertDialogHeader>
              <AlertDialogBody>
                {bulkConfirmAction === 'notify_supplier'
                  ? `Confirmar notificação de ${selectedCount} divergência(s)? Será enviado um único e-mail ao fornecedor.`
                  : `Confirmar aceite de ${selectedCount} divergência(s) selecionada(s)?`}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={bulkCancelRef} onClick={() => setBulkConfirmAction(null)}>
                  Cancelar
                </Button>
                <Button
                  colorScheme={bulkConfirmAction === 'notify_supplier' ? 'orange' : 'green'}
                  ml={3}
                  data-testid="gr-discrepancy-bulk-confirm"
                  onClick={() => {
                    if (bulkConfirmAction) {
                      void handleBulkResolve(bulkConfirmAction);
                    }
                  }}
                >
                  Confirmar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
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
          {draftUnclassifiedCount > 0 && (
            <Text fontSize="sm" color="orange.500">
              {draftUnclassifiedCount} linha(s) ainda não classificada(s).
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
