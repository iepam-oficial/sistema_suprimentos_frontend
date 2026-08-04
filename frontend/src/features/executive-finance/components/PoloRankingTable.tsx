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
import type { PoloRankingRowDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface PoloRankingTableProps {
  data: PoloRankingRowDTO[] | undefined;
  loading: boolean;
  /** Drill-down level 1 (EFD-23): clicking a row filters the dashboard inline by polo. */
  onRowClick?: (row: PoloRankingRowDTO) => void;
}

const MAX_HEIGHT = 280;

function scoreColorScheme(score: number): string {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function PoloRankingTable({ data, loading, onRowClick }: PoloRankingTableProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const headerColor = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  const rows = [...(data ?? [])].sort((a, b) => b.score - a.score);

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
          Ranking de Polos
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
        <TableContainer maxH={`${MAX_HEIGHT}px`} overflowY="auto" opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
          <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} bg={cardBg} zIndex={1}>
              <Tr>
                <Th fontSize="10px" color={headerColor}>Polo</Th>
                <Th fontSize="10px" color={headerColor} isNumeric>Despesas</Th>
                <Th fontSize="10px" color={headerColor} isNumeric>Compras</Th>
                <Th fontSize="10px" color={headerColor} isNumeric>Economia</Th>
                <Th fontSize="10px" color={headerColor} isNumeric>Patrimônio</Th>
                <Th fontSize="10px" color={headerColor} isNumeric>Ticket Médio</Th>
                <Th fontSize="10px" color={headerColor} isNumeric>Score</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr
                  key={row.locationId ?? row.polo}
                  _hover={{ bg: rowHoverBg }}
                  cursor={onRowClick ? 'pointer' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  <Td fontSize="xs">{row.polo}</Td>
                  <Td fontSize="xs" isNumeric>{formatBRL(row.expenses)}</Td>
                  <Td fontSize="xs" isNumeric>{formatBRL(row.purchasesValue)}</Td>
                  <Td fontSize="xs" isNumeric>{formatBRL(row.savings)}</Td>
                  <Td fontSize="xs" isNumeric>{formatBRL(row.patrimony)}</Td>
                  <Td fontSize="xs" isNumeric>{formatBRL(row.averageTicket)}</Td>
                  <Td isNumeric>
                    <Badge colorScheme={scoreColorScheme(row.score)} fontSize="10px">
                      {row.score.toFixed(0)}
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
