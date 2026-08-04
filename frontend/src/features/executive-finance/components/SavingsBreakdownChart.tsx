'use client';

import { Box, HStack, Skeleton, Text, Tooltip as ChakraTooltip, useColorModeValue } from '@chakra-ui/react';
import { Info } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SavingsBreakdownRowDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface SavingsBreakdownChartProps {
  data: SavingsBreakdownRowDTO[] | undefined;
  loading: boolean;
}

const CHART_HEIGHT = 240;

const ECONOMY_PROXY_NOTE =
  'Economia = maior proposta elegível na cotação (solicitado) − valor efetivamente contratado.';

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
}

export function SavingsBreakdownChart({ data, loading }: SavingsBreakdownChartProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const gridStroke = useColorModeValue('#E2E8F0', '#4A5568');
  const axisStroke = useColorModeValue('#4A5568', '#A0AEC0');
  const requestedColor = useColorModeValue('#94A3B8', '#64748B');
  const contractedColor = useColorModeValue('#1D4ED8', '#63B3ED');
  const savingsColor = useColorModeValue('#059669', '#34D399');
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const chartData = (data ?? []).map((row) => ({
    period: formatPeriodLabel(row.period),
    requested: row.requested,
    contracted: row.contracted,
    savings: row.savings,
  }));

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack justify="space-between" mb={2}>
        <HStack spacing={1}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="wide"
            textTransform="uppercase"
            color={labelColor}
          >
            Economia nas Compras
          </Text>
          <ChakraTooltip label={ECONOMY_PROXY_NOTE} fontSize="xs" hasArrow placement="top">
            <Box as="span" display="inline-flex" color={labelColor} cursor="help">
              <Info size={12} />
            </Box>
          </ChakraTooltip>
        </HStack>
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
            <BarChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
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
                formatter={(value: number, name: string) => [formatBRL(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="requested" name="Solicitado" fill={requestedColor} radius={[3, 3, 0, 0]} />
              <Bar dataKey="contracted" name="Contratado" fill={contractedColor} radius={[3, 3, 0, 0]} />
              <Bar dataKey="savings" name="Economia" fill={savingsColor} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
