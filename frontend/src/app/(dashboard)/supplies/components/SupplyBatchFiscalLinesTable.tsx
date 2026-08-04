'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import type { SupplyBatchFiscalLineDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

export interface SupplyBatchFiscalLinesTableProps {
  fiscal_lines: SupplyBatchFiscalLineDTO[];
}

/** Núcleo incompleto: falta commercial_unit, CFOP ou CST. */
export function isFiscalNucleusIncomplete(line: SupplyBatchFiscalLineDTO): boolean {
  return line.commercial_unit == null || line.cfop == null || line.cst == null;
}

function formatText(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return value;
}

function formatQty(value: number): string {
  return value.toLocaleString('pt-BR');
}

function formatMoneyOrDash(value: number | null | undefined): string {
  if (value == null) return '—';
  return formatBRL(value);
}

function formatRateOrDash(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" fontWeight="medium">
        {label}
      </Text>
      <Text fontSize="sm">{value}</Text>
    </Box>
  );
}

function lineKey(line: SupplyBatchFiscalLineDTO, index: number): string {
  return line.id ?? `${line.line_number}-${index}`;
}

export function SupplyBatchFiscalLinesTable({ fiscal_lines }: SupplyBatchFiscalLinesTableProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLine, setSelectedLine] = useState<SupplyBatchFiscalLineDTO | null>(null);

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const openLineDetails = (line: SupplyBatchFiscalLineDTO) => {
    setSelectedLine(line);
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setSelectedLine(null);
  };

  if (fiscal_lines.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        py={8}
        px={4}
        textAlign="center"
      >
        <Text color={mutedColor} fontSize="sm">
          Nenhuma linha fiscal vinculada a este lote.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Box
        overflowX="auto"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
      >
        <Table size="sm" variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th>Descrição</Th>
              <Th isNumeric>Qtd</Th>
              <Th>Unidade</Th>
              <Th>CFOP</Th>
              <Th>CST</Th>
              <Th isNumeric>V. unitário</Th>
              <Th isNumeric>V. total</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fiscal_lines.map((line, index) => {
              const incomplete = isFiscalNucleusIncomplete(line);
              return (
                <Tr
                  key={lineKey(line, index)}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => openLineDetails(line)}
                >
                  <Td color={textColor} maxW="280px">
                    <Text noOfLines={2} fontSize="sm">
                      {line.description}
                    </Text>
                  </Td>
                  <Td isNumeric color={textColor} whiteSpace="nowrap">
                    {formatQty(line.quantity)}
                  </Td>
                  <Td color={textColor} whiteSpace="nowrap">
                    {formatText(line.commercial_unit)}
                  </Td>
                  <Td color={textColor} whiteSpace="nowrap">
                    {formatText(line.cfop)}
                  </Td>
                  <Td color={textColor} whiteSpace="nowrap">
                    {formatText(line.cst)}
                  </Td>
                  <Td isNumeric color={textColor} whiteSpace="nowrap">
                    {formatBRL(line.unit_price)}
                  </Td>
                  <Td isNumeric color={textColor} whiteSpace="nowrap">
                    {formatBRL(line.total_price)}
                  </Td>
                  <Td>
                    {incomplete ? (
                      <Badge colorScheme="orange" fontSize="0.7em">
                        Incompleto
                      </Badge>
                    ) : (
                      <Badge colorScheme="green" fontSize="0.7em">
                        Completo
                      </Badge>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" color={textColor}>
            Detalhes fiscais
            {selectedLine != null ? ` — linha ${selectedLine.line_number}` : ''}
          </DrawerHeader>
          <DrawerBody py={4}>
            {selectedLine && (
              <VStack align="stretch" spacing={5}>
                <Box>
                  <HStack justify="space-between" align="flex-start" mb={2}>
                    <Text fontWeight="semibold" color={textColor}>
                      {selectedLine.description}
                    </Text>
                    {isFiscalNucleusIncomplete(selectedLine) && (
                      <Badge colorScheme="orange" flexShrink={0}>
                        Incompleto
                      </Badge>
                    )}
                  </HStack>
                  {selectedLine.ncm_from_invoice && (
                    <Text fontSize="sm" color={mutedColor}>
                      NCM (NF): {selectedLine.ncm_from_invoice}
                    </Text>
                  )}
                </Box>

                <SimpleGrid columns={2} spacing={4}>
                  <DetailItem label="Quantidade" value={formatQty(selectedLine.quantity)} />
                  <DetailItem label="Unidade" value={formatText(selectedLine.commercial_unit)} />
                  <DetailItem label="CFOP" value={formatText(selectedLine.cfop)} />
                  <DetailItem label="CST" value={formatText(selectedLine.cst)} />
                  <DetailItem label="V. unitário" value={formatBRL(selectedLine.unit_price)} />
                  <DetailItem label="V. total" value={formatBRL(selectedLine.total_price)} />
                </SimpleGrid>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                    Impostos e descontos
                  </Text>
                  <SimpleGrid columns={2} spacing={4}>
                    <DetailItem
                      label="Desconto"
                      value={formatMoneyOrDash(selectedLine.discount_value)}
                    />
                    <DetailItem
                      label="BC ICMS"
                      value={formatMoneyOrDash(selectedLine.icms_base)}
                    />
                    <DetailItem
                      label="Valor ICMS"
                      value={formatMoneyOrDash(selectedLine.icms_value)}
                    />
                    <DetailItem
                      label="Alíquota ICMS"
                      value={formatRateOrDash(selectedLine.icms_rate)}
                    />
                    <DetailItem
                      label="BC ICMS ST"
                      value={formatMoneyOrDash(selectedLine.icms_st_base)}
                    />
                    <DetailItem
                      label="Valor ICMS ST"
                      value={formatMoneyOrDash(selectedLine.icms_st_value)}
                    />
                    <DetailItem
                      label="Valor IPI"
                      value={formatMoneyOrDash(selectedLine.ipi_value)}
                    />
                    <DetailItem
                      label="Alíquota IPI"
                      value={formatRateOrDash(selectedLine.ipi_rate)}
                    />
                    {selectedLine.ibs_value != null && (
                      <DetailItem label="IBS" value={formatBRL(selectedLine.ibs_value)} />
                    )}
                    {selectedLine.cbs_value != null && (
                      <DetailItem label="CBS" value={formatBRL(selectedLine.cbs_value)} />
                    )}
                    {selectedLine.is_value != null && (
                      <DetailItem label="IS" value={formatBRL(selectedLine.is_value)} />
                    )}
                  </SimpleGrid>
                </Box>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
