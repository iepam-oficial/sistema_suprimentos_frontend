'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Heading,
  Skeleton,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AbcClassificationSummaryDTO } from '@ti-assistant/contracts';
import { Layers } from 'lucide-react';
import { useAuthSession } from '@/features/identity';
import { formatBRL } from '@/utils/money';
import { fetchAbcClassificationSummary } from '../api';

const CHART_HEIGHT = 220;

type ClassKey = keyof AbcClassificationSummaryDTO['by_class'];

const CLASS_ORDER: ClassKey[] = ['A', 'B', 'C', 'UNCLASSIFIED'];

const CLASS_LABEL: Record<ClassKey, string> = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
  UNCLASSIFIED: 'Não classificado',
};

/** Aligns with abcBadgeColorScheme (A orange, B yellow, C gray) + slate for unclassified. */
const CLASS_COLORS: Record<ClassKey, { light: string; dark: string }> = {
  A: { light: '#EA580C', dark: '#FB923C' },
  B: { light: '#CA8A04', dark: '#FACC15' },
  C: { light: '#6B7280', dark: '#9CA3AF' },
  UNCLASSIFIED: { light: '#64748B', dark: '#94A3B8' },
};

function formatClassifiedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function CardSkeleton() {
  return (
    <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
      <Skeleton height={`${CHART_HEIGHT}px`} borderRadius="md" flex="1" />
      <Skeleton height={`${CHART_HEIGHT}px`} borderRadius="md" flex="1" />
    </Flex>
  );
}

export function ManagerOpsAbcClassificationCard() {
  const { token } = useAuthSession();
  const [data, setData] = useState<AbcClassificationSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const noticeColor = useColorModeValue('gray.600', 'gray.400');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const gridStroke = useColorModeValue('#E2E8F0', '#4A5568');
  const axisStroke = useColorModeValue('#4A5568', '#A0AEC0');
  const legendColor = useColorModeValue('gray.700', 'gray.300');
  const isDark = useColorModeValue(false, true);
  const tooltipStyle = {
    backgroundColor: useColorModeValue('#fff', '#1A202C'),
    border: `1px solid ${useColorModeValue('#E2E8F0', '#2D3748')}`,
    color: useColorModeValue('#1A202C', '#fff'),
    borderRadius: '8px',
    fontSize: '12px',
  };

  const load = useCallback(async () => {
    if (!token) {
      setError('Token não encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const summary = await fetchAbcClassificationSummary(token);
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar classificação ABC');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const colorFor = useCallback(
    (key: ClassKey) => (isDark ? CLASS_COLORS[key].dark : CLASS_COLORS[key].light),
    [isDark]
  );

  const countRows = useMemo(() => {
    if (!data) return [];
    return CLASS_ORDER.filter((key) => key !== 'UNCLASSIFIED' || data.by_class.UNCLASSIFIED.count > 0).map(
      (key) => ({
        key,
        name: CLASS_LABEL[key],
        value: data.by_class[key].count,
        fill: colorFor(key),
      })
    );
  }, [data, colorFor]);

  const valueRows = useMemo(() => {
    if (!data) return [];
    return CLASS_ORDER.filter((key) => {
      const entry = data.by_class[key];
      if (key === 'UNCLASSIFIED') return entry.count > 0 && entry.period_value > 0;
      return entry.period_value > 0;
    }).map((key) => ({
      key,
      name: CLASS_LABEL[key],
      value: data.by_class[key].period_value,
      fill: colorFor(key),
    }));
  }, [data, colorFor]);

  const notice =
    data && data.classified_at
      ? `Classificação ABC — últimos ${data.analysis_period_months} meses (atualizado em ${formatClassifiedDate(data.classified_at)})`
      : null;

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} p={3}>
      <HStack spacing={1.5} mb={1}>
        <Box as="span" display="inline-flex" color={iconColor}>
          <Layers size={16} />
        </Box>
        <Heading
          size="xs"
          fontWeight="semibold"
          letterSpacing="wide"
          textTransform="uppercase"
          color={labelColor}
        >
          Classificação ABC
        </Heading>
      </HStack>

      {notice && (
        <Text fontSize="xs" color={noticeColor} mb={3}>
          {notice}
        </Text>
      )}

      {loading && !data ? (
        <CardSkeleton />
      ) : error && !data ? (
        <Text fontSize="sm" color={labelColor} py={4} textAlign="center">
          {error}
        </Text>
      ) : !data || data.classified_at == null ? (
        <Text fontSize="sm" color={labelColor} py={4} textAlign="center">
          Nenhuma classificação ABC disponível. Execute o recálculo para gerar o snapshot.
        </Text>
      ) : (
        <Flex gap={3} direction={{ base: 'column', md: 'row' }} align="stretch">
          <VStack align="stretch" spacing={1.5} flex="1" minW="0">
            <Text fontSize="xs" fontWeight="semibold" color={labelColor} textTransform="uppercase">
              Itens por classe
            </Text>
            <Box h={`${CHART_HEIGHT}px`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={11} tickLine={false} />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    width={40}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [value, 'Itens']}
                  />
                  <Bar dataKey="value" name="Itens" radius={[3, 3, 0, 0]}>
                    {countRows.map((row) => (
                      <Cell key={row.key} fill={row.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </VStack>

          <VStack align="stretch" spacing={1.5} flex="1" minW="0">
            <Text fontSize="xs" fontWeight="semibold" color={labelColor} textTransform="uppercase">
              Valor de consumo por classe
            </Text>
            {valueRows.length === 0 ? (
              <Box
                h={`${CHART_HEIGHT}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color={labelColor}
                fontSize="sm"
              >
                Sem valor de consumo no período classificado
              </Box>
            ) : (
              <Box h={`${CHART_HEIGHT}px`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={valueRows}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius="45%"
                      outerRadius="75%"
                      paddingAngle={2}
                    >
                      {valueRows.map((row) => (
                        <Cell key={row.key} fill={row.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [formatBRL(value), 'Valor']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: '11px', color: legendColor }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </VStack>
        </Flex>
      )}
    </Box>
  );
}
