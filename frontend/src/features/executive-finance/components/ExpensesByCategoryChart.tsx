'use client';

import { Box, HStack, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { NamedValueDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';
import { colorForIndex } from '../lib/chartColors';

interface ExpensesByCategoryChartProps {
  data: NamedValueDTO[] | undefined;
  loading: boolean;
  /** Drill-down level 2 (EFD-23): clicking a slice filters the dashboard inline by categoria. */
  onItemClick?: (item: NamedValueDTO) => void;
}

const CHART_HEIGHT = 260;

export function ExpensesByCategoryChart({ data, loading, onItemClick }: ExpensesByCategoryChartProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const legendColor = useColorModeValue('gray.700', 'gray.300');
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const rows = (data ?? []).filter((row) => row.value > 0);
  const chartData = rows.map((row) => ({ name: row.label, value: row.value, id: row.id }));

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
          Despesas por Categoria
        </Text>
      </HStack>

      {loading && !data ? (
        <Skeleton height={`${CHART_HEIGHT}px`} borderRadius="md" />
      ) : chartData.length === 0 ? (
        <Box
          h={`${CHART_HEIGHT}px`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={labelColor}
          fontSize="sm"
        >
          Sem dados no período selecionado
        </Box>
      ) : (
        <Box h={`${CHART_HEIGHT}px`} opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius="45%"
                outerRadius="75%"
                paddingAngle={1}
                cursor={onItemClick ? 'pointer' : undefined}
                onClick={
                  onItemClick
                    ? (slice: { id: string | null; name: string; value: number }) =>
                        onItemClick({ id: slice.id, label: slice.name, value: slice.value })
                    : undefined
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={colorForIndex(index)} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatBRL(value), 'Despesas']} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '11px', color: legendColor }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
