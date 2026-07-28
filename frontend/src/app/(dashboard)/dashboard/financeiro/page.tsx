'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ExecutiveFinanceFilters as ExecutiveFinanceFiltersState } from '@ti-assistant/contracts';
import { UserRole } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import {
  ExecutiveFinanceFilters,
  ExecutiveKpiCards,
  getDefaultExecutiveFinanceFilters,
  useExecutiveFinanceDashboard,
} from '@/features/executive-finance';

export default function ExecutiveFinanceDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [filters, setFilters] = useState<ExecutiveFinanceFiltersState>(
    getDefaultExecutiveFinanceFilters
  );

  const isDirector = user?.role === UserRole.DIRECTOR;

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isDirector) {
      router.replace('/unauthorized');
    }
  }, [authLoading, user, isDirector, router]);

  const { data, loading, error, isStale } = useExecutiveFinanceDashboard(filters);

  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.500', 'gray.400');
  const bg = useColorModeValue('gray.50', 'gray.900');

  if (authLoading || !user || !isDirector) {
    return (
      <Center minH="60vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <VStack
      spacing={3}
      align="stretch"
      bg={bg}
      minH="0"
      py={{ base: 2, md: 3 }}
      px={{ base: 3, md: 4, lg: 5 }}
    >
      <Box>
        <Heading size="md" color={textColor} fontWeight="bold" letterSpacing="tight">
          Dashboard Financeiro
        </Heading>
        <Text color={textSecondary} fontSize="sm">
          Visão executiva consolidada — Diretoria
        </Text>
      </Box>

      {(isStale || error) && (
        <Alert status="warning" borderRadius="md" py={2}>
          <AlertIcon />
          <Text fontSize="sm">
            {error ?? 'Dados desatualizados: a última atualização automática falhou. Exibindo o último resultado válido.'}
          </Text>
        </Alert>
      )}

      <ExecutiveFinanceFilters filters={filters} onChange={setFilters} />

      <ExecutiveKpiCards kpis={data?.kpis ?? null} loading={loading} />

      {/* TODO(T11): Evolução Financeira + Comparativo entre Polos abaixo dos KPIs */}
    </VStack>
  );
}
