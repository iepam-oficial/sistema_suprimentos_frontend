'use client';

import {
  Badge,
  Box,
  HStack,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ManagerOpsSupplierPerformanceDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface ManagerOpsSuppliersTableProps {
  data: ManagerOpsSupplierPerformanceDTO[] | undefined;
  loading: boolean;
}

const MAX_HEIGHT = 260;

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function discrepancyColorScheme(value: number): string {
  if (value >= 0.1) return 'red';
  if (value >= 0.05) return 'orange';
  return 'green';
}

export function ManagerOpsSuppliersTable({ data, loading }: ManagerOpsSuppliersTableProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const headerColor = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  const rows = data ?? [];

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Desempenho de Fornecedores
        </Text>
      </HStack>

      {loading && !data ? (
        <Skeleton height={`${MAX_HEIGHT}px`} borderRadius="md" />
      ) : rows.length === 0 ? (
        <Box
          h="120px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={labelColor}
          fontSize="sm"
        >
          Sem dados no período selecionado
        </Box>
      ) : (
        <TableContainer
          maxH={`${MAX_HEIGHT}px`}
          overflowY="auto"
          opacity={loading ? 0.6 : 1}
          transition="opacity 0.2s"
        >
          <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
              <Tr>
                <Th fontSize="10px" color={headerColor}>
                  Fornecedor
                </Th>
                <Th fontSize="10px" color={headerColor} isNumeric>
                  Compras
                </Th>
                <Th fontSize="10px" color={headerColor} isNumeric>
                  Valor Total
                </Th>
                <Th fontSize="10px" color={headerColor} isNumeric>
                  Discrepância
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.supplierId} _hover={{ bg: rowHoverBg }}>
                  <Td fontSize="xs">{row.name}</Td>
                  <Td fontSize="xs" isNumeric>
                    {row.purchasesCount}
                  </Td>
                  <Td fontSize="xs" isNumeric>
                    {formatBRL(row.totalValue)}
                  </Td>
                  <Td fontSize="xs" isNumeric>
                    <Badge colorScheme={discrepancyColorScheme(row.discrepancyRate)} fontSize="9px">
                      {formatPercent(row.discrepancyRate)}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
