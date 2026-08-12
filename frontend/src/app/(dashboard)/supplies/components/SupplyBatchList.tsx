import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  useToast,
  HStack,
  Card,
  CardBody,
  VStack,
  useColorModeValue,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Tooltip,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  DrawerFooter,
  FormControl,
  FormLabel,
  Input,
  Text,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { FileCode, FileText, Filter, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { FiEye } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SupplyBatchDTO } from '@ti-assistant/contracts';
import { formatBRL, sumMoney } from '@/utils/money';
import { civilDateKeyFromIso } from '@/utils/civilDate';

type InvoiceFileType = 'image' | 'pdf' | 'xml';

interface BatchFilters {
  product: string;
  supplier: string;
  categoryId: string;
  entryDateFrom: string;
  entryDateTo: string;
  expiryDateFrom: string;
  expiryDateTo: string;
}

const EMPTY_FILTERS: BatchFilters = {
  product: '',
  supplier: '',
  categoryId: '',
  entryDateFrom: '',
  entryDateTo: '',
  expiryDateFrom: '',
  expiryDateTo: '',
};

function getInvoiceAction(fileType?: InvoiceFileType | null) {
  switch (fileType) {
    case 'image':
      return { icon: ImageIcon, label: 'Imagem' };
    case 'pdf':
      return { icon: FileText, label: 'PDF' };
    case 'xml':
      return { icon: FileCode, label: 'XML' };
    default:
      return { icon: FileText, label: 'NF' };
  }
}

/** Dia civil em America/Sao_Paulo; null quando o instante é inválido. */
function toCivilDayKey(value: string): string | null {
  try {
    return civilDateKeyFromIso(value);
  } catch {
    return null;
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const key = toCivilDayKey(value);
  if (!key) return '-';
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

function isWithinDateRange(
  isoDate: string | null | undefined,
  from: string,
  to: string,
): boolean {
  if (!isoDate) return false;
  const key = toCivilDayKey(isoDate);
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

function hasActiveFilters(filters: BatchFilters): boolean {
  return Object.values(filters).some(Boolean);
}

export function SupplyBatchList() {
  const [batches, setBatches] = useState<SupplyBatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<BatchFilters>(EMPTY_FILTERS);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  const handleViewDetails = (batchId: string) => {
    router.push(`/supplies/batches/${batchId}`);
  };

  const fetchBatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      const res = await fetch('/api/supply-batches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBatches(data);
    } catch {
      setBatches([]);
      toast({ title: 'Erro ao carregar lotes', status: 'error' });
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const uniqueProducts = useMemo(
    () => Array.from(new Set(batches.map((b) => b.supply?.name || 'Desconhecido'))).sort(),
    [batches],
  );

  const uniqueSuppliers = useMemo(
    () => Array.from(new Set(batches.map((b) => b.supplier?.name || 'Desconhecido'))).sort(),
    [batches],
  );

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const batch of batches) {
      const category = batch.supply?.category;
      if (category?.id) {
        map.set(category.id, category.label);
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const hasExpiryFilter = Boolean(filters.expiryDateFrom || filters.expiryDateTo);
    const hasEntryFilter = Boolean(filters.entryDateFrom || filters.entryDateTo);

    const filtered = batches.filter((batch) => {
      const productName = batch.supply?.name || 'Desconhecido';
      const supplierName = batch.supplier?.name || 'Desconhecido';

      if (filters.product && productName !== filters.product) return false;
      if (filters.supplier && supplierName !== filters.supplier) return false;
      if (filters.categoryId && batch.supply?.category?.id !== filters.categoryId) return false;

      if (hasEntryFilter && !isWithinDateRange(batch.purchased_at, filters.entryDateFrom, filters.entryDateTo)) {
        return false;
      }

      if (hasExpiryFilter && !isWithinDateRange(batch.expires_at, filters.expiryDateFrom, filters.expiryDateTo)) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => a.unit_price - b.unit_price);
  }, [batches, filters]);

  const avgPrice =
    filteredBatches.length > 0
      ? sumMoney(filteredBatches.map((b) => b.unit_price)) / filteredBatches.length
      : null;

  const filtersActive = hasActiveFilters(filters);

  const updateFilter = (key: keyof BatchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Lotes de Suprimentos', 14, 16);
    const tableData = filteredBatches.map((b) => [
      b.supply?.name || '-',
      b.supplier?.name || '-',
      b.purchased_quantity ?? '-',
      formatBRL(b.unit_price),
      formatDate(b.purchased_at),
      formatDate(b.expires_at),
      b.notes || '-',
    ]);
    autoTable(doc, {
      head: [['Produto', 'Fornecedor', 'Quantidade', 'Preço Unit.', 'Data Entrada', 'Validade', 'Observações']],
      body: tableData,
      startY: 24,
    });
    doc.save('lotes_suprimentos.pdf');
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <>
      <VStack spacing={2} align="stretch" h="full" minH={0}>
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" flex="1" minH={0} display="flex" flexDirection="column">
          <CardBody p={3} flex="1" minH={0} display="flex" flexDirection="column">
            <HStack justify="space-between" mb={2} flexWrap="wrap" flexShrink={0} gap={2}>
              {filteredBatches.length > 0 && (
                <Stat bg={bgColor} p={1.5} borderRadius="md" flexShrink={0}>
                  <StatLabel fontSize="xs" mb={0}>Preço Médio</StatLabel>
                  <StatNumber fontSize="sm">{avgPrice != null ? formatBRL(avgPrice) : '-'}</StatNumber>
                </Stat>
              )}
              <HStack spacing={1} ml="auto" flexWrap="wrap">
                <Tooltip label="Filtros">
                  <Box position="relative">
                    <IconButton
                      aria-label="Filtros"
                      icon={<Filter size={16} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={onOpen}
                    />
                    {filtersActive && (
                      <Badge
                        position="absolute"
                        top="-1"
                        right="-1"
                        borderRadius="full"
                        boxSize="2.5"
                        colorScheme="blue"
                        p={0}
                      />
                    )}
                  </Box>
                </Tooltip>
                <Tooltip label="Atualizar">
                  <IconButton
                    aria-label="Atualizar"
                    icon={<RotateCcw size={16} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => fetchBatches(true)}
                    isDisabled={refreshing}
                    sx={{
                      '& svg': {
                        animation: refreshing ? 'spin 1s linear infinite reverse' : undefined,
                      },
                    }}
                  />
                </Tooltip>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={exportPDF}
                  leftIcon={<FileText size={16} />}
                  isDisabled={filteredBatches.length === 0}
                  minW="140px"
                  h="36px"
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s ease"
                >
                  Exportar PDF
                </Button>
              </HStack>
            </HStack>

            <Box flex="1" minH={0} overflowX="auto" overflowY="auto">
              <Table size="sm" variant="striped">
                <Thead>
                  <Tr>
                    <Th>Produto</Th>
                    <Th>Fornecedor</Th>
                    <Th>Quantidade</Th>
                    <Th>Preço Unit.</Th>
                    <Th>Data Entrada</Th>
                    <Th>Validade</Th>
                    <Th>Observações</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((b) => {
                      const invoiceAction = b.invoice_url
                        ? getInvoiceAction(b.invoice_file_type)
                        : null;
                      const InvoiceIcon = invoiceAction?.icon;

                      return (
                        <Tr key={b.id}>
                          <Td>{b.supply?.name || '-'}</Td>
                          <Td>{b.supplier?.name || '-'}</Td>
                          <Td>{b.purchased_quantity ?? '-'}</Td>
                          <Td>{formatBRL(b.unit_price)}</Td>
                          <Td>{formatDate(b.purchased_at)}</Td>
                          <Td>{formatDate(b.expires_at)}</Td>
                          <Td>{b.notes || '-'}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="Ver Detalhes">
                                <IconButton
                                  aria-label="Ver Detalhes"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => handleViewDetails(b.id)}
                                />
                              </Tooltip>
                              {InvoiceIcon && invoiceAction && (
                                <Tooltip label="Abrir NF">
                                  <IconButton
                                    aria-label={`Abrir NF - ${invoiceAction.label}`}
                                    icon={<InvoiceIcon size={16} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={() => window.open(b.invoice_url!, '_blank')}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan={8} textAlign="center" color="gray.500" py={6}>
                        Nenhum lote encontrado para os filtros selecionados.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg} borderLeft="1px solid" borderColor={drawerBorder}>
          <DrawerCloseButton />
          <DrawerHeader color={textColor} borderBottom="1px solid" borderColor={drawerBorder}>
            <HStack spacing={2}>
              <Filter size={20} />
              <Text>Filtros</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} pt={4} align="stretch">
              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Produto</FormLabel>
                <Select
                  placeholder="Todos os produtos"
                  value={filters.product}
                  onChange={(e) => updateFilter('product', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                >
                  {uniqueProducts.map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Fornecedor</FormLabel>
                <Select
                  placeholder="Todos os fornecedores"
                  value={filters.supplier}
                  onChange={(e) => updateFilter('supplier', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                >
                  {uniqueSuppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Categoria</FormLabel>
                <Select
                  placeholder="Todas as categorias"
                  value={filters.categoryId}
                  onChange={(e) => updateFilter('categoryId', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                >
                  {uniqueCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Entrada — de</FormLabel>
                <Input
                  type="date"
                  value={filters.entryDateFrom}
                  onChange={(e) => updateFilter('entryDateFrom', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                  _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Entrada — até</FormLabel>
                <Input
                  type="date"
                  value={filters.entryDateTo}
                  onChange={(e) => updateFilter('entryDateTo', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                  _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Validade — de</FormLabel>
                <Input
                  type="date"
                  value={filters.expiryDateFrom}
                  onChange={(e) => updateFilter('expiryDateFrom', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                  _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor} fontSize="sm">Validade — até</FormLabel>
                <Input
                  type="date"
                  value={filters.expiryDateTo}
                  onChange={(e) => updateFilter('expiryDateTo', e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                  _focus={{ borderColor: iconColor, boxShadow: `0 0 0 1px ${iconColor}` }}
                />
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor={drawerBorder}>
            <Button
              variant="outline"
              size="sm"
              w="full"
              onClick={clearFilters}
              isDisabled={!filtersActive}
            >
              Limpar filtros
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
