'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  useToast,
  useColorModeValue,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiFileText,
  FiCalendar,
  FiPackage,
  FiTruck,
  FiDownload,
} from 'react-icons/fi';
import { FileText } from 'lucide-react';
import type { SupplyBatchDTO, SupplyBatchInvoiceFileType } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';
import { exportToCSV } from '@/utils/exportToCSV';
import { SupplyBatchFiscalLinesTable } from './SupplyBatchFiscalLinesTable';
import {
  FISCAL_EXPORT_HEADERS,
  buildFiscalExportRows,
} from './supplyBatchFiscalExport';

interface SupplyBatchDetailsProps {
  batchId: string;
  onBack: () => void;
}

function getInvoiceFileTypeLabel(fileType?: SupplyBatchInvoiceFileType | null): string {
  switch (fileType) {
    case 'image':
      return 'Imagem';
    case 'pdf':
      return 'PDF';
    case 'xml':
      return 'XML';
    default:
      return 'Arquivo';
  }
}

export function SupplyBatchDetails({ batchId, onBack }: SupplyBatchDetailsProps) {
  const [batch, setBatch] = useState<SupplyBatchDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      const response = await fetch(`/api/supply-batches/${batchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes do lote');
      }

      const data = (await response.json()) as SupplyBatchDTO;
      setBatch(data);
    } catch {
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar os detalhes do lote.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = () => {
    if (!batch?.expires_at) return <Badge colorScheme="blue">Sem Validade</Badge>;

    const today = new Date();
    const expiryDate = new Date(batch.expires_at);

    if (expiryDate < today) {
      return <Badge colorScheme="red">Vencido</Badge>;
    } else if (expiryDate.getTime() - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
      return <Badge colorScheme="orange">Vencendo</Badge>;
    } else {
      return <Badge colorScheme="green">Válido</Badge>;
    }
  };

  const fiscalLines = batch?.fiscal_lines ?? [];

  const exportFiscalCSV = () => {
    if (!batch) return;
    const body = buildFiscalExportRows(fiscalLines);
    exportToCSV({
      head: [...FISCAL_EXPORT_HEADERS],
      body,
      fileName: `lote_${batch.id}_fiscal.csv`,
    });
  };

  const exportFiscalPDF = async () => {
    if (!batch) return;
    // Dynamic import avoids pulling jspdf/canvg into the page compile graph (Next/babel flake).
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF({ orientation: 'landscape' });
    const supplyName = batch.supply?.name ?? '—';
    doc.setFontSize(14);
    doc.text('Snapshot fiscal do lote', 14, 16);
    doc.setFontSize(10);
    doc.text(`Produto: ${supplyName}  |  Lote: ${batch.id}`, 14, 22);

    const body = buildFiscalExportRows(fiscalLines);
    autoTable(doc, {
      head: [[...FISCAL_EXPORT_HEADERS]],
      body,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fontSize: 7 },
    });
    if (body.length === 0) {
      const finalY =
        (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 28;
      doc.setFontSize(9);
      doc.text('Nenhuma linha fiscal vinculada a este lote.', 14, finalY + 8);
    }
    doc.save(`lote_${batch.id}_fiscal.pdf`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!batch) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color={textColor}>
          Lote não encontrado
        </Text>
        <Button mt={4} onClick={onBack} leftIcon={<FiArrowLeft />}>
          Voltar
        </Button>
      </Box>
    );
  }

  const openInvoice = () => {
    if (batch.invoice_url) {
      window.open(batch.invoice_url, '_blank');
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <HStack spacing={4}>
          <IconButton
            aria-label="Voltar"
            icon={<FiArrowLeft />}
            onClick={onBack}
            variant="ghost"
          />
          <Box>
            <Heading size="lg" color={textColor}>
              Detalhes do Lote
            </Heading>
            <Text color="gray.500" fontSize="sm">
              ID: {batch.id}
            </Text>
          </Box>
        </HStack>
        {getStatusBadge()}
      </HStack>

      {batch.invoice_recommended && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Recomenda-se anexar a nota fiscal a este lote para manter o snapshot fiscal.
        </Alert>
      )}

      {batch.fiscal_incomplete && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Dados fiscais incompletos: falta unidade comercial, CFOP ou CST em uma ou mais linhas.
        </Alert>
      )}

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Informações Principais */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            {/* Informações do Produto */}
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <HStack>
                  <FiPackage />
                  <Heading size="md">Informações do Produto</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Nome
                    </Text>
                    <Text>{batch.supply?.name ?? '—'}</Text>
                  </Box>
                  {batch.supply?.description && (
                    <Box>
                      <Text fontWeight="bold" color={textColor}>
                        Descrição
                      </Text>
                      <Text>{batch.supply.description}</Text>
                    </Box>
                  )}
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Categoria
                    </Text>
                    <Text>{batch.supply?.category?.label ?? '—'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Unidade
                    </Text>
                    <Text>
                      {batch.supply?.unit
                        ? `${batch.supply.unit.name} (${batch.supply.unit.symbol})`
                        : '—'}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Informações do Fornecedor */}
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <HStack>
                  <FiTruck />
                  <Heading size="md">Informações do Fornecedor</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Nome
                    </Text>
                    <Text>{batch.supplier?.name ?? '—'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Email
                    </Text>
                    <Text>{batch.supplier?.email ?? '—'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Telefone
                    </Text>
                    <Text>{batch.supplier?.phone ?? '—'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Endereço
                    </Text>
                    <Text>{batch.supplier?.address ?? '—'}</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Snapshot fiscal */}
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                  <HStack>
                    <FiFileText />
                    <Heading size="md">Snapshot fiscal</Heading>
                  </HStack>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      variant="outline"
                      leftIcon={<FiDownload />}
                      onClick={exportFiscalCSV}
                    >
                      Exportar CSV
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<FileText size={16} />}
                      onClick={exportFiscalPDF}
                    >
                      Exportar PDF
                    </Button>
                  </HStack>
                </HStack>
              </CardHeader>
              <CardBody>
                <SupplyBatchFiscalLinesTable fiscal_lines={fiscalLines} />
              </CardBody>
            </Card>

            {/* Observações */}
            {batch.notes && (
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <Heading size="md">Observações</Heading>
                </CardHeader>
                <CardBody>
                  <Text>{batch.notes}</Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        </GridItem>

        {/* Sidebar com Estatísticas e Ações */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            {/* Estatísticas */}
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <Heading size="md">Estatísticas</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Stat>
                    <StatLabel>Quantidade</StatLabel>
                    <StatNumber>{batch.purchased_quantity}</StatNumber>
                    <StatHelpText>{batch.supply?.unit?.symbol ?? 'un'}</StatHelpText>
                  </Stat>
                  <Divider />
                  <Stat>
                    <StatLabel>Preço Unitário</StatLabel>
                    <StatNumber>{formatBRL(batch.unit_price)}</StatNumber>
                  </Stat>
                  <Divider />
                  <Stat>
                    <StatLabel>Valor Total</StatLabel>
                    <StatNumber>{formatBRL(batch.total_price)}</StatNumber>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            {/* Datas */}
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <HStack>
                  <FiCalendar />
                  <Heading size="md">Datas</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontWeight="bold" color={textColor}>
                      Data de Compra
                    </Text>
                    <Text>{formatDate(batch.purchased_at)}</Text>
                  </Box>
                  {batch.expires_at && (
                    <Box>
                      <Text fontWeight="bold" color={textColor}>
                        Data de Validade
                      </Text>
                      <Text>{formatDate(batch.expires_at)}</Text>
                    </Box>
                  )}
                  {batch.created_at && (
                    <Box>
                      <Text fontWeight="bold" color={textColor}>
                        Criado em
                      </Text>
                      <Text>{formatDate(batch.created_at)}</Text>
                    </Box>
                  )}
                  {batch.updated_at && (
                    <Box>
                      <Text fontWeight="bold" color={textColor}>
                        Atualizado em
                      </Text>
                      <Text>{formatDate(batch.updated_at)}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Nota Fiscal */}
            {batch.invoice_url && (
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <HStack>
                    <FiFileText />
                    <Heading size="md">Nota Fiscal</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontWeight="bold" color={textColor}>
                        Tipo
                      </Text>
                      <Text>{getInvoiceFileTypeLabel(batch.invoice_file_type)}</Text>
                    </Box>
                    <Button
                      leftIcon={<FiFileText />}
                      colorScheme="blue"
                      onClick={openInvoice}
                      size="sm"
                      w="full"
                    >
                      Abrir nota fiscal
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
