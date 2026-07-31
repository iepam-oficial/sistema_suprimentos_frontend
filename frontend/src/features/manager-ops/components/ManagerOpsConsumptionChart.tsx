'use client';

import { Box, HStack, Select, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ManagerOpsNamedQuantityDTO } from '@ti-assistant/contracts';
import { ManagerOpsConsumptionPeriod } from '@ti-assistant/contracts';

interface ManagerOpsConsumptionChartProps {
  data: ManagerOpsNamedQuantityDTO[] | undefined;
  loading: boolean;
  period: ManagerOpsConsumptionPeriod;
  onPeriodChange: (period: ManagerOpsConsumptionPeriod) => void;
}

const PERIOD_LABEL: Record<ManagerOpsConsumptionPeriod, string> = {
  [ManagerOpsConsumptionPeriod.TODAY]: 'Hoje',
  [ManagerOpsConsumptionPeriod.WEEK]: 'Semana',
  [ManagerOpsConsumptionPeriod.MONTH]: 'Mês',
  [ManagerOpsConsumptionPeriod.YEAR]: 'Ano',
};

function chartHeightFor(rows: number): number {
  return Math.max(200, Math.min(rows, 8) * 32 + 40);
}

export function ManagerOpsConsumptionChart({
  data,
  loading,
  period,
  onPeriodChange,
}: ManagerOpsConsumptionChartProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const gridStroke = useColorModeValue('#E2E8F0', '#4A5568');
  const axisStroke = useColorModeValue('#4A5568', '#A0AEC0');
  const barColor = useColorModeValue('#1D4ED8', '#63B3ED');
  const selectBg = useColorModeValue('white', 'gray.800');
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const rows = data ?? [];
  const chartData = rows.map((row) => ({ name: row.label, value: row.quantity, id: row.id }));
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
          Consumo por Setor
        </Text>
        <Select
          size="xs"
          w="auto"
          bg={selectBg}
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as ManagerOpsConsumptionPeriod)}
        >
          {Object.values(ManagerOpsConsumptionPeriod).map((value) => (
            <option key={value} value={value}>
              {PERIOD_LABEL[value]}
            </option>
          ))}
        </Select>
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
          Sem dados no período selecionado
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
              <XAxis type="number" stroke={axisStroke} fontSize={11} tickLine={false} />
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
                formatter={(value: number) => [value, 'Quantidade']}
              />
              <Bar dataKey="value" name="Quantidade" fill={barColor} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
