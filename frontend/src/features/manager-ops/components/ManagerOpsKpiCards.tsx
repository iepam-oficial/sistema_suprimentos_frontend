'use client';

import {
  Box,
  SimpleGrid,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ManagerOpsKpisDTO } from '@ti-assistant/contracts';
import { formatBRL } from '@/utils/money';

interface ManagerOpsKpiCardsProps {
  kpis: ManagerOpsKpisDTO | null;
  loading: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

function KpiCard({ label, value, emphasize }: KpiCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.900', 'white');
  const accentColor = useColorModeValue('blue.700', 'blue.300');

  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={cardBg} px={3} py={2.5}>
      <Stat>
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
        <StatNumber
          fontSize={{ base: 'xl', xl: '2xl' }}
          fontWeight="bold"
          lineHeight="shorter"
          color={emphasize ? accentColor : valueColor}
        >
          {value}
        </StatNumber>
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
      <Skeleton height="24px" width="80%" />
    </Box>
  );
}

export function ManagerOpsKpiCards({ kpis, loading }: ManagerOpsKpiCardsProps) {
  if (!kpis) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 6 }} spacing={3}>
        {Array.from({ length: 6 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    );
  }

  const { products, inStock, lowStock, pendingRequests, purchasesInProgress, stockValue } = kpis;

  return (
    <SimpleGrid
      columns={{ base: 1, sm: 2, lg: 3, xl: 6 }}
      spacing={3}
      opacity={loading ? 0.6 : 1}
      transition="opacity 0.2s"
    >
      <KpiCard label="Produtos" value={String(products)} />
      <KpiCard label="Em Estoque" value={String(inStock)} />
      <KpiCard label="Estoque Baixo" value={String(lowStock)} />
      <KpiCard label="Requisições Pendentes" value={String(pendingRequests)} />
      <KpiCard label="Compras em Andamento" value={String(purchasesInProgress)} />
      <KpiCard label="Valor em Estoque" value={formatBRL(stockValue)} emphasize />
    </SimpleGrid>
  );
}
