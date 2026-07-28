'use client';

import {
  Box,
  HStack,
  SimpleGrid,
  Skeleton,
  Stat,
  StatArrow,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { Info } from 'lucide-react';
import type { ExecutiveFinanceKpisDTO, MoneyTrendDirection } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface ExecutiveKpiCardsProps {
  kpis: ExecutiveFinanceKpisDTO | null;
  loading: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  helpText?: React.ReactNode;
  tooltip?: string;
  emphasize?: boolean;
}

function trendArrowType(trend: MoneyTrendDirection): 'increase' | 'decrease' | undefined {
  if (trend === 'UP') return 'increase';
  if (trend === 'DOWN') return 'decrease';
  return undefined;
}

function formatPct(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function KpiCard({ label, value, helpText, tooltip, emphasize }: KpiCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.900', 'white');
  const accentColor = useColorModeValue('blue.700', 'blue.300');

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={cardBg}
      px={3}
      py={2.5}
    >
      <Stat>
        <HStack spacing={1} mb={0.5}>
          <StatLabel
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="wide"
            textTransform="uppercase"
            color={labelColor}
            noOfLines={1}
          >
            {label}
          </StatLabel>
          {tooltip && (
            <Tooltip label={tooltip} fontSize="xs" hasArrow placement="top">
              <Box as="span" display="inline-flex" color={labelColor} cursor="help">
                <Info size={12} />
              </Box>
            </Tooltip>
          )}
        </HStack>
        <StatNumber
          fontSize={{ base: 'xl', xl: '2xl' }}
          fontWeight="bold"
          lineHeight="shorter"
          color={emphasize ? accentColor : valueColor}
        >
          {value}
        </StatNumber>
        {helpText && (
          <Text fontSize="xs" color={labelColor} mt={0.5} noOfLines={1}>
            {helpText}
          </Text>
        )}
      </Stat>
    </Box>
  );
}

function KpiCardSkeleton() {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} px={3} py={2.5}>
      <Skeleton height="10px" width="60%" mb={2} />
      <Skeleton height="24px" width="80%" mb={2} />
      <Skeleton height="10px" width="50%" />
    </Box>
  );
}

export function ExecutiveKpiCards({ kpis, loading }: ExecutiveKpiCardsProps) {
  if (!kpis) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
        {Array.from({ length: 7 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    );
  }

  const { totalExpenses, purchases, savings, patrimonyAcquired, extraExpenses, averageTicket, pendingPurchases } =
    kpis;

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3} opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
      <KpiCard
        label="Despesas Totais"
        value={formatBRL(totalExpenses.value)}
        emphasize
        helpText={
          <HStack spacing={1}>
            {trendArrowType(totalExpenses.trend) && <StatArrow type={trendArrowType(totalExpenses.trend)} />}
            <Text as="span">{formatPct(totalExpenses.deltaPct)} vs período anterior</Text>
          </HStack>
        }
      />

      <KpiCard
        label="Compras Realizadas"
        value={formatBRL(purchases.value)}
        helpText={`${purchases.count} compra(s) · ${formatPct(purchases.growthPct)} vs período anterior`}
      />

      <KpiCard
        label="Economia"
        value={formatBRL(savings.value)}
        tooltip="Proxy: valor solicitado (maior proposta elegível na cotação) menos valor contratado."
        helpText={`${formatPct(savings.reductionPct)} de redução`}
      />

      <KpiCard label="Patrimônio Adquirido" value={formatBRL(patrimonyAcquired)} helpText="No período filtrado" />

      <KpiCard label="Despesas Extras" value={formatBRL(extraExpenses)} helpText="Não incluídas em Despesas Totais" />

      <KpiCard label="Ticket Médio" value={formatBRL(averageTicket)} helpText="Por compra concluída" />

      <KpiCard
        label="Compras Pendentes"
        value={String(pendingPurchases.count)}
        helpText={`${formatBRL(pendingPurchases.value)} em aberto`}
      />
    </SimpleGrid>
  );
}
