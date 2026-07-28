'use client';

import { Box, HStack, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import type { NamedValueDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';
import { colorForIndex } from '../lib/chartColors';

interface PatrimonyByCategoryChartProps {
  data: NamedValueDTO[] | undefined;
  loading: boolean;
}

const CHART_HEIGHT = 260;

interface TreemapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
}

function TreemapCell({ x = 0, y = 0, width = 0, height = 0, name, value, index = 0 }: TreemapCellProps) {
  const fill = colorForIndex(index);
  const canShowLabel = width > 56 && height > 28;
  const canShowValue = width > 70 && height > 44;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={2} rx={4} />
      {canShowLabel && (
        <text x={x + 6} y={y + 16} fontSize={11} fontWeight={600} fill="#fff">
          {name && name.length > 18 ? `${name.slice(0, 17)}…` : name}
        </text>
      )}
      {canShowValue && value !== undefined && (
        <text x={x + 6} y={y + 30} fontSize={10} fill="#fff" opacity={0.9}>
          {formatBRL(value)}
        </text>
      )}
    </g>
  );
}

export function PatrimonyByCategoryChart({ data, loading }: PatrimonyByCategoryChartProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const rows = (data ?? []).filter((row) => row.value > 0);
  const chartData = rows.map((row) => ({ name: row.label, size: row.value }));

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
          Patrimônio por Categoria
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
            <Treemap
              data={chartData}
              dataKey="size"
              nameKey="name"
              stroke="#fff"
              isAnimationActive={false}
              content={<TreemapCell />}
            >
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatBRL(value), 'Patrimônio']} />
            </Treemap>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
