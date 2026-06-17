import { useEffect, useState } from 'react';
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
  Container,
  Heading,
  VStack,
  useColorModeValue,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FileCode, FileText, Image as ImageIcon } from 'lucide-react';
import { FiEye } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatBRL, sumMoney } from '@/utils/money';

type InvoiceFileType = 'image' | 'pdf' | 'xml';

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

export function SupplyBatchList() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState('');
  const toast = useToast();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleViewDetails = (batchId: string) => {
    router.push(`/supplies/batches/${batchId}`);
  };

  useEffect(() => {
    async function fetchBatches() {
      setLoading(true);
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        const res = await fetch('/api/supply-batches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setBatches(data);
      } catch (e) {
        setBatches([]);
        toast({ title: 'Erro ao carregar lotes', status: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, [toast]);

  // Produtos únicos para o filtro
  const uniqueItems = Array.from(new Set(batches.map(b => b.supply?.name || 'Desconhecido')));

  // Filtrar lotes pelo item selecionado
  const filteredBatches = selectedItem
    ? batches.filter(b => (b.supply?.name || 'Desconhecido') === selectedItem)
    : batches;

  // Calcular preço médio do item filtrado
  const avgPrice =
    filteredBatches.length > 0
      ? sumMoney(filteredBatches.map((b) => b.unit_price)) / filteredBatches.length
      : null;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Lotes de Suprimentos', 14, 16);
    const tableData = filteredBatches.map((b) => [
      b.supply?.name || '-',
      b.supplier?.name || '-',
      b.quantity,
      formatBRL(b.unit_price),
      b.purchased_at?.slice(0, 10),
      b.expires_at ? b.expires_at.slice(0, 10) : '-',
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
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Lotes de Suprimentos</Heading>
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <HStack justify="space-between" mb={4} flexWrap="wrap">
              <Box fontWeight="bold" fontSize="md">Lista de Lotes</Box>
              <HStack spacing={4}>
                <Select
                  placeholder="Filtrar por produto"
                  value={selectedItem}
                  onChange={e => setSelectedItem(e.target.value)}
                  maxW="250px"
                >
                  {uniqueItems.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
                <Button colorScheme="blue" onClick={exportPDF}>Exportar PDF</Button>
              </HStack>
            </HStack>
            {selectedItem && (
              <Stat bg={bgColor} p={2} borderRadius="md" boxShadow="sm" mb={4} maxW="300px">
                <StatLabel>Preço Médio do Item</StatLabel>
                <StatNumber>{avgPrice != null ? formatBRL(avgPrice) : '-'}</StatNumber>
              </Stat>
            )}
            <Box overflowX="auto">
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
                  {filteredBatches.length > 0 && filteredBatches.map((b) => {
                    const invoiceAction = b.invoice_url
                      ? getInvoiceAction(b.invoice_file_type)
                      : null;
                    const InvoiceIcon = invoiceAction?.icon;

                    return (
                    <Tr key={b.id}>
                      <Td>{b.supply?.name || '-'}</Td>
                      <Td>{b.supplier?.name || '-'}</Td>
                      <Td>{b.quantity}</Td>
                      <Td>{formatBRL(b.unit_price)}</Td>
                      <Td>{b.purchased_at?.slice(0, 10)}</Td>
                      <Td>{b.expires_at ? b.expires_at.slice(0, 10) : '-'}</Td>
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
                                onClick={() => window.open(b.invoice_url, '_blank')}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </>
  );
} 