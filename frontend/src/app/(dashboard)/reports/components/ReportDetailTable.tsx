'use client';

import { Fragment, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Heading,
  HStack,
  IconButton,
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
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import type { ReportDetailBlock } from '@ti-assistant/contracts';

interface ReportDetailTableProps {
  headers: string[];
  rows: (string | number)[][];
  rowDetails?: (ReportDetailBlock | null)[];
  defaultOpen?: boolean;
}

const PAGE_SIZES = [10, 25, 50];

function hasDetailRows(detail: ReportDetailBlock | null | undefined): detail is ReportDetailBlock {
  return Boolean(detail && detail.rows.length > 0);
}

export function ReportDetailTable({
  headers,
  rows,
  rowDetails,
  defaultOpen,
}: ReportDetailTableProps) {
  const { colorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(defaultOpen ?? rows.length <= 15);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * pageSize;
  const slice = rows.slice(pageStart, pageStart + pageSize);

  const borderClr = colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const nestedBg = colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50';
  const showExpandColumn = Boolean(rowDetails?.some(hasDetailRows));
  const colSpan = headers.length + (showExpandColumn ? 1 : 0);

  const toggleRow = (absoluteIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(absoluteIndex)) {
        next.delete(absoluteIndex);
      } else {
        next.add(absoluteIndex);
      }
      return next;
    });
  };

  return (
    <Box
      data-testid="reports-table"
      borderTop="1px solid"
      borderColor={borderClr}
      pt={3}
    >
      <HStack
        py={2}
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
        <Box pb={2} overflowX="auto">
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
                {showExpandColumn && <Th w="40px" px={1} />}
                {headers.map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {slice.length === 0 ? (
                <Tr>
                  <Td colSpan={colSpan} color="gray.500">
                    Sem registros
                  </Td>
                </Tr>
              ) : (
                slice.map((row, i) => {
                  const absoluteIndex = pageStart + i;
                  const detail = rowDetails?.[absoluteIndex];
                  const expandable = hasDetailRows(detail);
                  const isExpanded = expandedRows.has(absoluteIndex);

                  return (
                    <Fragment key={`${safePage}-${absoluteIndex}`}>
                      <Tr>
                        {showExpandColumn && (
                          <Td px={1} w="40px">
                            {expandable ? (
                              <IconButton
                                aria-label={isExpanded ? 'Recolher lotes' : 'Expandir lotes'}
                                data-testid={`reports-row-expand-${absoluteIndex}`}
                                size="xs"
                                variant="ghost"
                                icon={
                                  isExpanded
                                    ? <ChevronDown size={14} />
                                    : <ChevronRight size={14} />
                                }
                                onClick={() => toggleRow(absoluteIndex)}
                              />
                            ) : null}
                          </Td>
                        )}
                        {row.map((cell, j) => (
                          <Td key={j}>{cell}</Td>
                        ))}
                      </Tr>
                      {expandable && isExpanded && (
                        <Tr>
                          <Td colSpan={colSpan} bg={nestedBg} py={3} px={4}>
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  {detail.headers.map((h) => (
                                    <Th key={h}>{h}</Th>
                                  ))}
                                </Tr>
                              </Thead>
                              <Tbody>
                                {detail.rows.map((detailRow, di) => (
                                  <Tr key={di}>
                                    {detailRow.map((cell, dj) => (
                                      <Td key={dj}>{cell}</Td>
                                    ))}
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </Collapse>
    </Box>
  );
}
