import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Box,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Textarea,
  ListItem,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Paperclip } from 'lucide-react';
import { AnchoredDropdownList } from '@/components/ui/AnchoredDropdownList';
import { createBatch, fetchSuppliers, searchSupplies } from '@/features/catalog/api/catalogApi';
import { uploadSupplyBatchInvoice } from '@/features/catalog/api/supplyBatchInvoiceApi';
import type { CreateSupplyBatchInput, SupplierDTO, SupplyDTO } from '@/features/catalog/types';
import type { SupplyBatchInvoiceFileType } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';
import { formatCurrencyBR, parseCurrencyBR, sanitizeCurrencyInput } from '@/utils/currencyInput';

const inferInvoiceFileType = (file: File): SupplyBatchInvoiceFileType | null => {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name)) {
    return 'image';
  }
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    file.type === 'application/xml' ||
    file.type === 'text/xml' ||
    name.endsWith('.xml')
  ) {
    return 'xml';
  }
  return null;
};

const invoiceFileTypeLabel: Record<SupplyBatchInvoiceFileType, string> = {
  image: 'Imagem',
  pdf: 'PDF',
  xml: 'XML',
};

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm = {
  supply_id: '',
  supplier_id: '',
  purchased_quantity: 1,
  unit_price: '',
  freight: '',
  purchased_at: new Date().toISOString().slice(0, 10),
  expires_at: '',
  notes: '',
  invoice_url: '',
};

export function NewBatchModal({ isOpen, onClose, onSuccess }: NewBatchModalProps) {
  const [formData, setFormData] = useState(initialForm);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [supplyQuery, setSupplyQuery] = useState('');
  const [supplySuggestions, setSupplySuggestions] = useState<SupplyDTO[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<SupplyDTO | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<File | null>(null);
  const [pendingInvoiceFileType, setPendingInvoiceFileType] =
    useState<SupplyBatchInvoiceFileType | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const supplyInputRef = useRef<HTMLInputElement | null>(null);
  const supplyListRef = useRef<HTMLUListElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();
  const suggestionHoverBg = useColorModeValue('gray.100', 'gray.600');

  const resetForm = useCallback(() => {
    setFormData(initialForm);
    setSupplyQuery('');
    setSupplySuggestions([]);
    setSelectedSupply(null);
    setShowSuggestions(false);
    setSelectedInvoice(null);
    setPendingInvoiceFileType(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    const loadSuppliers = async () => {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        if (!token) return;
        const data = await fetchSuppliers(token);
        setSuppliers(Array.isArray(data) ? data : []);
      } catch {
        setSuppliers([]);
        toast({
          title: 'Erro ao carregar fornecedores',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    loadSuppliers();
  }, [isOpen, resetForm, toast]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = supplyQuery.trim();
    if (trimmed.length < 2) {
      setSupplySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (selectedSupply && trimmed === selectedSupply.name) {
      setSupplySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        if (!token) return;
        const results = await searchSupplies(token, trimmed, { includeHidden: true });
        setSupplySuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSupplySuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [supplyQuery, isOpen, selectedSupply]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (supplyInputRef.current?.contains(target) || supplyListRef.current?.contains(target)) {
        return;
      }
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSupplySelect = (supply: SupplyDTO) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSelectedSupply(supply);
    setSupplyQuery(supply.name);
    setFormData((prev) => ({ ...prev, supply_id: supply.id }));
    setSupplySuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supply_id || !formData.supplier_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o suprimento e o fornecedor.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.purchased_quantity <= 0) {
      toast({
        title: 'Quantidade inválida',
        description: 'Informe uma quantidade maior que zero.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Sessão expirada');

      let invoiceUrl: string | null = formData.invoice_url || null;
      let invoiceFileType: SupplyBatchInvoiceFileType | null = null;

      if (selectedInvoice) {
        const uploadResult = await uploadSupplyBatchInvoice(selectedInvoice);
        invoiceUrl = uploadResult.key;
        invoiceFileType = uploadResult.file_type;
      }

      const payload: CreateSupplyBatchInput = {
        supply_id: formData.supply_id,
        supplier_id: formData.supplier_id,
        purchased_quantity: Math.floor(formData.purchased_quantity),
        unit_price: parseCurrencyBR(formData.unit_price),
        freight: parseCurrencyBR(formData.freight) || undefined,
        purchased_at: formData.purchased_at
          ? new Date(formData.purchased_at).toISOString()
          : undefined,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : null,
        notes: formData.notes || null,
        invoice_url: invoiceUrl,
        invoice_file_type: invoiceFileType,
      };

      await createBatch(token, payload);

      toast({
        title: 'Lote criado',
        description: 'Entrada de estoque registrada com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast({
        title: 'Erro ao criar lote',
        description: error instanceof Error ? error.message : 'Não foi possível criar o lote.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCurrencyBlur = (field: 'unit_price' | 'freight') => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] ? formatCurrencyBR(prev[field]) : '',
    }));
  };

  const unitPrice = parseCurrencyBR(formData.unit_price);
  const freight = parseCurrencyBR(formData.freight);
  const totalPreview = unitPrice * formData.purchased_quantity + freight;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent maxW={{ base: '95vw', md: '720px' }} mx={{ base: 2, md: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Novo Lote — Entrada de Estoque</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Suprimento</FormLabel>
                <Input
                  ref={supplyInputRef}
                  value={supplyQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSupplyQuery(value);
                    if (selectedSupply && value !== selectedSupply.name) {
                      setSelectedSupply(null);
                      setFormData((prev) => ({ ...prev, supply_id: '' }));
                    } else if (!selectedSupply) {
                      setFormData((prev) => ({ ...prev, supply_id: '' }));
                    }
                  }}
                  onFocus={() => {
                    if (supplySuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Buscar suprimento..."
                  autoComplete="off"
                />
                <AnchoredDropdownList
                  anchorRef={supplyInputRef}
                  listRef={supplyListRef}
                  isOpen={showSuggestions && !selectedSupply && supplySuggestions.length > 0}
                >
                  {supplySuggestions.map((supply) => (
                    <ListItem
                      key={supply.id}
                      px={3}
                      py={2}
                      cursor="pointer"
                      _hover={{ bg: suggestionHoverBg }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSupplySelect(supply);
                      }}
                    >
                      <Text fontWeight="medium">{supply.name}</Text>
                      {supply.description && (
                        <Text fontSize="sm" color="gray.500">
                          {supply.description}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.400">
                        Disponível: {supply.available_quantity} {supply.unit?.symbol ?? ''}
                      </Text>
                    </ListItem>
                  ))}
                </AnchoredDropdownList>
                {selectedSupply && (
                  <Text fontSize="sm" color="green.500" mt={1}>
                    Selecionado: {selectedSupply.name}
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fornecedor</FormLabel>
                <Select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supplier_id: e.target.value }))}
                  placeholder="Selecione um fornecedor"
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.cnpj ? ` — ${supplier.cnpj}` : ''}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Quantidade Comprada</FormLabel>
                  <NumberInput
                    min={1}
                    step={1}
                    precision={0}
                    value={formData.purchased_quantity}
                    onChange={(_, value) => {
                      const qty = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
                      setFormData((prev) => ({ ...prev, purchased_quantity: qty }));
                    }}
                  >
                    <NumberInputField inputMode="numeric" pattern="[0-9]*" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Preço Unitário</FormLabel>
                  <Input
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unit_price: sanitizeCurrencyInput(e.target.value),
                      }))
                    }
                    onBlur={() => handleCurrencyBlur('unit_price')}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Frete</FormLabel>
                  <Input
                    value={formData.freight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        freight: sanitizeCurrencyInput(e.target.value),
                      }))
                    }
                    onBlur={() => handleCurrencyBlur('freight')}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Total estimado</FormLabel>
                  <Input value={formatBRL(totalPreview)} isReadOnly />
                </FormControl>

                <FormControl>
                  <FormLabel>Data da Compra</FormLabel>
                  <Input
                    type="date"
                    value={formData.purchased_at}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, purchased_at: e.target.value }))
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Data de Validade</FormLabel>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, expires_at: e.target.value }))
                    }
                  />
                </FormControl>
              </Box>

              <FormControl>
                <FormLabel>Nota Fiscal (NF)</FormLabel>
                <Button
                  leftIcon={<Paperclip size={18} />}
                  onClick={() => inputFileRef.current?.click()}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  type="button"
                >
                  Anexar NF (imagem, PDF ou XML)
                </Button>
                <input
                  ref={inputFileRef}
                  type="file"
                  accept="image/*,.pdf,.xml,application/pdf,application/xml,text/xml"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedInvoice(file);
                    setPendingInvoiceFileType(file ? inferInvoiceFileType(file) : null);
                  }}
                />
                {selectedInvoice && (
                  <Text fontSize="sm" color="green.500" mt={1}>
                    {selectedInvoice.name}
                    {pendingInvoiceFileType
                      ? ` (${invoiceFileTypeLabel[pendingInvoiceFileType]})`
                      : ''}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o lote..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={submitting}>
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={submitting}>
              Criar Lote
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
