'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Heading,
  HStack,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
} from '@chakra-ui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ReportDetailTableProps {
  headers: string[];
  rows: (string | number)[][];
  defaultOpen?: boolean;
}

const PAGE_SIZES = [10, 25, 50];

export function ReportDetailTable({
  headers,
  rows,
  defaultOpen,
}: ReportDetailTableProps) {
  const { colorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(defaultOpen ?? rows.length <= 15);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const borderClr = colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <Box
      rounded="lg"
      border="1px solid"
      borderColor={borderClr}
      overflow="hidden"
    >
      <HStack
        px={4}
        py={3}
        justify="space-between"
        cursor="pointer"
        onClick={() => setIsOpen((o) => !o)}
        _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
      >
        <Heading size="sm">
          Detalhamento ({rows.length} {rows.length === 1 ? 'linha' : 'linhas'})
        </Heading>
        <Button
          size="sm"
          variant="ghost"
          rightIcon={isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((o) => !o);
          }}
        >
          {isOpen ? 'Ocultar' : 'Ver tabela'}
        </Button>
      </HStack>

      <Collapse in={isOpen}>
        <Box px={4} pb={4} overflowX="auto">
          {rows.length > PAGE_SIZES[0] && (
            <HStack mb={3} justify="flex-end" spacing={3}>
              <Text fontSize="xs" color="gray.500">
                Por página
              </Text>
              <Select
                size="xs"
                width="70px"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Button
                size="xs"
                variant="outline"
                isDisabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Text fontSize="xs" color="gray.500">
                {safePage + 1} / {totalPages}
              </Text>
              <Button
                size="xs"
                variant="outline"
                isDisabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </HStack>
          )}

          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                {headers.map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {slice.length === 0 ? (
                <Tr>
                  <Td colSpan={headers.length} color="gray.500">
                    Sem registros
                  </Td>
                </Tr>
              ) : (
                slice.map((row, i) => (
                  <Tr key={`${safePage}-${i}`}>
                    {row.map((cell, j) => (
                      <Td key={j}>{cell}</Td>
                    ))}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </Collapse>
    </Box>
  );
}
