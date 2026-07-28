'use client';

import { Box, HStack, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SeriesPointDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface FinancialEvolutionChartProps {
  data: SeriesPointDTO[] | undefined;
  loading: boolean;
}

const CHART_HEIGHT = 240;

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
}

export function FinancialEvolutionChart({ data, loading }: FinancialEvolutionChartProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const gridStroke = useColorModeValue('#E2E8F0', '#4A5568');
  const axisStroke = useColorModeValue('#4A5568', '#A0AEC0');
  const lineColor = useColorModeValue('#1D4ED8', '#63B3ED');
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const chartData = (data ?? []).map((point) => ({
    period: formatPeriodLabel(point.period),
    value: point.value,
  }));

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
          Evolução Financeira
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
            <LineChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="period" stroke={axisStroke} fontSize={11} tickLine={false} />
              <YAxis
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                width={64}
                tickFormatter={(v: number) => formatBRL(v).replace(/\s/g, '')}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value: number) => [formatBRL(value), 'Valor']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                name="Valor"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
