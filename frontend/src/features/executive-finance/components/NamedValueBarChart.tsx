'use client';

import { Box, HStack, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NamedValueDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface NamedValueBarChartProps {
  title: string;
  data: NamedValueDTO[] | undefined;
  loading: boolean;
  emptyLabel?: string;
  valueLabel?: string;
}

function chartHeightFor(rows: number): number {
  return Math.max(200, Math.min(rows, 8) * 32 + 40);
}

export function NamedValueBarChart({
  title,
  data,
  loading,
  emptyLabel = 'Sem dados no período selecionado',
  valueLabel = 'Valor',
}: NamedValueBarChartProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const gridStroke = useColorModeValue('#E2E8F0', '#4A5568');
  const axisStroke = useColorModeValue('#4A5568', '#A0AEC0');
  const barColor = useColorModeValue('#1D4ED8', '#63B3ED');
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const rows = data ?? [];
  const chartData = rows.map((row) => ({ name: row.label, value: row.value }));
  const chartHeight = chartHeightFor(chartData.length);

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
          {title}
        </Text>
      </HStack>

      {loading && !data ? (
        <Skeleton height={`${chartHeight}px`} borderRadius="md" />
      ) : chartData.length === 0 ? (
        <Box
          h="200px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color={labelColor}
          fontSize="sm"
        >
          {emptyLabel}
        </Box>
      ) : (
        <Box h={`${chartHeight}px`} opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 8, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis
                type="number"
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                tickFormatter={(v: number) => formatBRL(v).replace(/\s/g, '')}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={axisStroke}
                fontSize={11}
                width={100}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatBRL(value), valueLabel]}
              />
              <Bar dataKey="value" name={valueLabel} fill={barColor} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
