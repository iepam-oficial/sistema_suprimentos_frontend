'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import type { ExecutiveFinanceFilters as ExecutiveFinanceFiltersState } from '@ti-assistant/contracts';
import { PoloMetric, UserRole } from '@ti-assistant/contracts';
import { useAuthSession } from '@/features/identity';
import {
  ExecutiveFinanceAlertsPanel,
  ExecutiveFinanceFilters,
  ExecutiveKpiCards,
  ExpensesByCategoryChart,
  FinancialEvolutionChart,
  NamedValueBarChart,
  PatrimonyByCategoryChart,
  PoloComparisonChart,
  PoloRankingTable,
  SavingsBreakdownChart,
  SavingsEvolutionChart,
  TopSuppliersTable,
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
  const alerts = data?.alerts ?? [];
  const hasAlerts = alerts.length > 0;

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

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
        <FinancialEvolutionChart data={data?.financialEvolution} loading={loading} />
        <PoloComparisonChart
          data={data?.poloComparison}
          metric={filters.poloMetric ?? PoloMetric.DESPESAS}
          onMetricChange={(poloMetric) => setFilters((prev) => ({ ...prev, poloMetric }))}
          loading={loading}
        />
      </SimpleGrid>

      <Flex gap={3} align="flex-start" direction={{ base: 'column', xl: 'row' }}>
        <Box flex="1" minW="0">
          <VStack spacing={3} align="stretch">
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <NamedValueBarChart
                title="Compras por Setor"
                data={data?.purchasesBySector}
                loading={loading}
                valueLabel="Compras"
                emptyLabel="Sem compras por setor no período selecionado"
              />
              <ExpensesByCategoryChart data={data?.expensesByCategory} loading={loading} />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <SavingsBreakdownChart data={data?.savingsBreakdown} loading={loading} />
              <SavingsEvolutionChart data={data?.savingsEvolution} loading={loading} />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <NamedValueBarChart
                title="Patrimônio por Polo"
                data={data?.patrimonyByPolo}
                loading={loading}
                valueLabel="Patrimônio"
                emptyLabel="Sem patrimônio por polo no período selecionado"
              />
              <PatrimonyByCategoryChart data={data?.patrimonyByCategory} loading={loading} />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
              <NamedValueBarChart
                title="Estoque Financeiro"
                data={data?.stockFinancial}
                loading={loading}
                valueLabel="Estoque"
                emptyLabel="Sem dados de estoque financeiro no período selecionado"
              />
              <TopSuppliersTable data={data?.topSuppliers} loading={loading} />
            </SimpleGrid>

            <PoloRankingTable data={data?.poloRanking} loading={loading} />
          </VStack>
        </Box>

        {hasAlerts && (
          <Box w={{ base: 'full', xl: '300px' }} flexShrink={0}>
            <ExecutiveFinanceAlertsPanel alerts={alerts} />
          </Box>
        )}
      </Flex>
    </VStack>
  );
}
