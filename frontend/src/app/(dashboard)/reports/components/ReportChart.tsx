'use client';

import { Box, useColorMode } from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatBRL } from '@/utils/money';
import {
  getSliceColor,
  prepareChartDataForDisplay,
  resolveChartType,
} from '@/features/reports/chartConfig';
import { ChartRow, ChartType, ReportSlug } from '@/features/reports/types';

interface ReportChartProps {
  slug?: ReportSlug;
  data: ChartRow[];
  type: ChartType;
  emptyMessage?: string;
  colorByLabel?: boolean;
  dataKey?: 'count' | 'value';
  showLegend?: boolean;
  height?: number;
}

function formatTooltipValue(value: number, dataKey: 'count' | 'value') {
  if (dataKey === 'value') return formatBRL(value);
  return value.toLocaleString('pt-BR');
}

export function ReportChart({
  slug,
  data,
  type: backendType,
  emptyMessage = 'Sem dados para exibir',
  colorByLabel = false,
  dataKey = 'count',
  showLegend = true,
  height,
}: ReportChartProps) {
  const { colorMode } = useColorMode();
  const gridStroke = colorMode === 'dark' ? '#4A5568' : '#E2E8F0';
  const axisStroke = colorMode === 'dark' ? '#A0AEC0' : '#4A5568';
  const tooltipStyle = {
    backgroundColor: colorMode === 'dark' ? '#1A202C' : '#fff',
    border: `1px solid ${colorMode === 'dark' ? '#2D3748' : '#E2E8F0'}`,
    color: colorMode === 'dark' ? '#fff' : '#1A202C',
    borderRadius: '8px',
  };

  const resolvedType = slug ? resolveChartType(slug, backendType, data) : backendType;
  const { displayData, truncated } = prepareChartDataForDisplay(data, resolvedType, dataKey);

  if (!displayData.length) {
    return (
      <Box
        h={height ?? 280}
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="gray.500"
      >
        {emptyMessage}
      </Box>
    );
  }

  const chartData = displayData.map((d) => ({
    name: d.label,
    count: d.count,
    value: d.value ?? d.count,
  }));

  const valueLabel = dataKey === 'value' ? 'Valor (R$)' : 'Quantidade';

  if (resolvedType === 'donut' || resolvedType === 'pie') {
    const h = height ?? 300;
    const innerRadius = resolvedType === 'donut' ? '55%' : 0;
    return (
      <Box h={h}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey={dataKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius="80%"
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
              }
              labelLine={chartData.length <= 6}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getSliceColor(entry.name, index, colorByLabel)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [formatTooltipValue(val, dataKey), valueLabel]}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  if (resolvedType === 'bar-horizontal') {
    const h = height ?? Math.max(280, chartData.length * 36);
    return (
      <Box h={h}>
        {truncated && (
          <Box fontSize="xs" color="gray.500" mb={2}>
            Exibindo os 10 principais{data.length > 10 ? ` de ${data.length}` : ''}.
          </Box>
        )}
        <ResponsiveContainer width="100%" height={truncated ? h - 24 : h}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
            <XAxis type="number" stroke={axisStroke} fontSize={11} tickFormatter={(v) =>
              dataKey === 'value' ? formatBRL(v).replace(/\s/g, '') : String(v)
            } />
            <YAxis
              type="category"
              dataKey="name"
              stroke={axisStroke}
              fontSize={11}
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [formatTooltipValue(val, dataKey), valueLabel]}
            />
            <Bar dataKey={dataKey} name={valueLabel} radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getSliceColor(entry.name, index, colorByLabel)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  const cartesianHeight = height ?? 280;

  if (resolvedType === 'area') {
    return (
      <Box h={cartesianHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="reportAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
            <YAxis stroke={axisStroke} fontSize={12} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [formatTooltipValue(val, dataKey), valueLabel]}
            />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              fill="url(#reportAreaFill)"
              name={valueLabel}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  if (resolvedType === 'line') {
    return (
      <Box h={cartesianHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
            <YAxis stroke={axisStroke} fontSize={12} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(val: number) => [formatTooltipValue(val, dataKey), valueLabel]}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              name={valueLabel}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  return (
    <Box h={cartesianHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="name"
            stroke={axisStroke}
            fontSize={11}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={70}
          />
          <YAxis stroke={axisStroke} fontSize={12} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val: number) => [formatTooltipValue(val, dataKey), valueLabel]}
          />
          {showLegend && <Legend />}
          <Bar dataKey={dataKey} name={valueLabel} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getSliceColor(entry.name, index, colorByLabel)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
